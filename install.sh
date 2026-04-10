#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
#  LifeOS — Full Bootstrap Installer
#  Clone → Install → Run in a single command
#
#  Usage:  ./install.sh          # install everything
#          ./install.sh --run    # install everything then start
#          ./install.sh --check  # check only, don't install
#          ./install.sh --docker # build and run via Docker
# ──────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors & helpers ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
skip() { echo -e "  ${DIM}✓ $1 (already installed)${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}[$1]${NC} $2"; }

ERRORS=()
INSTALLED=()
SKIPPED=()
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Parse arguments ───────────────────────────────────────────
MODE="install"
for arg in "$@"; do
    case "$arg" in
        --run)    MODE="run" ;;
        --check)  MODE="check" ;;
        --docker) MODE="docker" ;;
        --help|-h)
            echo "Usage: ./install.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (none)     Install all dependencies"
            echo "  --run      Install everything then start LifeOS"
            echo "  --check    Check dependencies only (no changes)"
            echo "  --docker   Build and run via Docker instead"
            echo "  --help     Show this help"
            exit 0
            ;;
        *) echo "Unknown option: $arg"; exit 1 ;;
    esac
done

echo ""
echo -e "${BOLD}  LifeOS Installer${NC}"
echo    "  ════════════════"
echo ""

# ── Detect OS & package manager ──────────────────────────────
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        if command -v brew &>/dev/null; then
            PKG="brew"
        else
            PKG="none_macos"
        fi
    elif [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian|pop|linuxmint|elementary|zorin)
                OS="debian"
                PKG="apt"
                ;;
            fedora|rhel|centos|rocky|alma)
                OS="fedora"
                PKG="dnf"
                ;;
            arch|manjaro|endeavouros)
                OS="arch"
                PKG="pacman"
                ;;
            opensuse*|sles)
                OS="suse"
                PKG="zypper"
                ;;
            *)
                OS="linux"
                PKG="unknown"
                ;;
        esac
    else
        OS="unknown"
        PKG="unknown"
    fi
}

detect_os

# ── macOS: install Homebrew if missing ───────────────────────
if [[ "$PKG" == "none_macos" ]]; then
    if [[ "$MODE" == "check" ]]; then
        fail "Homebrew — not installed (required on macOS)"
        ERRORS+=("Homebrew is required on macOS: https://brew.sh")
    else
        warn "Homebrew not found — installing (required for macOS packages)..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        # Add brew to PATH for Apple Silicon and Intel Macs
        if [[ -f /opt/homebrew/bin/brew ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f /usr/local/bin/brew ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        if command -v brew &>/dev/null; then
            PKG="brew"
            ok "Homebrew installed"
            INSTALLED+=("homebrew")
        else
            fail "Could not install Homebrew"
            ERRORS+=("Homebrew is required on macOS — install from https://brew.sh")
        fi
    fi
fi

header "System" "Detected ${BOLD}$OS${NC} with ${BOLD}$PKG${NC} package manager"

# ── Helper: install a system package ─────────────────────────
sys_install() {
    local pkg_apt="${1:-}"
    local pkg_dnf="${2:-$pkg_apt}"
    local pkg_pacman="${3:-$pkg_apt}"
    local pkg_brew="${4:-$pkg_apt}"
    local pkg_zypper="${5:-$pkg_apt}"

    case "$PKG" in
        apt)    sudo apt-get update -qq && sudo apt-get install -y -qq "$pkg_apt" ;;
        dnf)    sudo dnf install -y -q "$pkg_dnf" ;;
        pacman) sudo pacman -S --noconfirm --needed "$pkg_pacman" ;;
        brew)   brew install "$pkg_brew" ;;
        zypper) sudo zypper install -y "$pkg_zypper" ;;
        *)      return 1 ;;
    esac
}

# ── Helper: check version meets minimum ──────────────────────
version_gte() {
    # Returns 0 if $1 >= $2 (dot-separated version comparison)
    local IFS=.
    local i ver1=($1) ver2=($2)
    for ((i=0; i<${#ver2[@]}; i++)); do
        local v1="${ver1[i]:-0}"
        local v2="${ver2[i]:-0}"
        if ((v1 > v2)); then return 0; fi
        if ((v1 < v2)); then return 1; fi
    done
    return 0
}

# ══════════════════════════════════════════════════════════════
#  PHASE 1: System dependencies
# ══════════════════════════════════════════════════════════════
header "1/5" "System Dependencies"

# ── curl ──────────────────────────────────────────────────────
if command -v curl &>/dev/null; then
    skip "curl $(curl --version | head -1 | awk '{print $2}')"
    SKIPPED+=("curl")
else
    if [[ "$MODE" == "check" ]]; then
        fail "curl — not installed"
        ERRORS+=("curl is required but not installed")
    else
        info "Installing curl..."
        if sys_install curl; then
            ok "curl installed"
            INSTALLED+=("curl")
        else
            fail "Could not install curl"
            ERRORS+=("Failed to install curl — install it manually")
        fi
    fi
fi

# ── git ───────────────────────────────────────────────────────
if command -v git &>/dev/null; then
    skip "git $(git --version | awk '{print $3}')"
    SKIPPED+=("git")
else
    if [[ "$MODE" == "check" ]]; then
        fail "git — not installed"
        ERRORS+=("git is required but not installed")
    else
        info "Installing git..."
        if sys_install git; then
            ok "git installed"
            INSTALLED+=("git")
        else
            fail "Could not install git"
            ERRORS+=("Failed to install git — install it manually")
        fi
    fi
fi

# ── Python 3.11+ ─────────────────────────────────────────────
PYTHON=""
for cmd in python3.12 python3.11 python3 python; do
    if command -v "$cmd" &>/dev/null; then
        ver=$("$cmd" --version 2>&1 | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+/) {split($i,a,"."); printf "%s.%s\n",a[1],a[2]; exit}}' | head -1)
        if version_gte "$ver" "3.11"; then
            PYTHON="$cmd"
            break
        fi
    fi
done

if [[ -n "$PYTHON" ]]; then
    skip "Python $($PYTHON --version 2>&1 | awk '{print $2}')"
    SKIPPED+=("python")
else
    if [[ "$MODE" == "check" ]]; then
        fail "Python 3.11+ — not found"
        ERRORS+=("Python 3.11+ is required")
    else
        info "Installing Python 3.11+..."
        case "$PKG" in
            apt)
                # Try adding deadsnakes PPA for older Ubuntu
                if ! sys_install python3.11 2>/dev/null; then
                    sudo apt-get install -y -qq software-properties-common
                    sudo add-apt-repository -y ppa:deadsnakes/ppa
                    sudo apt-get update -qq
                    sudo apt-get install -y -qq python3.11 python3.11-venv python3.11-dev
                fi
                ;;
            dnf)    sys_install "" "python3.11" ;;
            pacman) sys_install "" "" "python" ;;
            brew)   sys_install "" "" "" "python@3.11" ;;
            zypper) sys_install "" "" "" "" "python311" ;;
        esac

        # Re-detect
        for cmd in python3.12 python3.11 python3 python; do
            if command -v "$cmd" &>/dev/null; then
                ver=$("$cmd" --version 2>&1 | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+/) {split($i,a,"."); printf "%s.%s\n",a[1],a[2]; exit}}' | head -1)
                if version_gte "$ver" "3.11"; then
                    PYTHON="$cmd"
                    break
                fi
            fi
        done

        if [[ -n "$PYTHON" ]]; then
            ok "Python $($PYTHON --version 2>&1 | awk '{print $2}') installed"
            INSTALLED+=("python")
        else
            fail "Could not install Python 3.11+"
            ERRORS+=("Python 3.11+ is required — install manually: https://www.python.org/downloads/")
        fi
    fi
fi

# ── python3-venv (Debian/Ubuntu sometimes needs it separately) ─
if [[ -n "$PYTHON" && "$PKG" == "apt" ]]; then
    if ! "$PYTHON" -m venv --help &>/dev/null 2>&1; then
        if [[ "$MODE" == "check" ]]; then
            fail "python3-venv — not installed"
            ERRORS+=("python3-venv package is required")
        else
            info "Installing python3-venv..."
            py_ver=$("$PYTHON" --version 2>&1 | awk '{for(i=1;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+/) {split($i,a,"."); printf "%s.%s\n",a[1],a[2]; exit}}' | head -1)
            sudo apt-get install -y -qq "python${py_ver}-venv" 2>/dev/null || \
                sudo apt-get install -y -qq python3-venv 2>/dev/null || true
            if "$PYTHON" -m venv --help &>/dev/null 2>&1; then
                ok "python3-venv installed"
                INSTALLED+=("python3-venv")
            else
                warn "python3-venv may not be installed — venv creation might fail"
            fi
        fi
    else
        SKIPPED+=("python3-venv")
    fi
fi

# ── Node.js 18+ ──────────────────────────────────────────────
NODE_OK=false
if command -v node &>/dev/null; then
    NODE_VER=$(node --version | sed 's/^v//' | cut -d. -f1)
    if [[ "$NODE_VER" -ge 18 ]]; then
        skip "Node.js $(node --version)"
        NODE_OK=true
        SKIPPED+=("nodejs")
    fi
fi

if [[ "$NODE_OK" == false ]]; then
    if [[ "$MODE" == "check" ]]; then
        fail "Node.js 18+ — not found"
        ERRORS+=("Node.js 18+ is required")
    else
        info "Installing Node.js 20.x..."
        case "$PKG" in
            apt)
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt-get install -y -qq nodejs
                ;;
            dnf)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo dnf install -y -q nodejs
                ;;
            pacman)
                sudo pacman -S --noconfirm --needed nodejs npm
                ;;
            brew)
                brew install node@20
                ;;
            zypper)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo zypper install -y nodejs20
                ;;
        esac

        if command -v node &>/dev/null; then
            NODE_VER=$(node --version | sed 's/^v//' | cut -d. -f1)
            if [[ "$NODE_VER" -ge 18 ]]; then
                ok "Node.js $(node --version) installed"
                NODE_OK=true
                INSTALLED+=("nodejs")
            else
                fail "Node.js installed but version too old: $(node --version)"
                ERRORS+=("Node.js 18+ required, got $(node --version)")
            fi
        else
            fail "Could not install Node.js"
            ERRORS+=("Node.js 18+ is required — install from https://nodejs.org/")
        fi
    fi
fi

# ── npm ───────────────────────────────────────────────────────
if command -v npm &>/dev/null; then
    skip "npm $(npm --version)"
    SKIPPED+=("npm")
else
    if [[ "$MODE" == "check" ]]; then
        fail "npm — not found"
        ERRORS+=("npm is required (comes with Node.js)")
    else
        info "npm not found — it should come with Node.js"
        # On some distros npm is a separate package
        case "$PKG" in
            apt)    sudo apt-get install -y -qq npm 2>/dev/null || true ;;
            dnf)    sudo dnf install -y -q npm 2>/dev/null || true ;;
            pacman) sudo pacman -S --noconfirm --needed npm 2>/dev/null || true ;;
        esac
        if command -v npm &>/dev/null; then
            ok "npm $(npm --version) installed"
            INSTALLED+=("npm")
        else
            fail "npm not available"
            ERRORS+=("npm is required but could not be installed")
        fi
    fi
fi

# ══════════════════════════════════════════════════════════════
#  PHASE 2: Python tooling (uv)
# ══════════════════════════════════════════════════════════════
header "2/5" "Python Package Manager (uv)"

if command -v uv &>/dev/null; then
    skip "uv $(uv --version 2>&1 | awk '{print $2}')"
    SKIPPED+=("uv")
else
    if [[ "$MODE" == "check" ]]; then
        fail "uv — not installed"
        ERRORS+=("uv is required for Python dependency management")
    else
        info "Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
        export PATH="$HOME/.cargo/bin:$PATH"
        if command -v uv &>/dev/null; then
            ok "uv $(uv --version 2>&1 | awk '{print $2}') installed"
            INSTALLED+=("uv")
        else
            fail "Could not install uv"
            ERRORS+=("uv is required — install from https://docs.astral.sh/uv/")
        fi
    fi
fi

# ── Bail early if check-only or critical errors ──────────────
if [[ "$MODE" == "check" ]]; then
    echo ""
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        header "Result" "${RED}${#ERRORS[@]} issue(s) found${NC}"
        for err in "${ERRORS[@]}"; do
            fail "$err"
        done
        exit 1
    else
        header "Result" "${GREEN}All system dependencies satisfied${NC}"
        exit 0
    fi
fi

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo ""
    header "Error" "Cannot continue — missing critical dependencies:"
    for err in "${ERRORS[@]}"; do
        fail "$err"
    done
    echo ""
    echo "  Fix the above issues and re-run ./install.sh"
    exit 1
fi

# ══════════════════════════════════════════════════════════════
#  PHASE 3: Backend Python dependencies
# ══════════════════════════════════════════════════════════════
header "3/5" "Backend Dependencies (Python)"

cd "$ROOT_DIR/backend"

# Create venv if needed
if [[ ! -d ".venv" ]]; then
    info "Creating Python virtual environment..."
    uv venv .venv --python "$PYTHON"
    ok "Virtual environment created at backend/.venv"
    INSTALLED+=("python-venv")
else
    skip "Virtual environment exists"
    SKIPPED+=("python-venv")
fi

# Activate venv
source .venv/bin/activate

# Install/verify each Python package
info "Installing Python packages..."
uv pip install -r requirements.txt --quiet 2>&1

# Verify each package individually
PY_PACKAGES=(
    "fastapi:0.115.6:Web framework"
    "uvicorn:0.34.0:ASGI server"
    "sqlalchemy:2.0.36:Database ORM"
    "aiosqlite:0.20.0:Async SQLite driver"
    "cryptography:44.0.0:Encryption library"
    "anthropic:0.42.0:Anthropic Claude SDK"
    "openai:1.58.1:OpenAI SDK"
    "ollama:0.4.4:Ollama SDK"
    "pydantic:2.10.4:Data validation"
    "python-multipart:0.0.20:Multipart form data"
    "websockets:14.1:WebSocket support"
    "httpx:0.27.0:HTTP client"
)

py_ok=0
py_fail=0
for entry in "${PY_PACKAGES[@]}"; do
    IFS=':' read -r pkg req_ver desc <<< "$entry"
    # Get installed version (use subshell to avoid pipefail exit)
    installed_ver="$(uv pip show "$pkg" 2>/dev/null | grep "^Version:" | awk '{print $2}')" || installed_ver=""
    if [[ -n "$installed_ver" ]]; then
        ok "${pkg} ${DIM}${installed_ver}${NC} — $desc"
        ((py_ok++)) || true
    else
        fail "${pkg} — NOT INSTALLED"
        ERRORS+=("Python package '$pkg' failed to install")
        ((py_fail++)) || true
    fi
done

if [[ $py_fail -eq 0 ]]; then
    info "All $py_ok Python packages verified"
    INSTALLED+=("python-packages")
else
    warn "$py_fail Python package(s) failed verification"
fi

deactivate

# ══════════════════════════════════════════════════════════════
#  PHASE 4: Frontend Node.js dependencies
# ══════════════════════════════════════════════════════════════
header "4/5" "Frontend Dependencies (Node.js)"

cd "$ROOT_DIR/frontend"

# Install npm packages
if [[ -d "node_modules" && -f "node_modules/.package-lock.json" ]]; then
    info "node_modules exists — running npm install to sync..."
else
    info "Installing npm packages..."
fi
npm install --silent 2>&1

# Verify key frontend packages
FE_PACKAGES=(
    "react:React UI library"
    "react-dom:React DOM renderer"
    "react-router-dom:Client-side routing"
    "vite:Build tool & dev server"
    "typescript:TypeScript compiler"
    "tailwindcss:CSS framework"
    "@base-ui/react:Headless UI components"
    "recharts:Charting library"
    "react-markdown:Markdown renderer"
    "lucide-react:Icon library"
    "shadcn:Component library"
    "class-variance-authority:CSS variant utility"
    "clsx:Class name utility"
    "tailwind-merge:Tailwind class merging"
    "@tailwindcss/vite:Tailwind Vite plugin"
    "@vitejs/plugin-react:Vite React plugin"
    "eslint:Linter"
)

fe_ok=0
fe_fail=0
for entry in "${FE_PACKAGES[@]}"; do
    IFS=':' read -r pkg desc <<< "$entry"
    # Check if package directory exists in node_modules
    if [[ -d "node_modules/$pkg" ]]; then
        pkg_ver="$(node -p "require('$pkg/package.json').version" 2>/dev/null)" || pkg_ver="installed"
        ok "${pkg} ${DIM}${pkg_ver}${NC} — $desc"
        ((fe_ok++)) || true
    else
        fail "${pkg} — NOT INSTALLED"
        ERRORS+=("npm package '$pkg' failed to install")
        ((fe_fail++)) || true
    fi
done

if [[ $fe_fail -eq 0 ]]; then
    info "All $fe_ok frontend packages verified"
    INSTALLED+=("npm-packages")
else
    warn "$fe_fail frontend package(s) failed verification"
fi

# ══════════════════════════════════════════════════════════════
#  PHASE 5: Project structure & build check
# ══════════════════════════════════════════════════════════════
header "5/5" "Project Structure"

cd "$ROOT_DIR"

# Data directory
if [[ -d "data" ]]; then
    skip "data/ directory"
else
    mkdir -p data
    ok "data/ directory created"
fi

# Verify key project files exist
PROJECT_FILES=(
    "backend/main.py:Backend entrypoint"
    "backend/config.py:Backend configuration"
    "backend/database.py:Database setup"
    "backend/requirements.txt:Python dependencies"
    "frontend/package.json:Frontend package manifest"
    "frontend/vite.config.ts:Vite configuration"
    "frontend/tsconfig.json:TypeScript configuration"
    "frontend/src/main.tsx:Frontend entrypoint"
    "docker-compose.yml:Docker Compose config"
    "Dockerfile:Docker build config"
)

for entry in "${PROJECT_FILES[@]}"; do
    IFS=':' read -r filepath desc <<< "$entry"
    if [[ -f "$filepath" ]]; then
        ok "$filepath — $desc"
    else
        fail "$filepath — MISSING"
        ERRORS+=("Project file missing: $filepath")
    fi
done

# ══════════════════════════════════════════════════════════════
#  Summary
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}  ════════════════════════════════════════${NC}"
echo ""

if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo -e "  ${RED}${BOLD}Installation completed with ${#ERRORS[@]} error(s):${NC}"
    echo ""
    for err in "${ERRORS[@]}"; do
        fail "$err"
    done
    echo ""
    echo "  Fix the above issues and re-run ./install.sh"
    exit 1
fi

echo -e "  ${GREEN}${BOLD}All dependencies installed and verified!${NC}"
echo ""
if [[ ${#INSTALLED[@]} -gt 0 ]]; then
    echo -e "  ${GREEN}Newly installed:${NC} ${INSTALLED[*]}"
fi
if [[ ${#SKIPPED[@]} -gt 0 ]]; then
    echo -e "  ${DIM}Already present: ${SKIPPED[*]}${NC}"
fi
echo ""

# ══════════════════════════════════════════════════════════════
#  Docker mode
# ══════════════════════════════════════════════════════════════
if [[ "$MODE" == "docker" ]]; then
    header "Docker" "Building and starting container..."
    cd "$ROOT_DIR"
    docker compose up -d --build
    echo ""
    echo -e "  ${GREEN}${BOLD}LifeOS is running!${NC}"
    echo ""
    echo "    Open: ${BOLD}http://localhost:8081${NC}"
    echo "    Logs: docker compose logs -f"
    echo "    Stop: docker compose down"
    echo ""
    exit 0
fi

# ══════════════════════════════════════════════════════════════
#  Run mode — start the app
# ══════════════════════════════════════════════════════════════
if [[ "$MODE" == "run" ]]; then
    header "Starting" "LifeOS"

    # Build frontend for production serving
    info "Building frontend..."
    cd "$ROOT_DIR/frontend"
    npm run build 2>&1

    if [[ -d "dist" ]]; then
        ok "Frontend built successfully"
    else
        fail "Frontend build failed"
        exit 1
    fi

    # Start backend (serves frontend from dist/)
    cd "$ROOT_DIR"
    info "Starting server on http://localhost:8081 ..."
    echo ""
    source backend/.venv/bin/activate
    exec "$PYTHON" backend/main.py
fi

# ── Default: just show instructions ──────────────────────────
echo -e "  ${BOLD}Quick Start:${NC}"
echo ""
echo -e "    ${BOLD}Option 1 — Single server (production mode):${NC}"
echo    "      ./install.sh --run"
echo ""
echo -e "    ${BOLD}Option 2 — Dev mode (hot reload):${NC}"
echo    "      Terminal 1:  cd backend && source .venv/bin/activate && python main.py"
echo    "      Terminal 2:  cd frontend && npm run dev"
echo    "      Open:        http://localhost:5173"
echo ""
echo -e "    ${BOLD}Option 3 — Docker:${NC}"
echo    "      ./install.sh --docker"
echo    "      Open:        http://localhost:8081"
echo ""
