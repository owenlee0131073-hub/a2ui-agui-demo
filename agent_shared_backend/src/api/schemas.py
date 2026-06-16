"""API request and response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field

from ..agents.travel_planner.prompts import ClientId


class HealthResponse(BaseModel):
    service: str
    model: str
    has_openrouter_key: bool


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    client: ClientId = "copilotkit_agui"


class ChatResponse(BaseModel):
    output: str
