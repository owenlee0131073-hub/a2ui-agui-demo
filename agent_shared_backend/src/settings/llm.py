"""LLM settings for the Pydantic AI runtime."""

from __future__ import annotations

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_MODEL = "openrouter:openai/gpt-oss-120b"


class LLMSettings(BaseSettings):
    model: str = Field(default=DEFAULT_MODEL, alias="PYDANTIC_AI_MODEL")
    openrouter_api_key: SecretStr | None = Field(default=None, alias="OPENROUTER_API_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("model")
    @classmethod
    def model_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("PYDANTIC_AI_MODEL must not be empty")
        return value

    @property
    def has_openrouter_key(self) -> bool:
        return self.openrouter_api_key is not None and bool(
            self.openrouter_api_key.get_secret_value().strip()
        )
