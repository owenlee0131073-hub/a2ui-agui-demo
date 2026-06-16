"""Pydantic AI model selection for shared agents."""

from __future__ import annotations

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from .schemas import ModelConfig


def build_model(config: ModelConfig) -> str | OpenAIChatModel:
    # Pydantic Settings reads `.env`, but Pydantic AI providers do not receive
    # that Settings object automatically. For OpenRouter, construct the provider
    # explicitly so local `.env` loading and provider auth use the same source.
    if config.model.startswith("openrouter:"):
        model_name = config.model.removeprefix("openrouter:")
        return OpenAIChatModel(
            model_name,
            provider=OpenRouterProvider(api_key=config.openrouter_api_key),
        )

    return config.model
