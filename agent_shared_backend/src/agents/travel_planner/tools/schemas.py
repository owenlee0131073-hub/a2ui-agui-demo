"""Shared schemas for UI demo tool results."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ToolStatus = Literal["available", "active", "approved", "rejected", "warning"]


class DemoToolResult(BaseModel):
    """Structured mock tool result for frontend component mapping."""

    display_name: str = Field(description="Human-readable tool name, e.g. calendar.check_availability")
    ui_component: str = Field(description="Suggested frontend component for this tool result")
    status: ToolStatus
    title: str
    summary: str
    details: dict[str, Any] = Field(default_factory=dict)
