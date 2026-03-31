import json
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from config import get_api_key


class AIProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list, system: str = "", stream: bool = False) -> str | AsyncGenerator:
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        pass

    async def chat_with_tools(self, messages: list, tools: list, system: str = "") -> dict:
        raise NotImplementedError("This provider does not support tool calling")


class AnthropicProvider(AIProvider):
    def __init__(self, model: str = "claude-sonnet-4-5-20250929", temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
        self.api_key = get_api_key("anthropic")

    async def chat(self, messages: list, system: str = "", stream: bool = False):
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=self.api_key)

        kwargs = {
            "model": self.model,
            "max_tokens": 4096,
            "temperature": self.temperature,
            "messages": messages,
        }
        if system:
            kwargs["system"] = system

        if stream:
            async def generate():
                async with client.messages.stream(**kwargs) as s:
                    async for text in s.text_stream:
                        yield text
            return generate()
        else:
            response = await client.messages.create(**kwargs)
            return response.content[0].text

    async def chat_with_tools(self, messages: list, tools: list, system: str = "") -> dict:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=self.api_key)

        kwargs = {
            "model": self.model,
            "max_tokens": 4096,
            "temperature": self.temperature,
            "messages": messages,
            "tools": tools,
        }
        if system:
            kwargs["system"] = system

        response = await client.messages.create(**kwargs)

        content = []
        for block in response.content:
            if block.type == "text":
                content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        return {
            "stop_reason": "tool_use" if response.stop_reason == "tool_use" else "end_turn",
            "content": content,
        }

    async def test_connection(self) -> bool:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            await client.messages.create(
                model=self.model, max_tokens=10,
                messages=[{"role": "user", "content": "hi"}]
            )
            return True
        except Exception:
            return False


class OpenAIProvider(AIProvider):
    def __init__(self, model: str = "gpt-4o", temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
        self.api_key = get_api_key("openai")

    async def chat(self, messages: list, system: str = "", stream: bool = False):
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)

        chat_messages = []
        if system:
            chat_messages.append({"role": "system", "content": system})
        chat_messages.extend(messages)

        if stream:
            async def generate():
                response = await client.chat.completions.create(
                    model=self.model,
                    temperature=self.temperature,
                    messages=chat_messages,
                    stream=True,
                )
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            return generate()
        else:
            response = await client.chat.completions.create(
                model=self.model,
                temperature=self.temperature,
                messages=chat_messages,
            )
            return response.choices[0].message.content

    async def chat_with_tools(self, messages: list, tools: list, system: str = "") -> dict:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)

        chat_messages = []
        if system:
            chat_messages.append({"role": "system", "content": system})
        chat_messages.extend(messages)

        response = await client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=chat_messages,
            tools=tools,
        )

        choice = response.choices[0]
        msg = choice.message

        content = []
        if msg.content:
            content.append({"type": "text", "text": msg.content})

        has_tool_calls = False
        if msg.tool_calls:
            has_tool_calls = True
            for tc in msg.tool_calls:
                content.append({
                    "type": "tool_use",
                    "id": tc.id,
                    "name": tc.function.name,
                    "input": json.loads(tc.function.arguments),
                })

        return {
            "stop_reason": "tool_use" if has_tool_calls else "end_turn",
            "content": content,
            "_openai_assistant_message": msg,
        }

    async def test_connection(self) -> bool:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            await client.chat.completions.create(
                model="gpt-4o-mini", max_tokens=10,
                messages=[{"role": "user", "content": "hi"}]
            )
            return True
        except Exception:
            return False


class OllamaProvider(AIProvider):
    def __init__(self, model: str = "llama3.1", base_url: str = "http://localhost:11434", temperature: float = 0.7):
        self.model = model
        self.base_url = base_url
        self.temperature = temperature

    async def chat(self, messages: list, system: str = "", stream: bool = False):
        import ollama
        client = ollama.AsyncClient(host=self.base_url)

        chat_messages = []
        if system:
            chat_messages.append({"role": "system", "content": system})
        chat_messages.extend(messages)

        if stream:
            async def generate():
                response = await client.chat(
                    model=self.model,
                    messages=chat_messages,
                    stream=True,
                    options={"temperature": self.temperature},
                )
                async for chunk in response:
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
            return generate()
        else:
            response = await client.chat(
                model=self.model,
                messages=chat_messages,
                options={"temperature": self.temperature},
            )
            return response["message"]["content"]

    async def test_connection(self) -> bool:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                r = await client.get(f"{self.base_url}/api/tags", timeout=5)
                return r.status_code == 200
        except Exception:
            return False


def get_provider(settings) -> AIProvider:
    provider = settings.active_provider
    model = settings.active_model
    temp = settings.ai_temperature

    if provider == "anthropic":
        return AnthropicProvider(model=model, temperature=temp)
    elif provider == "openai":
        return OpenAIProvider(model=model, temperature=temp)
    elif provider == "ollama":
        return OllamaProvider(model=model, base_url=settings.ollama_base_url, temperature=temp)
    else:
        return AnthropicProvider(model=model, temperature=temp)


def provider_supports_tools(settings) -> bool:
    """Return True if the active provider supports tool/function calling."""
    return settings.active_provider in ("anthropic", "openai")
