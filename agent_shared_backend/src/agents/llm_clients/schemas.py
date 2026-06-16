"""LLM client configuration contracts."""

from __future__ import annotations

from pydantic import BaseModel


class ModelConfig(BaseModel):
    model: str
    openrouter_api_key: str | None = None
