"""FastAPI dependency wiring for the agent runtime."""

from __future__ import annotations

from pydantic_ai import Agent

from ..agents.travel_planner.agent import get_travel_planner_agent
from ..settings import Settings, get_settings


def settings_dependency() -> Settings:
    return get_settings()


def travel_planner_agent_dependency() -> Agent:
    return get_travel_planner_agent()
