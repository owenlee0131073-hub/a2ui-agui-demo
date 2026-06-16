"""Jinja prompt loader for client-specific agent instructions."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from pydantic import BaseModel

ClientId = Literal["copilotkit_agui"]

PROMPT_DIR = Path(__file__).parent


class ClientPromptParams(BaseModel):
    client_id: ClientId
    display_name: str
    protocol: str
    frontend_model: str
    rendering_contract: str
    response_guidance: str


CLIENT_PROMPT_PARAMS: dict[ClientId, ClientPromptParams] = {
    "copilotkit_agui": ClientPromptParams(
        client_id="copilotkit_agui",
        display_name="CopilotKit AG-UI / A2UI client",
        protocol="AG-UI",
        frontend_model="CopilotSidebar plus CopilotKit's auto-mounted A2UI activity renderer",
        rendering_contract=(
            "The client communicates through AG-UI events. CopilotRuntime may inject a "
            "`render_a2ui` frontend tool into that request. When present, use that tool to "
            "emit A2UI v0.9 surfaces with `surfaceId`, `components`, and optional `data`; "
            "do not invent application-specific surface contracts or REST endpoints. The "
            "client also registers stage-specific frontend tools that update the main "
            "application workspace outside the chat. Prefer those narrow workspace tools "
            "over the broad `update_travel_workspace` compatibility tool when they are "
            "available. Use `render_a2ui` for chat artifacts and workspace state tools for "
            "persistent route and component state."
        ),
        response_guidance=(
            "Use backend tools for travel facts and policy checks, then either call "
            "a stage-specific workspace tool to switch the main workspace stage, call "
            "`render_a2ui` for a visual chat artifact when useful, or summarize the same "
            "artifacts in concise Korean markdown when frontend tools are unavailable."
        ),
    ),
}


def client_prompt_params(client_id: ClientId) -> ClientPromptParams:
    return CLIENT_PROMPT_PARAMS[client_id]


@lru_cache
def _prompt_environment() -> Environment:
    return Environment(
        loader=FileSystemLoader(PROMPT_DIR),
        autoescape=select_autoescape(default_for_string=False, default=False),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_system_prompt(client: ClientPromptParams) -> str:
    template = _prompt_environment().get_template("system.j2")
    return template.render(client=client)
