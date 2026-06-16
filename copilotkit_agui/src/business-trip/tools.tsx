"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { businessTripStagePath } from "@/business-trip/routes";
import {
  businessTripStageSchema,
  businessTripWorkspacePatchSchema,
  coerceBusinessTripWorkspaceState,
  draftPlanSchema,
  hotelOptionSchema,
  mergeBusinessTripWorkspaceState,
  policyCheckSchema,
  requirementCardSchema,
} from "@/business-trip/state";

const agentId = "travel_planner";

export function useBusinessTripFrontendTools() {
  useFrontendTool(
    {
      agentId,
      name: "set_business_trip_stage",
      description: "Move the business trip workspace to one workflow stage.",
      parameters: z.object({
        stage: businessTripStageSchema,
      }),
      handler: async ({ stage }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, stage);
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            stage,
            workflowStage: stage,
          }),
        );
        return `workspace_stage=${stage}; route=${businessTripStagePath(stage)}`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_requirement_cards",
      description:
        "Compatibility tool for requirement cards and request-level fields. Prefer update_requirement_form for the requirements form.",
      parameters: z.object({
        destination: z.string().nullish(),
        startDate: z.string().nullish(),
        nights: z.number().int().positive().nullish(),
        budgetKrw: z.number().int().positive().nullish(),
        tripPurpose: z.string().nullish(),
        preferences: z.array(z.string()).optional(),
        requirementCards: z.array(requirementCardSchema),
      }),
      handler: async (patch, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(
          agent.state,
          "requirements",
        );
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            ...patch,
            stage: "requirements",
            workflowStage: "requirements",
          }),
        );
        return "requirements_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_requirement_form",
      description:
        "Fill or patch the requirements form from chat. Update only fields the user supplied or the agent confidently inferred, then stop for user confirmation.",
      parameters: z.object({
        destination: z.string().nullish(),
        startDate: z.string().nullish(),
        nights: z.number().int().positive().nullish(),
        budgetKrw: z.number().int().positive().nullish(),
        tripPurpose: z.string().nullish(),
        preferences: z.array(z.string()).optional(),
      }),
      handler: async (patch, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(
          agent.state,
          "requirements",
        );
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            ...patch,
            stage: "requirements",
            workflowStage: "requirements",
          }),
        );
        return "requirement_form_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_draft_plan",
      description:
        "Update the calendar-style draft itinerary for the draft stage. Prefer event-level itinerary items with date, weekday, startTime, endTime, location, category, title, and detail.",
      parameters: z.object({
        draftPlan: draftPlanSchema,
      }),
      handler: async ({ draftPlan }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "draft");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            draftPlan,
            stage: "draft",
            workflowStage: "draft",
          }),
        );
        return "draft_plan_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_hotel_options",
      description:
        "Update hotel comparison options without replacing unrelated state. Do not choose a hotel unless the user explicitly selected one.",
      parameters: z.object({
        hotelOptions: z.array(hotelOptionSchema),
        budgetKrw: z.number().int().positive().nullish(),
        selectedHotelId: z.string().nullish(),
      }),
      handler: async (patch, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(
          agent.state,
          "comparison",
        );
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            ...patch,
            stage: "comparison",
            workflowStage: "comparison",
          }),
        );
        return "hotel_options_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_policy_checks",
      description:
        "Update policy checks and approval status for review after the user selected an option or explicitly requested review.",
      parameters: z.object({
        policyChecks: z.array(policyCheckSchema),
        approvalStatus: z
          .enum(["not_requested", "pending", "approved", "rejected"])
          .optional(),
        pendingAction: z.string().nullish(),
      }),
      handler: async (patch, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "review");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            ...patch,
            stage: "review",
            workflowStage: "review",
          }),
        );
        return "policy_checks_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "set_final_plan",
      description:
        "Set the final approved business trip plan only after explicit approval from chat or the review workspace.",
      parameters: z.object({
        finalPlan: z.object({
          title: z.string(),
          summary: z.string(),
          approvalNote: z.string(),
        }),
      }),
      handler: async ({ finalPlan }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "final");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            finalPlan,
            approvalStatus: "approved",
            stage: "final",
            workflowStage: "final",
          }),
        );
        return "final_plan_updated";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "select_hotel_option",
      description:
        "Record the user's selected hotel option. Use only when the latest chat message or workspace action explicitly selected that hotel.",
      parameters: z.object({
        selectedHotelId: z.string(),
      }),
      handler: async ({ selectedHotelId }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "review");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            selectedHotelId,
            approvalStatus: "pending",
            lastUserAction: "select_hotel",
            pendingAction: "review_selected_hotel",
            stage: "review",
            workflowStage: "review",
          }),
        );
        return "hotel_option_selected";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "approve_business_trip_plan",
      description: "Record approval from a workspace approval component.",
      parameters: z.object({
        note: z.string().optional(),
      }),
      handler: async ({ note }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "review");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            approvalStatus: "approved",
            lastUserAction: "approve_plan",
            pendingAction: note ?? "finalize_plan",
          }),
        );
        return "business_trip_plan_approved";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "reject_business_trip_plan",
      description: "Record rejection from a workspace approval component.",
      parameters: z.object({
        reason: z.string().optional(),
      }),
      handler: async ({ reason }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(agent.state, "review");
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            approvalStatus: "rejected",
            lastUserAction: "reject_plan",
            pendingAction: reason ?? "revise_plan",
          }),
        );
        return "business_trip_plan_rejected";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "edit_requirement",
      description: "Record a small user edit to one requirement field.",
      parameters: z.object({
        field: z.string(),
        value: z.string(),
      }),
      handler: async ({ field }, { agent }) => {
        const currentState = coerceBusinessTripWorkspaceState(
          agent.state,
          "requirements",
        );
        agent.setState(
          mergeBusinessTripWorkspaceState(currentState, {
            lastUserAction: `edit_${field}`,
            pendingAction: "revise_requirement",
          }),
        );
        return "requirement_edit_recorded";
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId,
      name: "update_travel_workspace",
      description:
        "Compatibility shim for the current backend prompt. Prefer stage-specific tools when possible.",
      parameters: businessTripWorkspacePatchSchema,
      handler: async (patch, { agent }) => {
        const fallbackStage = patch.stage ?? patch.workflowStage ?? "requirements";
        const currentState = coerceBusinessTripWorkspaceState(
          agent.state,
          fallbackStage,
        );

        // 현재 backend prompt가 이 tool 이름을 기대한다.
        // 장기 구조는 위의 stage/component별 tool로 분리해서 거대한 optional schema 노출을 줄인다.
        agent.setState(mergeBusinessTripWorkspaceState(currentState, patch));
        return "travel_workspace_updated";
      },
    },
    [],
  );
}
