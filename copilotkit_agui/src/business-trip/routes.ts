export const businessTripStages = [
  "requirements",
  "draft",
  "comparison",
  "review",
  "final",
] as const;

export type BusinessTripStage = (typeof businessTripStages)[number];

export const businessTripStageLabels: Record<BusinessTripStage, string> = {
  requirements: "요청 조건",
  draft: "일정 초안",
  comparison: "옵션 비교",
  review: "승인 검토",
  final: "확정안",
};

export function isBusinessTripStage(value: unknown): value is BusinessTripStage {
  return (
    typeof value === "string" &&
    businessTripStages.includes(value as BusinessTripStage)
  );
}

export function businessTripStagePath(stage: BusinessTripStage) {
  return `/business-trip/${stage}`;
}

export function requireBusinessTripStage(value: string) {
  return isBusinessTripStage(value) ? value : null;
}
