import os
import json
import uuid
import hashlib
from pathlib import Path
from cryptography.fernet import Fernet

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "lifeos.db"
CONFIG_PATH = DATA_DIR / "config.enc"
KEY_FILE = DATA_DIR / ".keyfile"

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

DATA_DIR.mkdir(exist_ok=True)


def _get_encryption_key() -> bytes:
    """Get or create a machine-specific encryption key."""
    if KEY_FILE.exists():
        return KEY_FILE.read_bytes()
    key = Fernet.generate_key()
    KEY_FILE.write_bytes(key)
    KEY_FILE.chmod(0o600)
    return key


def get_fernet() -> Fernet:
    return Fernet(_get_encryption_key())


def save_api_key(provider: str, key: str):
    keys = load_api_keys()
    keys[provider] = key
    f = get_fernet()
    CONFIG_PATH.write_bytes(f.encrypt(json.dumps(keys).encode()))


def load_api_keys() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    try:
        f = get_fernet()
        data = f.decrypt(CONFIG_PATH.read_bytes())
        return json.loads(data)
    except Exception:
        return {}


def get_api_key(provider: str) -> str | None:
    return load_api_keys().get(provider)


def remove_api_key(provider: str):
    keys = load_api_keys()
    keys.pop(provider, None)
    f = get_fernet()
    CONFIG_PATH.write_bytes(f.encrypt(json.dumps(keys).encode()))


def get_configured_providers() -> list[dict]:
    keys = load_api_keys()
    return [{"provider": p, "configured": True} for p in keys if keys[p]]
