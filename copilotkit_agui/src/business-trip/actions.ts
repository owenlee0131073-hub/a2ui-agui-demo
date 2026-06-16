import type { BusinessTripStage } from "@/business-trip/routes";
import {
  mergeBusinessTripWorkspaceState,
  type FinalPlanState,
  type HotelOptionState,
  type PolicyCheckState,
  type BusinessTripWorkspaceState,
} from "@/business-trip/state";

type BusinessTripActionAgent = {
  addMessage: (message: {
    id: string;
    role: "user";
    content: string;
  }) => void;
  setState: (state: BusinessTripWorkspaceState) => void;
};

type BusinessTripActionRunner = (
  action: BusinessTripWorkspaceAction,
) => Promise<unknown>;

export type BusinessTripWorkspaceAction =
  | {
      source: "workspace_component";
      action: "confirm_requirements";
      stage: BusinessTripStage;
      payload?: Record<string, never>;
    }
  | {
      source: "workspace_component";
      action: "select_hotel";
      stage: BusinessTripStage;
      payload: {
        selectedHotelId: string;
      };
    }
  | {
      source: "workspace_component";
      action: "approve_plan";
      stage: BusinessTripStage;
      payload: {
        note?: string;
      };
    }
  | {
      source: "workspace_component";
      action: "reject_plan";
      stage: BusinessTripStage;
      payload: {
        reason?: string;
      };
    }
  | {
      source: "workspace_component";
      action: "edit_draft_event";
      stage: BusinessTripStage;
      payload: {
        eventIndex: number;
        title: string;
        startTime: string;
        endTime: string;
        day?: string;
        date?: string | null;
      };
    }
  | {
      source: "workspace_component";
      action: "edit_requirement";
      stage: BusinessTripStage;
      payload: {
        field: string;
        value: string;
      };
    };

export function applyBusinessTripWorkspaceAction(
  state: BusinessTripWorkspaceState,
  action: BusinessTripWorkspaceAction,
) {
  if (action.action === "confirm_requirements") {
    return mergeBusinessTripWorkspaceState(state, {
      lastUserAction: "confirm_requirements",
      pendingAction: "create_draft_plan",
      stage: "requirements",
      workflowStage: "requirements",
    });
  }

  if (action.action === "select_hotel") {
    const selectedHotel = state.hotelOptions.find(
      (option) => option.id === action.payload.selectedHotelId,
    );

    return mergeBusinessTripWorkspaceState(state, {
      selectedHotelId: action.payload.selectedHotelId,
      approvalStatus: "pending",
      lastUserAction: "select_hotel",
      pendingAction: "approve_or_reject_plan",
      policyChecks: buildPolicyChecks(state, selectedHotel),
      stage: "review",
      workflowStage: "review",
    });
  }

  if (action.action === "approve_plan") {
    return mergeBusinessTripWorkspaceState(state, {
      approvalStatus: "approved",
      finalPlan: buildFinalPlan(state),
      lastUserAction: "approve_plan",
      pendingAction: "final_plan_ready",
      stage: "final",
      workflowStage: "final",
    });
  }

  if (action.action === "reject_plan") {
    return mergeBusinessTripWorkspaceState(state, {
      approvalStatus: "rejected",
      lastUserAction: "reject_plan",
      pendingAction: "revise_plan",
    });
  }

  if (action.action === "edit_draft_event") {
    const draftPlan = state.draftPlan
      ? {
          ...state.draftPlan,
          itinerary: state.draftPlan.itinerary.map((item, index) => {
            if (index !== action.payload.eventIndex) {
              return item;
            }

            return {
              ...item,
              startTime: action.payload.startTime,
              endTime: action.payload.endTime,
            };
          }),
        }
      : state.draftPlan;

    return mergeBusinessTripWorkspaceState(state, {
      draftPlan,
      lastUserAction: "edit_draft_event",
      pendingAction: "review_draft_edit",
      stage: "draft",
      workflowStage: "draft",
    });
  }

  return mergeBusinessTripWorkspaceState(state, {
    lastUserAction: "edit_requirement",
    pendingAction: "revise_requirement",
  });
}

function businessTripActionMessage(action: BusinessTripWorkspaceAction) {
  if (action.action === "confirm_requirements") {
    return "UI에서 출장 요청 조건을 확인했습니다. 현재 공유 상태의 요청 조건을 기준으로 일정 초안을 작성해주세요.";
  }

  if (action.action === "select_hotel") {
    return `UI에서 호텔 옵션 ${action.payload.selectedHotelId}를 선택했고, 검토 화면의 공유 상태도 업데이트했습니다. 같은 검토 데이터를 tool로 다시 쓰지 말고 현재 상태 기준으로 승인/반려가 가능하다고 짧게 안내해주세요.`;
  }

  if (action.action === "approve_plan") {
    return "UI에서 출장안을 승인했고 최종안 공유 상태도 업데이트했습니다. set_final_plan을 다시 호출하지 말고 확정 사실만 짧게 확인해주세요.";
  }

  if (action.action === "reject_plan") {
    return "UI에서 출장안을 반려했습니다. 선택된 계획의 수정 방향을 제안해주세요.";
  }

  if (action.action === "edit_draft_event") {
    return `UI에서 일정 초안의 "${action.payload.title}" 시간을 ${action.payload.startTime}-${action.payload.endTime}로 수정했습니다. 현재 캘린더 상태를 기준으로 변경 사실만 짧게 확인하고 다음 결정이 필요하면 물어봐주세요.`;
  }

  return `UI에서 요청 조건 ${action.payload.field} 값을 수정했습니다. 변경사항을 반영해주세요.`;
}

export async function sendBusinessTripWorkspaceAction(
  agent: BusinessTripActionAgent,
  state: BusinessTripWorkspaceState,
  action: BusinessTripWorkspaceAction,
  runAfterStateChange: BusinessTripActionRunner,
) {
  const nextState = applyBusinessTripWorkspaceAction(state, action);
  agent.setState(nextState);
  agent.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content: businessTripActionMessage(action),
  });

  await runAfterStateChange(action);
}

function buildPolicyChecks(
  state: BusinessTripWorkspaceState,
  selectedHotel: HotelOptionState | undefined,
): PolicyCheckState[] {
  const checks: PolicyCheckState[] = [];

  if (selectedHotel) {
    const budgetKrw = state.budgetKrw;
    const budgetStatus =
      budgetKrw == null
        ? "warning"
        : selectedHotel.totalKrw <= budgetKrw
          ? "approved"
          : "rejected";

    checks.push({
      id: "selected-hotel-budget",
      title: "예산 검토",
      status: budgetStatus,
      detail:
        budgetKrw == null
          ? `${selectedHotel.name}의 총액 ${formatKrwForMessage(
              selectedHotel.totalKrw,
            )}을 확인했습니다. 승인 예산이 아직 명확하지 않습니다.`
          : `${selectedHotel.name} 총액 ${formatKrwForMessage(
              selectedHotel.totalKrw,
            )} / 승인 예산 ${formatKrwForMessage(budgetKrw)} 기준입니다.`,
    });

    checks.push({
      id: "selected-hotel-policy",
      title: "숙소 정책",
      status: selectedHotel.policyStatus,
      detail:
        selectedHotel.policyStatus === "approved"
          ? "선택한 숙소는 현재 출장 정책 기준에 적합합니다."
          : selectedHotel.policyStatus === "warning"
            ? "선택한 숙소는 추가 확인이 필요한 정책 상태입니다."
            : "선택한 숙소는 정책상 제외 대상입니다.",
    });

    checks.push({
      id: "selected-hotel-route",
      title: "출장 동선",
      status: "approved",
      detail: `${selectedHotel.location} 위치를 기준으로 일정 초안과 숙소 동선을 함께 검토합니다.`,
    });
  }

  if (state.draftPlan) {
    checks.push({
      id: "draft-plan-ready",
      title: "일정 초안",
      status: state.draftPlan.itinerary.length > 0 ? "approved" : "warning",
      detail: `${state.draftPlan.title} 기준으로 ${state.draftPlan.itinerary.length}개 일정 항목이 준비되어 있습니다.`,
    });
  }

  return checks;
}

function buildFinalPlan(state: BusinessTripWorkspaceState): FinalPlanState {
  const selectedHotel = state.hotelOptions.find(
    (option) => option.id === state.selectedHotelId,
  );
  const title = state.draftPlan?.title
    ? `${state.draftPlan.title} 최종안`
    : `${state.destination ?? "출장"} 최종안`;
  const summaryParts = [
    state.destination ? `목적지 ${state.destination}` : null,
    state.startDate ? `출발 ${state.startDate}` : null,
    state.nights ? `${state.nights}박` : null,
    state.budgetKrw ? `예산 ${formatKrwForMessage(state.budgetKrw)}` : null,
    selectedHotel ? `선택 숙소 ${selectedHotel.name}` : null,
  ].filter(Boolean);

  return {
    title,
    summary: summaryParts.join(" · ") || "승인된 출장 계획입니다.",
    approvalNote: "사용자가 승인 검토 화면에서 출장안을 승인했습니다.",
  };
}

function formatKrwForMessage(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
