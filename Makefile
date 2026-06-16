SHELL := /bin/bash

BACKEND_DIR := agent_shared_backend
FRONTEND_DIR := copilotkit_agui

BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8200
FRONTEND_HOST ?= 0.0.0.0
FRONTEND_PORT ?= 3000
AGENT_AG_UI_URL ?= http://$(BACKEND_HOST):$(BACKEND_PORT)/api/ag-ui

.DEFAULT_GOAL := help

.PHONY: help install run check-network backend frontend

help:
	@printf "Targets:\n"
	@printf "  make install        Install backend and frontend dependencies\n"
	@printf "  make run            Run backend and frontend dev servers together\n"
	@printf "  make check-network  Start both servers temporarily and verify local routes\n"
	@printf "\nDefaults:\n"
	@printf "  BACKEND_PORT=%s FRONTEND_PORT=%s AGENT_AG_UI_URL=%s\n" "$(BACKEND_PORT)" "$(FRONTEND_PORT)" "$(AGENT_AG_UI_URL)"

install:
	cd $(BACKEND_DIR) && uv sync --frozen
	cd $(FRONTEND_DIR) && bun install --frozen-lockfile

backend:
	cd $(BACKEND_DIR) && uv run uvicorn src.app:app --host $(BACKEND_HOST) --port $(BACKEND_PORT)

frontend:
	cd $(FRONTEND_DIR) && AGENT_AG_UI_URL="$(AGENT_AG_UI_URL)" bun run dev --hostname $(FRONTEND_HOST) --port $(FRONTEND_PORT)

run:
	@set -euo pipefail; \
	echo "Backend:  http://$(BACKEND_HOST):$(BACKEND_PORT)"; \
	echo "Frontend: http://localhost:$(FRONTEND_PORT)"; \
	echo "AG-UI:    $(AGENT_AG_UI_URL)"; \
	(cd $(BACKEND_DIR) && uv run uvicorn src.app:app --host $(BACKEND_HOST) --port $(BACKEND_PORT)) & \
	backend_pid=$$!; \
	(cd $(FRONTEND_DIR) && AGENT_AG_UI_URL="$(AGENT_AG_UI_URL)" bun run dev --hostname $(FRONTEND_HOST) --port $(FRONTEND_PORT)) & \
	frontend_pid=$$!; \
	cleanup() { \
		kill $$backend_pid $$frontend_pid 2>/dev/null || true; \
		wait $$backend_pid $$frontend_pid 2>/dev/null || true; \
	}; \
	trap cleanup INT TERM EXIT; \
	while kill -0 $$backend_pid 2>/dev/null && kill -0 $$frontend_pid 2>/dev/null; do \
		sleep 1; \
	done; \
	cleanup

check-network:
	@set -euo pipefail; \
	tmp_dir=$$(mktemp -d); \
	backend_log=$$tmp_dir/backend.log; \
	frontend_log=$$tmp_dir/frontend.log; \
	(cd $(BACKEND_DIR) && uv run uvicorn src.app:app --host $(BACKEND_HOST) --port $(BACKEND_PORT) >$$backend_log 2>&1) & \
	backend_pid=$$!; \
	(cd $(FRONTEND_DIR) && AGENT_AG_UI_URL="$(AGENT_AG_UI_URL)" bun run dev --hostname 127.0.0.1 --port $(FRONTEND_PORT) >$$frontend_log 2>&1) & \
	frontend_pid=$$!; \
	cleanup() { \
		kill $$backend_pid $$frontend_pid 2>/dev/null || true; \
		wait $$backend_pid $$frontend_pid 2>/dev/null || true; \
		rm -rf "$$tmp_dir"; \
	}; \
	trap cleanup INT TERM EXIT; \
	echo "Waiting for backend /health..."; \
	for _ in {1..60}; do \
		if curl -fsS "http://$(BACKEND_HOST):$(BACKEND_PORT)/health" >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -fsS "http://$(BACKEND_HOST):$(BACKEND_PORT)/health" | python3 -m json.tool; \
	echo "Checking backend CORS preflight for frontend origin..."; \
	curl -fsSI -X OPTIONS "http://$(BACKEND_HOST):$(BACKEND_PORT)/api/ag-ui" \
		-H "Origin: http://localhost:$(FRONTEND_PORT)" \
		-H "Access-Control-Request-Method: POST" | rg -i "HTTP/|access-control-allow-origin|access-control-allow-methods"; \
	echo "Checking frontend server-side network path to backend..."; \
	(cd $(FRONTEND_DIR) && AGENT_AG_UI_URL="$(AGENT_AG_UI_URL)" bun -e 'const healthUrl = new URL(process.env.AGENT_AG_UI_URL); healthUrl.pathname = "/health"; healthUrl.search = ""; const response = await fetch(healthUrl); if (!response.ok) throw new Error("backend health failed: " + response.status); console.log(JSON.stringify(await response.json(), null, 2));'); \
	echo "Waiting for frontend /api/copilotkit info envelope..."; \
	for _ in {1..90}; do \
		if curl -fsS -X POST "http://127.0.0.1:$(FRONTEND_PORT)/api/copilotkit" \
			-H "Content-Type: application/json" \
			-d '{"method":"info","params":{},"body":{}}' >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -fsS -X POST "http://127.0.0.1:$(FRONTEND_PORT)/api/copilotkit" \
		-H "Content-Type: application/json" \
		-d '{"method":"info","params":{},"body":{}}' | python3 -m json.tool; \
	echo "Network check passed: browser -> /api/copilotkit -> $(AGENT_AG_UI_URL) is locally routable."
