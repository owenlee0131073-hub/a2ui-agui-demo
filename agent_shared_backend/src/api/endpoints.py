"""HTTP endpoints for the shared Pydantic AI agent."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from starlette.requests import Request
from starlette.responses import Response

from pydantic_ai import Agent
from pydantic_ai.ui.ag_ui import AGUIAdapter

from .dependencies import settings_dependency, travel_planner_agent_dependency
from .schemas import ChatRequest, ChatResponse, HealthResponse
from ..agents.travel_planner.state import travel_planner_deps
from ..observability.flow_logger import (
    log_ag_ui_completion,
    log_ag_ui_request,
    log_ag_ui_stream_opened,
    log_chat_request,
    log_chat_response,
)
from ..settings import Settings

router = APIRouter()

SettingsDep = Annotated[Settings, Depends(settings_dependency)]
AgentDep = Annotated[Agent, Depends(travel_planner_agent_dependency)]


@router.get("/health")
async def health(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(
        service=settings.app.service_name,
        model=settings.llm.model,
        has_openrouter_key=settings.llm.has_openrouter_key,
    )


@router.post("/api/chat")
async def chat(request: ChatRequest, agent: AgentDep) -> ChatResponse:
    # Debug-only runtime path:
    #
    # - No AG-UI request object is present.
    # - No CopilotKit runtime middleware runs.
    # - No frontend tools, including runtime-injected `render_a2ui`, are available.
    #
    # Keep this endpoint useful for checking the Pydantic AI model and backend tools, but do
    # not treat it as a UI rendering path. The actual demo path is `/api/ag-ui` below.
    log_chat_request(request.message, request.client)
    result = await agent.run(request.message, deps=travel_planner_deps(request.client))
    output = str(result.output)
    log_chat_response(output)
    return ChatResponse(output=output)


@router.post("/api/ag-ui")
async def ag_ui_chat(request: Request, agent: AgentDep) -> Response:
    # Primary demo path:
    #
    # Browser CopilotSidebar
    #   -> Next.js `/api/copilotkit`
    #   -> CopilotRuntime + HttpAgent
    #   -> this FastAPI endpoint
    #   -> Pydantic AI AGUIAdapter
    #   -> Pydantic AI `travel_planner` agent
    #
    # The AGUIAdapter converts the CopilotKit AG-UI RunAgentInput into a Pydantic AI
    # run and streams Pydantic AI events back as AG-UI SSE events.
    #
    # Message/session context:
    # - CopilotKit sends the accumulated browser-side messages in `RunAgentInput.messages`.
    # - AGUIAdapter loads those messages into Pydantic AI message history for this run.
    #
    # Shared state:
    # - CopilotKit sends the current browser-side `agent.state` in `RunAgentInput.state`.
    # - `travel_planner_deps()` returns a dataclass with a `state` field, so Pydantic AI's
    #   StateHandler path validates that state and exposes it as `ctx.deps.state`.
    #
    # Runtime-injected frontend tools, including `render_a2ui`, arrive through this AG-UI
    # request and are intentionally not modeled as separate REST endpoints.
    body = await request.body()
    log_ag_ui_request(body, request.headers)

    response = await AGUIAdapter.dispatch_request(
        request,
        agent=agent,
        deps=travel_planner_deps("copilotkit_agui"),
        on_complete=log_ag_ui_completion,
    )
    log_ag_ui_stream_opened(response)
    return response
