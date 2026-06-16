"""Pydantic AI agent aggregation point for the travel planner demo."""

from __future__ import annotations

from functools import lru_cache

import json

from pydantic_ai import Agent, RunContext

from ..llm_clients.factory import build_model
from ..llm_clients.schemas import ModelConfig
from ...settings import get_settings
from .prompts import render_system_prompt
from .state import TravelPlannerDeps
from .tools import get_tools


@lru_cache
def get_travel_planner_agent() -> Agent:
    settings = get_settings()
    openrouter_api_key = (
        settings.llm.openrouter_api_key.get_secret_value().strip()
        if settings.llm.openrouter_api_key is not None
        else None
    )
    model = build_model(
        ModelConfig(
            model=settings.llm.model,
            openrouter_api_key=openrouter_api_key,
        )
    )
    agent = Agent(
        model,
        deps_type=TravelPlannerDeps,
        tools=get_tools(),
    )

    @agent.instructions
    def add_client_specific_system_prompt(ctx: RunContext[TravelPlannerDeps]) -> str:
        state_json = json.dumps(
            ctx.deps.state.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            indent=2,
        )
        return f"{render_system_prompt(ctx.deps.client)}\n\nCurrent AG-UI shared state:\n{state_json}"

    return agent
