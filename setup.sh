#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo ""
echo "  LifeOS Setup"
echo "  ============"
echo ""

# ── Check Python ──────────────────────────────────────────────
PYTHON=""
for cmd in python3 python; do
    if command -v "$cmd" &>/dev/null; then
        version=$("$cmd" --version 2>&1 | grep -oP '\d+\.\d+')
        major=$(echo "$version" | cut -d. -f1)
        minor=$(echo "$version" | cut -d. -f2)
        if [ "$major" -ge 3 ] && [ "$minor" -ge 11 ]; then
            PYTHON="$cmd"
            info "Python: $("$cmd" --version)"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    fail "Python 3.11+ is required but not found.
    Install it:
      Ubuntu/Debian: sudo apt install python3.11 python3.11-venv
      macOS:         brew install python@3.11
      Fedora:        sudo dnf install python3.11"
fi

# ── Check Node.js ─────────────────────────────────────────────
if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version | grep -oP '\d+' | head -1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        info "Node.js: $(node --version)"
    else
        fail "Node.js 18+ is required (found $(node --version)).
    Install it: https://nodejs.org/ or use nvm:
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      nvm install 20"
    fi
else
    fail "Node.js is required but not found.
    Install it: https://nodejs.org/ or:
      Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
      macOS:         brew install node"
fi

# ── Check npm ─────────────────────────────────────────────────
if command -v npm &>/dev/null; then
    info "npm: $(npm --version)"
else
    fail "npm is required but not found. It should come with Node.js."
fi

# ── Install uv (Python package manager) ──────────────────────
if command -v uv &>/dev/null; then
    info "uv: $(uv --version)"
else
    warn "uv not found — installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
    if command -v uv &>/dev/null; then
        info "uv installed: $(uv --version)"
    else
        fail "Failed to install uv. Install manually: https://docs.astral.sh/uv/getting-started/installation/"
    fi
fi

# ── Backend setup ─────────────────────────────────────────────
info "Setting up backend..."
cd "$ROOT_DIR/backend"

if [ ! -d ".venv" ]; then
    uv venv .venv
fi
source .venv/bin/activate
uv pip install -r requirements.txt --quiet
info "Backend dependencies installed."

# ── Frontend setup ────────────────────────────────────────────
info "Setting up frontend..."
cd "$ROOT_DIR/frontend"
npm install --silent
info "Frontend dependencies installed."

# ── Create data directory ─────────────────────────────────────
mkdir -p "$ROOT_DIR/data"

# ── Done ──────────────────────────────────────────────────────
echo ""
info "Setup complete!"
echo ""
echo "  To start LifeOS:"
echo ""
echo "    Terminal 1 (backend):"
echo "      cd backend"
echo "      source .venv/bin/activate"
echo "      python main.py"
echo ""
echo "    Terminal 2 (frontend):"
echo "      cd frontend"
echo "      npm run dev"
echo ""
echo "    Then open http://localhost:5173"
echo ""
echo "  Or use Docker:"
echo "      docker compose up -d --build"
echo "      Then open http://localhost:8081"
echo ""
