import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
STATUS_FILE = DATA_DIR / "update-status.json"
UPDATE_SCRIPT = DATA_DIR / "update.sh"


def _read_status() -> dict:
    if STATUS_FILE.exists():
        try:
            return json.loads(STATUS_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {"status": "idle"}


@router.get("/check-update")
async def check_update():
    git_dir = PROJECT_ROOT / ".git"
    if not git_dir.exists():
        return {"docker_mode": True, "updates_available": False}

    try:
        subprocess.run(
            ["git", "fetch", "origin"],
            cwd=PROJECT_ROOT, capture_output=True, timeout=30
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch from origin")

    # Current commit info
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    ).stdout.strip()

    head_date = subprocess.run(
        ["git", "log", "-1", "--format=%ci"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    ).stdout.strip()

    # Remote commit
    remote = subprocess.run(
        ["git", "rev-parse", "origin/main"],
        cwd=PROJECT_ROOT, capture_output=True, text=True
    ).stdout.strip()

    updates_available = head != remote

    commits = []
    if updates_available:
        log_output = subprocess.run(
            ["git", "log", "--oneline", f"{head}..origin/main"],
            cwd=PROJECT_ROOT, capture_output=True, text=True
        ).stdout.strip()
        for line in log_output.splitlines()[:20]:
            parts = line.split(" ", 1)
            if len(parts) == 2:
                commits.append({"hash": parts[0], "message": parts[1]})

    return {
        "docker_mode": False,
        "current_commit": head[:7],
        "current_date": head_date,
        "updates_available": updates_available,
        "commits": commits,
    }


@router.post("/update")
async def trigger_update():
    git_dir = PROJECT_ROOT / ".git"
    if not git_dir.exists():
        raise HTTPException(status_code=400, detail="Auto-update not available in Docker mode")

    # Guard against concurrent updates
    status = _read_status()
    if status.get("status") == "running":
        raise HTTPException(status_code=409, detail="Update already in progress")

    # Detect pip or uv for backend deps
    pip_cmd = f'"{sys.executable}" -m pip install -r backend/requirements.txt'

    # Write the update shell script
    script = f"""#!/bin/bash
set -e

cd "{PROJECT_ROOT}"
STATUS="{STATUS_FILE}"

write_status() {{
    echo "$1" > "$STATUS"
}}

# Step 1: git pull
write_status '{{"step":"pull","status":"running"}}'
if ! git pull origin main 2>&1; then
    OUTPUT=$(git pull origin main 2>&1 || true)
    write_status "{{\\"step\\":\\"pull\\",\\"status\\":\\"error\\",\\"error\\":\\"$OUTPUT\\"}}"
    exit 1
fi

# Step 2: backend deps
write_status '{{"step":"backend_deps","status":"running"}}'
if ! {pip_cmd} 2>&1; then
    write_status '{{"step":"backend_deps","status":"error","error":"pip install failed"}}'
    exit 1
fi

# Step 3: frontend deps
write_status '{{"step":"frontend_deps","status":"running"}}'
if ! (cd frontend && npm install) 2>&1; then
    write_status '{{"step":"frontend_deps","status":"error","error":"npm install failed"}}'
    exit 1
fi

# Step 4: frontend build
write_status '{{"step":"build","status":"running"}}'
if ! (cd frontend && npm run build) 2>&1; then
    write_status '{{"step":"build","status":"error","error":"npm run build failed"}}'
    exit 1
fi

# Done
write_status '{{"step":"done","status":"complete","completed_at":"{datetime.now(timezone.utc).isoformat()}"}}'
"""

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPDATE_SCRIPT.write_text(script)
    UPDATE_SCRIPT.chmod(0o755)

    # Write initial status
    STATUS_FILE.write_text(json.dumps({"step": "pull", "status": "running"}))

    # Launch as detached subprocess that survives server restart
    subprocess.Popen(
        ["bash", str(UPDATE_SCRIPT)],
        cwd=PROJECT_ROOT,
        start_new_session=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    return {"status": "started"}


@router.get("/update/status")
async def update_status():
    return _read_status()
