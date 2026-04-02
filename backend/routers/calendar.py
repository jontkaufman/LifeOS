import json
import base64
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from config import load_google_credentials, load_google_tokens, save_google_credentials
from services.google_calendar import build_auth_url, exchange_code, fetch_events, disconnect, create_event, update_event, delete_event

router = APIRouter()


@router.get("/status")
async def get_status():
    client_id, client_secret = load_google_credentials()
    credentials_configured = bool(client_id and client_secret)
    tokens = load_google_tokens()
    connected = bool(tokens and tokens.get("access_token"))
    return {"credentials_configured": credentials_configured, "connected": connected}


@router.post("/credentials")
async def save_credentials(data: dict):
    client_id = data.get("client_id", "").strip()
    client_secret = data.get("client_secret", "").strip()
    if not client_id or not client_secret:
        return {"error": "Both client_id and client_secret are required"}
    save_google_credentials(client_id, client_secret)
    return {"status": "ok"}


@router.get("/auth-url")
async def get_auth_url(request: Request, origin: str = ""):
    # Use the frontend origin for the redirect URI so it matches what's in Google Console
    frontend_origin = origin.rstrip("/") if origin else str(request.base_url).rstrip("/")
    redirect_uri = frontend_origin + "/api/calendar/oauth/callback"
    # Encode frontend origin into state so the callback can redirect back correctly
    state = base64.urlsafe_b64encode(json.dumps({"origin": frontend_origin, "redirect_uri": redirect_uri}).encode()).decode()
    try:
        url = build_auth_url(redirect_uri, state=state)
        return {"url": url, "redirect_uri": redirect_uri}
    except ValueError as e:
        return {"error": str(e)}


@router.get("/oauth/callback")
async def oauth_callback(request: Request, code: str = "", state: str = ""):
    # Decode frontend origin and redirect_uri from state
    frontend_origin = ""
    redirect_uri = ""
    if state:
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state + "=="))
            frontend_origin = state_data.get("origin", "")
            redirect_uri = state_data.get("redirect_uri", "")
        except Exception:
            pass

    if not redirect_uri:
        redirect_uri = str(request.base_url).rstrip("/") + "/api/calendar/oauth/callback"

    if not code:
        target = f"{frontend_origin}/settings?tab=integrations&google=error" if frontend_origin else "/settings?tab=integrations&google=error"
        return RedirectResponse(target)

    try:
        await exchange_code(code, redirect_uri)
        target = f"{frontend_origin}/settings?tab=integrations&google=connected" if frontend_origin else "/settings?tab=integrations&google=connected"
        return RedirectResponse(target)
    except Exception:
        target = f"{frontend_origin}/settings?tab=integrations&google=error" if frontend_origin else "/settings?tab=integrations&google=error"
        return RedirectResponse(target)


@router.delete("/disconnect")
async def disconnect_calendar():
    disconnect()
    return {"status": "ok"}


@router.get("/events")
async def get_events(days: int = 7):
    try:
        events = await fetch_events(days_ahead=days)
        return events
    except ValueError as e:
        return {"error": str(e), "events": []}
    except Exception as e:
        return {"error": str(e), "events": []}


@router.post("/events")
async def create_new_event(data: dict):
    try:
        event = await create_event(
            summary=data.get("summary", ""),
            start=data.get("start", ""),
            end=data.get("end", ""),
            description=data.get("description", ""),
            location=data.get("location", ""),
            all_day=data.get("all_day", False),
        )
        return event
    except Exception as e:
        return {"error": str(e)}


@router.put("/events/{event_id}")
async def update_existing_event(event_id: str, data: dict):
    try:
        event = await update_event(
            event_id=event_id,
            summary=data.get("summary"),
            start=data.get("start"),
            end=data.get("end"),
            description=data.get("description"),
            location=data.get("location"),
            all_day=data.get("all_day"),
        )
        return event
    except Exception as e:
        return {"error": str(e)}


@router.delete("/events/{event_id}")
async def delete_existing_event(event_id: str):
    try:
        await delete_event(event_id)
        return {"status": "deleted"}
    except Exception as e:
        return {"error": str(e)}
