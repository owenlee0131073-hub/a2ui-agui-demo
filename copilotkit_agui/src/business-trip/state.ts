import { z } from "zod";
import {
  businessTripStages,
  isBusinessTripStage,
  type BusinessTripStage,
} from "@/business-trip/routes";

export const approvalStatusValues = [
  "not_requested",
  "pending",
  "approved",
  "rejected",
] as const;

export const policyStatusValues = ["approved", "warning", "rejected"] as const;
export const requirementStatusValues = ["missing", "draft", "confirmed"] as const;
export const itineraryCategoryValues = [
  "travel",
  "meeting",
  "work",
  "meal",
  "lodging",
  "buffer",
] as const;

export const businessTripStageSchema = z.enum(businessTripStages);
export const approvalStatusSchema = z.enum(approvalStatusValues);
export const policyStatusSchema = z.enum(policyStatusValues);
export const requirementStatusSchema = z.enum(requirementStatusValues);
export const itineraryCategorySchema = z.enum(itineraryCategoryValues);

export const requirementCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.string(),
  status: requirementStatusSchema.default("draft"),
  description: z.string().nullish(),
});

export const itineraryItemSchema = z.object({
  day: z.string(),
  date: z.string().nullish(),
  weekday: z.string().nullish(),
  title: z.string(),
  detail: z.string(),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
  location: z.string().nullish(),
  category: itineraryCategorySchema.default("work"),
  notes: z.array(z.string()).default([]),
});

export const draftPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  timezone: z.string().default("GMT+09"),
  calendarStartHour: z.number().int().min(0).max(23).default(7),
  calendarEndHour: z.number().int().min(1).max(24).default(22),
  itinerary: z.array(itineraryItemSchema).default([]),
});

export const hotelOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  nightlyRateKrw: z.number().int().nonnegative(),
  totalKrw: z.number().int().nonnegative(),
  policyStatus: policyStatusSchema,
  highlights: z.array(z.string()).default([]),
});

export const policyCheckSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: policyStatusSchema,
  detail: z.string(),
});

export const finalPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  approvalNote: z.string(),
});

export const businessTripWorkspaceStateSchema = z
  .object({
    stage: z.union([businessTripStageSchema, z.literal("idle")]).nullish(),
    workflowStage: businessTripStageSchema.optional(),
    destination: z.string().nullish(),
    startDate: z.string().nullish(),
    nights: z.number().int().positive().nullish(),
    budgetKrw: z.number().int().positive().nullish(),
    tripPurpose: z.string().nullish(),
    preferences: z.array(z.string()).default([]),
    selectedHotelId: z.string().nullish(),
    approvalStatus: approvalStatusSchema.default("not_requested"),
    lastUserAction: z.string().nullish(),
    pendingAction: z.string().nullish(),
    requirementCards: z.array(requirementCardSchema).default([]),
    draftPlan: draftPlanSchema.nullish(),
    hotelOptions: z.array(hotelOptionSchema).default([]),
    policyChecks: z.array(policyCheckSchema).default([]),
    finalPlan: finalPlanSchema.nullish(),
  });

export const businessTripWorkspacePatchSchema = z
  .object({
    stage: businessTripStageSchema.optional(),
    workflowStage: businessTripStageSchema.optional(),
    destination: z.string().nullish(),
    startDate: z.string().nullish(),
    nights: z.number().int().positive().nullish(),
    budgetKrw: z.number().int().positive().nullish(),
    tripPurpose: z.string().nullish(),
    preferences: z.array(z.string()).optional(),
    selectedHotelId: z.string().nullish(),
    approvalStatus: approvalStatusSchema.optional(),
    lastUserAction: z.string().nullish(),
    pendingAction: z.string().nullish(),
    requirementCards: z.array(requirementCardSchema).optional(),
    draftPlan: draftPlanSchema.nullish(),
    hotelOptions: z.array(hotelOptionSchema).optional(),
    policyChecks: z.array(policyCheckSchema).optional(),
    finalPlan: finalPlanSchema.nullish(),
  })
  .passthrough();

export type RequirementCardState = z.infer<typeof requirementCardSchema>;
export type DraftPlanState = z.infer<typeof draftPlanSchema>;
export type HotelOptionState = z.infer<typeof hotelOptionSchema>;
export type PolicyCheckState = z.infer<typeof policyCheckSchema>;
export type FinalPlanState = z.infer<typeof finalPlanSchema>;
export type BusinessTripWorkspaceState = z.infer<
  typeof businessTripWorkspaceStateSchema
>;
export type BusinessTripWorkspacePatch = z.infer<
  typeof businessTripWorkspacePatchSchema
>;

export function emptyBusinessTripWorkspaceState(
  stage: BusinessTripStage,
): BusinessTripWorkspaceState {
  return {
    stage,
    workflowStage: stage,
    approvalStatus: "not_requested",
    preferences: [],
    requirementCards: [],
    hotelOptions: [],
    policyChecks: [],
  };
}

export function compactBusinessTripPatch(
  patch: BusinessTripWorkspacePatch,
): BusinessTripWorkspacePatch {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as BusinessTripWorkspacePatch;
}

export function coerceBusinessTripWorkspaceState(
  value: unknown,
  fallbackStage: BusinessTripStage,
): BusinessTripWorkspaceState {
  const parsed = businessTripWorkspaceStateSchema.safeParse(value);

  if (!parsed.success) {
    return emptyBusinessTripWorkspaceState(fallbackStage);
  }

  const parsedStage = parsed.data.stage;
  const stage =
    isBusinessTripStage(parsedStage)
      ? parsedStage
      : parsed.data.workflowStage ?? fallbackStage;

  return {
    ...parsed.data,
    stage,
    workflowStage: parsed.data.workflowStage ?? stage,
    approvalStatus: parsed.data.approvalStatus ?? "not_requested",
    requirementCards: parsed.data.requirementCards ?? [],
    preferences: parsed.data.preferences ?? [],
    hotelOptions: parsed.data.hotelOptions ?? [],
    policyChecks: parsed.data.policyChecks ?? [],
  };
}

export function mergeBusinessTripWorkspaceState(
  currentState: BusinessTripWorkspaceState,
  patch: BusinessTripWorkspacePatch,
): BusinessTripWorkspaceState {
  const compactPatch = compactBusinessTripPatch(patch);
  const nextStage =
    compactPatch.stage ??
    compactPatch.workflowStage ??
    (isBusinessTripStage(currentState.stage) ? currentState.stage : "requirements");

  return {
    ...currentState,
    ...compactPatch,
    stage: nextStage,
    workflowStage: compactPatch.workflowStage ?? nextStage,
    approvalStatus:
      compactPatch.approvalStatus ?? currentState.approvalStatus ?? "not_requested",
    requirementCards:
      compactPatch.requirementCards ?? currentState.requirementCards ?? [],
    preferences: compactPatch.preferences ?? currentState.preferences ?? [],
    hotelOptions: compactPatch.hotelOptions ?? currentState.hotelOptions ?? [],
    policyChecks: compactPatch.policyChecks ?? currentState.policyChecks ?? [],
  };
}

export function formatKrw(value: number | null | undefined) {
  if (value == null) {
    return "";
  }

  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
