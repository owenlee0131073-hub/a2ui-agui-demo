"""Shared AG-UI state model for the travel planner agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .prompts import ClientId, ClientPromptParams, client_prompt_params

WorkspaceStage = Literal["idle", "requirements", "draft", "comparison", "review", "final"]
WorkflowStage = Literal["requirements", "draft", "comparison", "review", "final"]
ApprovalStatus = Literal["not_requested", "pending", "approved", "rejected"]
RequirementStatus = Literal["missing", "draft", "confirmed"]
PolicyStatus = Literal["approved", "warning", "rejected"]
ItineraryCategory = Literal["travel", "meeting", "work", "meal", "lodging", "buffer"]


class RequirementCard(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    value: str
    status: RequirementStatus = "draft"
    description: str | None = None


class ItineraryItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    day: str
    date: str | None = None
    weekday: str | None = None
    title: str
    detail: str
    start_time: str | None = Field(default=None, alias="startTime")
    end_time: str | None = Field(default=None, alias="endTime")
    location: str | None = None
    category: ItineraryCategory = "work"
    notes: list[str] = Field(default_factory=list)


class DraftPlan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    summary: str
    timezone: str = "GMT+09"
    calendar_start_hour: int = Field(default=7, alias="calendarStartHour")
    calendar_end_hour: int = Field(default=22, alias="calendarEndHour")
    itinerary: list[ItineraryItem] = Field(default_factory=list)


class HotelOption(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    location: str
    nightly_rate_krw: int = Field(alias="nightlyRateKrw")
    total_krw: int = Field(alias="totalKrw")
    policy_status: PolicyStatus = Field(alias="policyStatus")
    highlights: list[str] = Field(default_factory=list)


class PolicyCheck(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    status: PolicyStatus
    detail: str


class FinalPlan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    summary: str
    approval_note: str = Field(alias="approvalNote")


class TravelPlannerState(BaseModel):
    """State synchronized through AG-UI between CopilotKit and Pydantic AI.

    CopilotKit owns the browser-side copy. Every run sends the current state in
    `RunAgentInput.state`; Pydantic AI validates it here and reinjects it into
    the agent through `RunContext.deps.state`.

    This schema mirrors the CopilotKit frontend workspace contract. It is not a
    backend-only persistence model. Frontend workspace tools mutate these fields
    in the browser agent state, and the next AG-UI request sends the same state
    back here for context reinjection.
    """

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    stage: WorkspaceStage | None = None
    workflow_stage: WorkflowStage = Field(default="requirements", alias="workflowStage")
    destination: str | None = None
    start_date: str | None = Field(default=None, alias="startDate")
    nights: int | None = None
    budget_krw: int | None = Field(default=None, alias="budgetKrw")
    trip_purpose: str | None = Field(default=None, alias="tripPurpose")
    preferences: list[str] = Field(default_factory=list)
    selected_hotel_id: str | None = Field(default=None, alias="selectedHotelId")
    approval_status: ApprovalStatus = Field(default="not_requested", alias="approvalStatus")
    last_user_action: str | None = Field(default=None, alias="lastUserAction")
    pending_action: str | None = Field(default=None, alias="pendingAction")
    requirement_cards: list[RequirementCard] = Field(default_factory=list, alias="requirementCards")
    draft_plan: DraftPlan | None = Field(default=None, alias="draftPlan")
    hotel_options: list[HotelOption] = Field(default_factory=list, alias="hotelOptions")
    policy_checks: list[PolicyCheck] = Field(default_factory=list, alias="policyChecks")
    final_plan: FinalPlan | None = Field(default=None, alias="finalPlan")


@dataclass
class TravelPlannerDeps:
    """Agent dependencies passed to every Pydantic AI run.

    This dataclass intentionally has a non-optional `state` field so it satisfies
    Pydantic AI's `StateHandler` protocol. Without this shape, AG-UI state sent
    by CopilotKit is ignored by `AGUIAdapter`.
    """

    client: ClientPromptParams
    state: TravelPlannerState = field(default_factory=TravelPlannerState)


def travel_planner_deps(client_id: ClientId) -> TravelPlannerDeps:
    return TravelPlannerDeps(client=client_prompt_params(client_id))
