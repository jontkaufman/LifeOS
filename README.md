# LifeOS

A self-hosted AI-powered life coaching platform. Set goals, track weekly reviews, chat with your AI coach, and visualize your progress — all running privately on your own machine.

## Features

- **AI Coaching Chat** — Have conversations with an AI life coach across multiple modes (check-ins, goal reviews, deep sessions, brainstorming, accountability, and more)
- **Dashboard** — See your Wheel of Life radar chart, latest review metrics, active goals, action items, and an interactive coaching chat pane
- **Goal Tracking** — Kanban board with drag-and-drop, milestones, and priority sorting
- **Weekly Reviews** — Structured weekly check-ins covering satisfaction, energy, stress, and mood
- **Wheel of Life** — Rate and visualize importance vs. satisfaction across your life areas
- **Coaching Style** — Customize how your AI coach communicates with you
- **Multiple AI Providers** — Supports Anthropic (Claude), OpenAI (GPT), and Ollama (local/free)
- **Fully Self-Hosted** — All data stays on your machine. API keys are encrypted at rest.

## Quick Start (Docker)

The fastest way to get running. Requires [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

```bash
git clone https://github.com/jontkaufman/LifeOS.git
cd LifeOS
docker compose up -d --build
```

Open **http://localhost:8081** in your browser. The onboarding wizard will walk you through setting up your AI provider API key and profile.

Your data is stored in the `data/` directory, which is mounted as a Docker volume and persists across restarts.

### Updating

```bash
git pull
docker compose up -d --build
```

## Quick Start (Local)

If you prefer to run without Docker, use the setup script:

```bash
git clone https://github.com/jontkaufman/LifeOS.git
cd LifeOS
./setup.sh
```

The script checks for and installs all dependencies, then starts both the backend and frontend dev server.

### Prerequisites

The setup script will check for these and guide you through installing anything missing:

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Backend runtime |
| **Node.js** | 18+ | Frontend build and dev server |
| **npm** | (comes with Node) | Frontend package manager |
| **uv** | any | Python package manager (auto-installed by setup script) |

### Manual Setup

If you prefer to set things up yourself:

**Backend:**
```bash
cd backend
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
python main.py
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on **http://localhost:5173** and proxies `/api` requests to the backend at port 8081.

### Building for Production

```bash
cd frontend
npm run build
```

Then start the backend — it will serve the built frontend from `frontend/dist/` at **http://localhost:8081**.

## Configuration

All configuration happens through the web UI:

1. **First launch** — The onboarding wizard guides you through API key setup, profile creation, and life area ratings
2. **Settings page** — Change AI provider, model, theme, and manage API keys at any time
3. **Coaching page** — Customize your coach's communication style

### Supported AI Providers

| Provider | Models | Notes |
|----------|--------|-------|
| **Anthropic** | Claude Sonnet, Opus, Haiku | Recommended. Requires [API key](https://console.anthropic.com/) |
| **OpenAI** | GPT-4o, GPT-4, etc. | Requires [API key](https://platform.openai.com/) |
| **Ollama** | Llama, Mistral, etc. | Free, runs locally. Install [Ollama](https://ollama.com/) first |

## Project Structure

```
LifeOS/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Paths, encryption, API key storage
│   ├── database.py           # SQLAlchemy async engine + session
│   ├── models/               # SQLAlchemy ORM models
│   ├── routers/              # API route handlers
│   ├── services/             # Business logic (AI, context building)
│   └── presets/              # Default life areas + coaching styles
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Chat, Goals, Reviews, etc.
│   │   ├── components/       # Layout, UI components (shadcn/ui)
│   │   ├── hooks/            # React hooks (useChat, useDashboard, etc.)
│   │   └── lib/              # API client, WebSocket, utilities
│   └── vite.config.ts
├── data/                     # SQLite DB + encrypted config (gitignored)
├── setup.sh                  # Auto-install dependencies and start
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Tech Stack

**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Recharts

**Backend:** Python FastAPI + SQLAlchemy (async) + SQLite (aiosqlite)

**AI:** Anthropic SDK, OpenAI SDK, Ollama SDK — streaming via WebSockets

## Data & Privacy

- All data is stored locally in `data/lifeos.db` (SQLite)
- API keys are encrypted at rest using Fernet symmetric encryption (`data/config.enc`)
- No telemetry, no external analytics, no data leaves your machine
- Back up your `data/` directory to preserve everything

## License

MIT
