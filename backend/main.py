import sys
from pathlib import Path

# Ensure backend dir is on path
sys.path.insert(0, str(Path(__file__).parent))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import init_db
from presets.life_areas import seed_life_areas
from presets.coaching_styles import seed_coaching_styles
from services.profile_summary import regenerate_profile_summary

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_life_areas()
    await seed_coaching_styles()
    await regenerate_profile_summary()
    yield


app = FastAPI(title="LifeOS", version="1.0.0", lifespan=lifespan)

# Import and register routers
from routers import settings as settings_router
from routers import profile as profile_router
from routers import coaching as coaching_router
from routers import goals as goals_router
from routers import reviews as reviews_router
from routers import chat as chat_router
from routers import dashboard as dashboard_router
from routers import onboarding as onboarding_router
from routers import data as data_router
from routers import calendar as calendar_router
from routers import system as system_router

app.include_router(system_router.router, prefix="/api/system", tags=["system"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(profile_router.router, prefix="/api/profile", tags=["profile"])
app.include_router(coaching_router.router, prefix="/api/coaching", tags=["coaching"])
app.include_router(goals_router.router, prefix="/api/goals", tags=["goals"])
app.include_router(reviews_router.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(chat_router.router, prefix="/api/chat", tags=["chat"])
app.include_router(dashboard_router.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(onboarding_router.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(data_router.router, prefix="/api/data", tags=["data"])
app.include_router(calendar_router.router, prefix="/api/calendar", tags=["calendar"])

# Serve frontend static files
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
