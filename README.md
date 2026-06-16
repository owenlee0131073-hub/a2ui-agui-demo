# A2UI AG-UI Demo

This repository contains a Week 8 lab demo for connecting:

- a FastAPI / Pydantic AI backend exposed through AG-UI
- a Next.js / CopilotKit frontend that renders an A2UI-style business trip workflow

The runtime is split into two workspaces:

- `agent_shared_backend/`: FastAPI backend with the travel planning agent and mock tools
- `copilotkit_agui/`: Next.js frontend with CopilotKit, AG-UI, and A2UI renderer integration

## Repository Notes

The original study-lab folder also contained local dependency folders, build outputs, and large reference clones.
Those are intentionally excluded from this public repo.

Environment files with secrets are not committed. Use the checked-in `.env.example` files as templates.

## Backend

```bash
cd agent_shared_backend
uv sync
cp .env.example .env
uv run uvicorn src.app:app --host 0.0.0.0 --port 8200
```

Set `OPENROUTER_API_KEY` in `agent_shared_backend/.env` before calling the agent.

## Frontend

```bash
cd copilotkit_agui
bun install
cp .env.example .env.local
bun run dev
```

The frontend expects the backend AG-UI endpoint at:

```text
http://localhost:8200/api/ag-ui
```

## Makefile

From the repository root:

```bash
make install
make run
```

`make install` installs both workspaces:

- backend: `uv sync --frozen`
- frontend: `bun install --frozen-lockfile`

`make run` starts both dev servers:

- backend: `http://127.0.0.1:8200`
- frontend: `http://localhost:3000`
- AG-UI backend URL injected into the Next.js server: `http://127.0.0.1:8200/api/ag-ui`

To verify local routing and networking without keeping the servers running:

```bash
make check-network
```

This checks:

- backend `GET /health`
- backend CORS preflight for `POST /api/ag-ui`
- frontend server-side fetch path from `AGENT_AG_UI_URL` to backend `GET /health`
- frontend CopilotKit single-route `POST /api/copilotkit` runtime info envelope

The runtime path is:

```text
Browser
-> Next.js /api/copilotkit
-> CopilotRuntime HttpAgent
-> FastAPI /api/ag-ui
```

## Docs

- `flow.md`: high-level implementation flow
- `docs/`: project explainer document and diagram assets
- `eraser_diagrams/`: source diagrams for the runtime and UI flow
