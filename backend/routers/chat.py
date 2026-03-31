import json
import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, async_session
from models.chat import Conversation, Message, ActionItem

router = APIRouter()


@router.get("/conversations")
async def get_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(Conversation.is_active == True).order_by(Conversation.updated_at.desc())
    )
    convos = result.scalars().all()
    return [{
        "id": c.id, "title": c.title, "mode": c.mode,
        "created_at": c.created_at.isoformat(), "updated_at": c.updated_at.isoformat(),
    } for c in convos]


@router.post("/conversations")
async def create_conversation(data: dict, db: AsyncSession = Depends(get_db)):
    mode = data.get("mode", "open")
    convo = Conversation(mode=mode, title=data.get("title"))
    db.add(convo)
    await db.commit()
    await db.refresh(convo)

    # Add opening protocol message
    from presets.chat_protocols import CHAT_MODES
    mode_config = CHAT_MODES.get(mode, CHAT_MODES["open"])
    opening_msg = Message(
        conversation_id=convo.id,
        role="assistant",
        content=mode_config["opening"],
    )
    db.add(opening_msg)
    await db.commit()

    return {"id": convo.id, "mode": mode}


@router.get("/conversations/{convo_id}")
async def get_conversation(convo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == convo_id))
    convo = result.scalar_one_or_none()
    if not convo:
        return {"error": "Not found"}
    msgs_result = await db.execute(
        select(Message).where(Message.conversation_id == convo_id).order_by(Message.created_at)
    )
    messages = msgs_result.scalars().all()
    return {
        "id": convo.id, "title": convo.title, "mode": convo.mode, "summary": convo.summary,
        "messages": [{
            "id": m.id, "role": m.role, "content": m.content,
            "is_pinned": m.is_pinned, "created_at": m.created_at.isoformat(),
        } for m in messages],
    }


@router.delete("/conversations/{convo_id}")
async def delete_conversation(convo_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == convo_id))
    convo = result.scalar_one_or_none()
    if convo:
        convo.is_active = False
        await db.commit()
    return {"status": "ok"}


@router.websocket("/ws/{convo_id}")
async def websocket_chat(websocket: WebSocket, convo_id: int):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            user_content = msg_data.get("content", "")

            async with async_session() as db:
                # Save user message
                user_msg = Message(conversation_id=convo_id, role="user", content=user_content)
                db.add(user_msg)
                await db.commit()

                # Check for crisis
                from services.crisis_detector import detect_crisis
                crisis = detect_crisis(user_content)
                if crisis:
                    await websocket.send_text(json.dumps({"type": "crisis", "data": crisis}))

                # Get conversation history
                msgs_result = await db.execute(
                    select(Message).where(Message.conversation_id == convo_id).order_by(Message.created_at)
                )
                messages = msgs_result.scalars().all()

                # Get conversation mode
                convo_result = await db.execute(select(Conversation).where(Conversation.id == convo_id))
                convo = convo_result.scalar_one()

                # Build context and system prompt
                from services.context_builder import build_context
                from services.system_prompt import build_system_prompt
                from services.ai_provider import get_provider
                from routers.settings import get_or_create_settings

                settings = await get_or_create_settings(db)
                provider = get_provider(settings)

                from services.ai_provider import provider_supports_tools

                use_tools = provider_supports_tools(settings)
                system = await build_system_prompt(db, convo.mode, crisis, tools_enabled=use_tools)
                chat_messages = await build_context(db, messages, settings.context_max_tokens)

                full_response = ""
                try:
                    if use_tools:
                        # Branch A: Tool-capable providers (Anthropic/OpenAI)
                        from services.chat_tools import (
                            tools_for_anthropic, tools_for_openai,
                            execute_tool, TOOL_DISPLAY_NAMES,
                        )

                        if settings.active_provider == "anthropic":
                            tools = tools_for_anthropic()
                        else:
                            tools = tools_for_openai()

                        tool_messages = list(chat_messages)
                        MAX_TOOL_ITERATIONS = 5

                        for _ in range(MAX_TOOL_ITERATIONS):
                            response = await provider.chat_with_tools(
                                messages=tool_messages, tools=tools, system=system,
                            )

                            # Send any text content as chunks
                            for block in response["content"]:
                                if block["type"] == "text" and block["text"]:
                                    full_response += block["text"]
                                    await websocket.send_text(json.dumps({
                                        "type": "chunk", "content": block["text"],
                                    }))

                            if response["stop_reason"] != "tool_use":
                                break

                            # Build assistant message for conversation threading
                            if settings.active_provider == "anthropic":
                                tool_messages.append({"role": "assistant", "content": response["content"]})
                            else:
                                # OpenAI: use the raw message object
                                oai_msg = response["_openai_assistant_message"]
                                tool_messages.append({"role": "assistant", "content": oai_msg.content, "tool_calls": [
                                    {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                                    for tc in (oai_msg.tool_calls or [])
                                ]})

                            # Execute each tool call
                            tool_results_for_msg = []
                            for block in response["content"]:
                                if block["type"] != "tool_use":
                                    continue

                                tool_name = block["name"]
                                display_name = TOOL_DISPLAY_NAMES.get(tool_name, tool_name)
                                await websocket.send_text(json.dumps({
                                    "type": "tool_start",
                                    "tool": tool_name,
                                    "display_name": display_name,
                                }))

                                result = await execute_tool(tool_name, block["input"], db)

                                await websocket.send_text(json.dumps({
                                    "type": "tool_result",
                                    "tool": tool_name,
                                    "result": result,
                                }))

                                tool_results_for_msg.append({
                                    "tool_use_id": block["id"],
                                    "name": tool_name,
                                    "result": result,
                                })

                            # Append tool results in provider-specific format
                            if settings.active_provider == "anthropic":
                                tool_messages.append({
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "tool_result",
                                            "tool_use_id": tr["tool_use_id"],
                                            "content": json.dumps(tr["result"]),
                                        }
                                        for tr in tool_results_for_msg
                                    ],
                                })
                            else:
                                for tr in tool_results_for_msg:
                                    tool_messages.append({
                                        "role": "tool",
                                        "tool_call_id": tr["tool_use_id"],
                                        "content": json.dumps(tr["result"]),
                                    })

                    else:
                        # Branch B: Streaming providers (Ollama)
                        async for chunk in await provider.chat(
                            messages=chat_messages,
                            system=system,
                            stream=True,
                        ):
                            full_response += chunk
                            await websocket.send_text(json.dumps({"type": "chunk", "content": chunk}))

                except Exception as e:
                    await websocket.send_text(json.dumps({"type": "error", "content": str(e)}))
                    continue

                # Save assistant message
                assistant_msg = Message(
                    conversation_id=convo_id,
                    role="assistant",
                    content=full_response,
                )
                db.add(assistant_msg)

                # Update conversation title if first exchange
                if len(messages) <= 2 and not convo.title:
                    convo.title = user_content[:100]

                convo.updated_at = datetime.utcnow()
                await db.commit()

                await websocket.send_text(json.dumps({"type": "done"}))

                # Trigger coaching notes if enough messages
                if len(messages) >= 6:
                    asyncio.create_task(_update_coaching_notes(convo_id))

    except WebSocketDisconnect:
        pass


async def _update_coaching_notes(convo_id: int):
    try:
        from services.coaching_notes_service import generate_coaching_notes
        await generate_coaching_notes(convo_id)
    except Exception:
        pass


@router.post("/messages/{message_id}/pin")
async def toggle_pin(message_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).where(Message.id == message_id))
    msg = result.scalar_one_or_none()
    if msg:
        msg.is_pinned = not msg.is_pinned
        await db.commit()
    return {"status": "ok"}


@router.get("/action-items")
async def get_action_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ActionItem).where(ActionItem.is_completed == False).order_by(ActionItem.created_at.desc())
    )
    items = result.scalars().all()
    return [{
        "id": i.id, "text": i.text, "is_completed": i.is_completed,
        "due_date": str(i.due_date) if i.due_date else None,
        "created_at": i.created_at.isoformat(),
    } for i in items]


@router.put("/action-items/{item_id}")
async def toggle_action_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ActionItem).where(ActionItem.id == item_id))
    item = result.scalar_one_or_none()
    if item:
        item.is_completed = not item.is_completed
        item.completed_at = datetime.utcnow() if item.is_completed else None
        await db.commit()
    return {"status": "ok"}
