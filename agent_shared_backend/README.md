# A2UI / AG-UI Agent Shared Backend

FastAPI backend for one Pydantic AI `travel_planner` agent exposed to CopilotKit:

- CopilotKit client via `POST /api/ag-ui`
- Plain JSON runtime check via `POST /api/chat`

The backend uses OpenRouter through Pydantic AI and keeps mock tool definitions under
`src/agents/travel_planner/tools/`. Tool definition wrappers live in `tools/definitions.py`;
mock business logic is split into flat tool-name modules in that directory.
System instructions are rendered from `src/agents/travel_planner/prompts/system.j2`
with prompt params for the CopilotKit AG-UI / A2UI client.

The UI boundary is intentionally narrow:

- Backend Pydantic tools collect business data and return domain artifacts.
- CopilotKit runtime carries frontend tools and A2UI middleware through AG-UI.
- The agent uses `render_a2ui` only when CopilotKit injects it into the AG-UI request.
- Main workspace updates go through CopilotKit frontend tools that mutate AG-UI shared state.
- There is no custom `/surface` REST endpoint and no application-specific frontend render tool.

## Run

```bash
uv sync
cp .env.example .env
uv run uvicorn src.app:app --host 0.0.0.0 --port 8200
```

## Endpoints

- `GET /health`
- `POST /api/chat`
- `POST /api/ag-ui`

## References

- Pydantic AI AG-UI adapter: https://pydantic.dev/docs/ai/integrations/ui/ag-ui/
- CopilotKit Pydantic AI docs: https://docs.copilotkit.ai/pydantic-ai/
