"""Settings entry point for the agent runtime."""

from __future__ import annotations

from functools import lru_cache

from pydantic import BaseModel

from .app import AppSettings
from .llm import LLMSettings


class Settings(BaseModel):
    app: AppSettings
    llm: LLMSettings


@lru_cache
def get_settings() -> Settings:
    return Settings(app=AppSettings(), llm=LLMSettings())
