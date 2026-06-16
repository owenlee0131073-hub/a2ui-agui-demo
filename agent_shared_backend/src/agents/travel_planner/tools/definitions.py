"""Pydantic AI tool definition layer for the travel planner agent."""

from __future__ import annotations

from pydantic_ai import Tool

from .budget_validate_policy import validate_policy as run_budget_validate_policy
from .calendar_check_availability import check_availability as run_calendar_check_availability
from .hotel_search_options import search_options as run_hotel_search_options
from .policy_check_travel_rules import check_travel_rules as run_policy_check_travel_rules
from .schemas import DemoToolResult


def calendar_check_availability(
    destination: str,
    start_date: str | None = None,
    nights: int = 1,
) -> DemoToolResult:
    """Check mock calendar availability for a business trip."""
    return run_calendar_check_availability(destination=destination, start_date=start_date, nights=nights)


def hotel_search_options(destination: str, budget_krw: int = 800_000, nights: int = 1) -> DemoToolResult:
    """Search mock hotel options for a business trip."""
    return run_hotel_search_options(destination=destination, budget_krw=budget_krw, nights=nights)


def budget_validate_policy(budget_krw: int = 800_000, estimated_total_krw: int = 742_000) -> DemoToolResult:
    """Validate a mock estimated trip budget against the requested budget."""
    return run_budget_validate_policy(budget_krw=budget_krw, estimated_total_krw=estimated_total_krw)


def policy_check_travel_rules(
    destination: str,
    estimated_total_krw: int = 742_000,
    needs_approval: bool = False,
) -> DemoToolResult:
    """Check mock travel policy rules for the proposed trip."""
    return run_policy_check_travel_rules(
        destination=destination,
        estimated_total_krw=estimated_total_krw,
        needs_approval=needs_approval,
    )


def get_tools() -> list[Tool]:
    return [
        Tool(
            calendar_check_availability,
            takes_ctx=False,
            name="calendar_check_availability",
            description="Check schedule availability for a requested business trip.",
        ),
        Tool(
            hotel_search_options,
            takes_ctx=False,
            name="hotel_search_options",
            description="Find mock hotel candidates for the destination and budget.",
        ),
        Tool(
            budget_validate_policy,
            takes_ctx=False,
            name="budget_validate_policy",
            description="Validate whether estimated trip cost fits the user's budget.",
        ),
        Tool(
            policy_check_travel_rules,
            takes_ctx=False,
            name="policy_check_travel_rules",
            description="Check mock travel policy constraints and approval requirements.",
        ),
    ]
