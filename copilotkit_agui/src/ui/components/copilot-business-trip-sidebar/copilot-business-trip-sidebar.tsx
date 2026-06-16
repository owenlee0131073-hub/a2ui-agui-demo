"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";

export function CopilotBusinessTripSidebar() {
  return (
    <CopilotSidebar
      agentId="travel_planner"
      defaultOpen
      position="right"
      width={500}
      labels={{
        chatInputPlaceholder: "출장 요청을 입력하세요",
        chatDisclaimerText: "중요한 정보는 직접 확인하세요.",
        chatToggleCloseLabel: "닫기",
        chatToggleOpenLabel: "열기",
        modalHeaderTitle: "출장 지원",
        welcomeMessageText: "목적지, 일정, 예산, 선호 조건을 알려주세요.",
      }}
    />
  );
}
