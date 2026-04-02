"""Google Calendar OAuth + API integration."""

import urllib.parse
from datetime import datetime, timedelta, timezone
import httpx
from config import (
    load_google_credentials,
    load_google_tokens,
    save_google_tokens,
    remove_google_tokens,
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
SCOPES = "https://www.googleapis.com/auth/calendar"


def get_google_credentials() -> tuple[str | None, str | None]:
    return load_google_credentials()


def build_auth_url(redirect_uri: str, state: str = "") -> str:
    client_id, _ = get_google_credentials()
    if not client_id:
        raise ValueError("Google client_id not configured")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


async def exchange_code(code: str, redirect_uri: str) -> dict:
    client_id, client_secret = get_google_credentials()
    if not client_id or not client_secret:
        raise ValueError("Google credentials not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        })
        resp.raise_for_status()
        tokens = resp.json()
    # Store tokens
    token_data = {
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))).isoformat(),
    }
    save_google_tokens(token_data)
    return token_data


async def refresh_access_token() -> str:
    token_data = load_google_tokens()
    if not token_data or not token_data.get("refresh_token"):
        raise ValueError("No refresh token available")
    client_id, client_secret = get_google_credentials()
    if not client_id or not client_secret:
        raise ValueError("Google credentials not configured")
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": token_data["refresh_token"],
            "grant_type": "refresh_token",
        })
        resp.raise_for_status()
        new_tokens = resp.json()
    token_data["access_token"] = new_tokens["access_token"]
    token_data["expires_at"] = (datetime.now(timezone.utc) + timedelta(seconds=new_tokens.get("expires_in", 3600))).isoformat()
    save_google_tokens(token_data)
    return token_data["access_token"]


async def get_valid_token() -> str:
    token_data = load_google_tokens()
    if not token_data:
        raise ValueError("Not connected to Google Calendar")
    expires_at = datetime.fromisoformat(token_data["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) >= expires_at - timedelta(minutes=5):
        return await refresh_access_token()
    return token_data["access_token"]


async def fetch_events(days_ahead: int = 7) -> list[dict]:
    token = await get_valid_token()
    now = datetime.now(timezone.utc)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days_ahead)).isoformat()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": "20",
            },
        )
        resp.raise_for_status()
        data = resp.json()
    events = []
    for item in data.get("items", []):
        start = item.get("start", {})
        end = item.get("end", {})
        events.append({
            "id": item.get("id"),
            "summary": item.get("summary", "(No title)"),
            "start": start.get("dateTime") or start.get("date"),
            "end": end.get("dateTime") or end.get("date"),
            "all_day": "date" in start and "dateTime" not in start,
            "location": item.get("location"),
        })
    return events


async def create_event(summary: str, start: str, end: str, description: str = "", location: str = "", all_day: bool = False) -> dict:
    """Create a new calendar event. start/end are ISO strings or YYYY-MM-DD for all-day."""
    token = await get_valid_token()
    body: dict = {"summary": summary}
    if description:
        body["description"] = description
    if location:
        body["location"] = location
    if all_day:
        body["start"] = {"date": start[:10]}
        body["end"] = {"date": end[:10]}
    else:
        body["start"] = {"dateTime": start}
        body["end"] = {"dateTime": end}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        resp.raise_for_status()
        item = resp.json()
    s = item.get("start", {})
    e = item.get("end", {})
    return {
        "id": item.get("id"),
        "summary": item.get("summary", "(No title)"),
        "start": s.get("dateTime") or s.get("date"),
        "end": e.get("dateTime") or e.get("date"),
        "all_day": "date" in s and "dateTime" not in s,
        "location": item.get("location"),
        "description": item.get("description"),
    }


async def update_event(event_id: str, summary: str | None = None, start: str | None = None,
                       end: str | None = None, description: str | None = None,
                       location: str | None = None, all_day: bool | None = None) -> dict:
    """Update an existing calendar event by ID. Only provided fields are changed."""
    token = await get_valid_token()
    # Fetch current event first
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        current = resp.json()
    # Build patch body
    body: dict = {}
    if summary is not None:
        body["summary"] = summary
    if description is not None:
        body["description"] = description
    if location is not None:
        body["location"] = location
    if start is not None or all_day is not None:
        is_all_day = all_day if all_day is not None else ("date" in current.get("start", {}))
        s = start or current.get("start", {}).get("dateTime") or current.get("start", {}).get("date")
        if is_all_day:
            body["start"] = {"date": s[:10]}
        else:
            body["start"] = {"dateTime": s}
    if end is not None or all_day is not None:
        is_all_day = all_day if all_day is not None else ("date" in current.get("end", {}))
        e = end or current.get("end", {}).get("dateTime") or current.get("end", {}).get("date")
        if is_all_day:
            body["end"] = {"date": e[:10]}
        else:
            body["end"] = {"dateTime": e}
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        resp.raise_for_status()
        item = resp.json()
    s = item.get("start", {})
    e = item.get("end", {})
    return {
        "id": item.get("id"),
        "summary": item.get("summary", "(No title)"),
        "start": s.get("dateTime") or s.get("date"),
        "end": e.get("dateTime") or e.get("date"),
        "all_day": "date" in s and "dateTime" not in s,
        "location": item.get("location"),
        "description": item.get("description"),
    }


async def delete_event(event_id: str) -> bool:
    """Delete a calendar event by ID. Returns True on success."""
    token = await get_valid_token()
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{GOOGLE_CALENDAR_API}/calendars/primary/events/{event_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
    return True


def disconnect():
    remove_google_tokens()
