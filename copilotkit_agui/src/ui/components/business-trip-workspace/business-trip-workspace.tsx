"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type JsonSerializable,
  UseAgentUpdate,
  useAgent,
  useAgentContext,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import {
  businessTripStageLabels,
  businessTripStagePath,
  businessTripStages,
  isBusinessTripStage,
  type BusinessTripStage,
} from "@/business-trip/routes";
import {
  coerceBusinessTripWorkspaceState,
  mergeBusinessTripWorkspaceState,
  type BusinessTripWorkspacePatch,
  type BusinessTripWorkspaceState,
} from "@/business-trip/state";
import { sendBusinessTripWorkspaceAction } from "@/business-trip/actions";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import { useBusinessTripFrontendTools } from "@/business-trip/tools";
import { Tabs, TabsList, TabsTrigger } from "@/ui/primitives/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { BusinessTripComparisonPage } from "@/ui/pages/business-trip/comparison-page";
import { BusinessTripDraftPage } from "@/ui/pages/business-trip/draft-page";
import { BusinessTripFinalPage } from "@/ui/pages/business-trip/final-page";
import { BusinessTripRequirementsPage } from "@/ui/pages/business-trip/requirements-page";
import { BusinessTripReviewPage } from "@/ui/pages/business-trip/review-page";
import styles from "./business-trip-workspace.module.css";

type BusinessTripWorkspaceProps = {
  routeStage: BusinessTripStage;
};

// stage route 전환 중 component가 다시 mount되어도 UI action follow-up을 잃지 않기 위한 탭 내부 bridge다.
// 일정/숙소 같은 실제 업무 state는 여전히 AG-UI shared state가 원천이다.
let queuedWorkspaceActionSnapshot: BusinessTripWorkspaceAction | null = null;

export function BusinessTripWorkspace({ routeStage }: BusinessTripWorkspaceProps) {
  const router = useRouter();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({
    agentId: "travel_planner",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [queuedWorkspaceAction, setQueuedWorkspaceActionState] =
    useState<BusinessTripWorkspaceAction | null>(queuedWorkspaceActionSnapshot);

  const setQueuedWorkspaceAction = useCallback(
    (action: BusinessTripWorkspaceAction | null) => {
      queuedWorkspaceActionSnapshot = action;
      setQueuedWorkspaceActionState(action);
    },
    [],
  );

  useBusinessTripFrontendTools();

  const workspaceState = useMemo(
    () => coerceBusinessTripWorkspaceState(agent.state, routeStage),
    [agent.state, routeStage],
  );

  // CopilotKit은 AG-UI state를 run input에 싣지만, 현재 화면 projection도 agent context로 알려준다.
  // workspace 버튼 action 후 follow-up run이 같은 화면 사실을 기준으로 답하도록 유지하기 위한 경계다.
  useAgentContext({
    description: "Current business trip workspace state rendered in the browser",
    value: workspaceState as JsonSerializable,
  });

  useEffect(() => {
    if (
      isBusinessTripStage(workspaceState.stage) &&
      workspaceState.stage !== routeStage
    ) {
      router.replace(businessTripStagePath(workspaceState.stage));
    }
  }, [routeStage, router, workspaceState.stage]);

  const handleStageChange = useCallback(
    (nextStage: string) => {
      if (isBusinessTripStage(nextStage)) {
        router.push(businessTripStagePath(nextStage));
      }
    },
    [router],
  );

  useEffect(() => {
    if (!queuedWorkspaceAction || actionPending || agent.isRunning) {
      return;
    }

    let cancelled = false;

    async function runQueuedWorkspaceAction() {
      const actionToRun = queuedWorkspaceAction;

      // 선택/승인 같은 workspace action은 state에 먼저 반영한다.
      // agent가 이미 실행 중이면 후속 run만 큐에 넣고, 실행 가능해지는 시점에 이어서 보낸다.
      setQueuedWorkspaceAction(null);
      setActionError(null);
      setActionPending(true);

      try {
        await copilotkit.runAgent({
          agent,
          forwardedProps: {
            uiAction: actionToRun,
          },
        });
      } catch (error) {
        if (!cancelled) {
          setActionError(
            error instanceof Error
              ? error.message
              : "요청을 처리하는 중 문제가 발생했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setActionPending(false);
        }
      }
    }

    void runQueuedWorkspaceAction();

    return () => {
      cancelled = true;
    };
  }, [
    actionPending,
    agent,
    copilotkit,
    queuedWorkspaceAction,
    setQueuedWorkspaceAction,
  ]);

  const handleWorkspaceAction = useCallback(
    async (action: BusinessTripWorkspaceAction) => {
      if (actionPending || queuedWorkspaceAction) {
        return;
      }

      setActionError(null);
      setActionPending(true);

      try {
        await sendBusinessTripWorkspaceAction(
          agent,
          workspaceState,
          action,
          async (uiAction) => {
            if (agent.isRunning) {
              setQueuedWorkspaceAction(uiAction);
              return;
            }

            await copilotkit.runAgent({
              agent,
              forwardedProps: {
                uiAction,
              },
            });
          },
        );
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "요청을 처리하는 중 문제가 발생했습니다.",
        );
      } finally {
        setActionPending(false);
      }
    },
    [
      actionPending,
      agent,
      copilotkit,
      queuedWorkspaceAction,
      setQueuedWorkspaceAction,
      workspaceState,
    ],
  );

  const handleWorkspaceStatePatch = useCallback(
    (patch: BusinessTripWorkspacePatch) => {
      agent.setState(
        mergeBusinessTripWorkspaceState(workspaceState, {
          ...patch,
          stage: "requirements",
          workflowStage: "requirements",
          lastUserAction: "edit_requirement_form",
          pendingAction: "confirm_requirements",
        }),
      );
    },
    [agent, workspaceState],
  );

  return (
    <section className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <p className={styles.kicker}>Business Trip</p>
          <h1 className={styles.title}>출장 계획</h1>
        </div>
        <Tabs value={routeStage} onValueChange={handleStageChange}>
          <TabsList className={styles.stageTabs}>
            {businessTripStages.map((stage) => (
              <TabsTrigger key={stage} value={stage}>
                {businessTripStageLabels[stage]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {actionError ? (
        <Alert variant="destructive" className={styles.actionAlert}>
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <StagePage
        routeStage={routeStage}
        actionPending={actionPending || Boolean(queuedWorkspaceAction)}
        agentRunning={agent.isRunning}
        state={workspaceState}
        onStatePatch={handleWorkspaceStatePatch}
        onWorkspaceAction={handleWorkspaceAction}
      />
    </section>
  );
}

type StagePageProps = {
  routeStage: BusinessTripStage;
  actionPending: boolean;
  agentRunning: boolean;
  state: BusinessTripWorkspaceState;
  onStatePatch: (patch: BusinessTripWorkspacePatch) => void;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

function StagePage({
  routeStage,
  actionPending,
  agentRunning,
  state,
  onStatePatch,
  onWorkspaceAction,
}: StagePageProps) {
  const actionDisabled = actionPending || agentRunning;

  if (routeStage === "requirements") {
    return (
      <BusinessTripRequirementsPage
        actionDisabled={actionDisabled}
        state={state}
        onStatePatch={onStatePatch}
        onWorkspaceAction={onWorkspaceAction}
      />
    );
  }

  if (routeStage === "draft") {
    return (
      <BusinessTripDraftPage
        actionDisabled={actionPending}
        state={state}
        onWorkspaceAction={onWorkspaceAction}
      />
    );
  }

  if (routeStage === "comparison") {
    return (
      <BusinessTripComparisonPage
        actionDisabled={actionPending}
        state={state}
        onWorkspaceAction={onWorkspaceAction}
      />
    );
  }

  if (routeStage === "review") {
    return (
      <BusinessTripReviewPage
        actionDisabled={actionPending}
        state={state}
        onWorkspaceAction={onWorkspaceAction}
      />
    );
  }

  return <BusinessTripFinalPage state={state} />;
}
