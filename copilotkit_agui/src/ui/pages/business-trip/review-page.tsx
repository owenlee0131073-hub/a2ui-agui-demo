import {
  CalendarDaysIcon,
  CheckIcon,
  CircleDollarSignIcon,
  HotelIcon,
  MapPinIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import {
  formatKrw,
  type BusinessTripWorkspaceState,
  type PolicyCheckState,
} from "@/business-trip/state";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/primitives/empty";
import styles from "./review-page.module.css";

const approvalStatusLabel: Record<
  NonNullable<BusinessTripWorkspaceState["approvalStatus"]>,
  string
> = {
  not_requested: "요청 전",
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const policyStatusLabel: Record<PolicyCheckState["status"], string> = {
  approved: "통과",
  warning: "확인 필요",
  rejected: "제외",
};

type BusinessTripReviewPageProps = {
  actionDisabled: boolean;
  state: BusinessTripWorkspaceState;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

export function BusinessTripReviewPage({
  actionDisabled,
  state,
  onWorkspaceAction,
}: BusinessTripReviewPageProps) {
  const selectedOption = state.hotelOptions?.find(
    (option) => option.id === state.selectedHotelId,
  );
  const checks = state.policyChecks ?? [];
  const primaryEvents = state.draftPlan?.itinerary.slice(0, 5) ?? [];
  const selectedTotal = selectedOption?.totalKrw ?? null;
  const budgetRemaining =
    state.budgetKrw != null && selectedTotal != null
      ? state.budgetKrw - selectedTotal
      : null;

  if (!selectedOption && checks.length === 0) {
    return (
      <Empty className={styles.empty}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheckIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>검토할 항목이 없습니다</EmptyTitle>
          <EmptyDescription>
            옵션 선택 또는 승인 요청이 들어오면 검토 항목이 표시됩니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <Badge variant="secondary">
            {approvalStatusLabel[state.approvalStatus ?? "not_requested"]}
          </Badge>
          <h2>승인 검토</h2>
          <p>
            선택된 일정, 숙소, 예산, 정책 상태를 기준으로 승인 여부를
            결정합니다.
          </p>
        </div>
        <div className={styles.stateStack}>
          <span>stage: {state.stage ?? "unknown"}</span>
          <span>pending: {state.pendingAction ?? "none"}</span>
        </div>
      </section>

      <section className={styles.overviewGrid}>
        <Card>
          <CardHeader>
            <CardTitle>
              <MapPinIcon aria-hidden="true" />
              출장 조건
            </CardTitle>
            <CardDescription>{state.tripPurpose ?? "출장 목적 미정"}</CardDescription>
          </CardHeader>
          <CardContent className={styles.factList}>
            <Fact label="목적지" value={state.destination} />
            <Fact label="출발일" value={state.startDate} />
            <Fact label="숙박" value={state.nights ? `${state.nights}박` : null} />
            <Fact
              label="선호"
              value={
                state.preferences.length > 0
                  ? state.preferences.join(", ")
                  : "선호 조건 없음"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CircleDollarSignIcon aria-hidden="true" />
              예산
            </CardTitle>
            <CardDescription>
              선택 옵션 총액과 승인 예산을 비교합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.metricGrid}>
            <Metric label="승인 예산" value={formatKrw(state.budgetKrw) || "미정"} />
            <Metric
              label="선택 총액"
              value={selectedTotal != null ? formatKrw(selectedTotal) : "미선택"}
            />
            <Metric
              label="잔여 예산"
              value={budgetRemaining != null ? formatKrw(budgetRemaining) : "미정"}
              tone={
                budgetRemaining == null
                  ? "neutral"
                  : budgetRemaining >= 0
                    ? "positive"
                    : "negative"
              }
            />
          </CardContent>
        </Card>
      </section>

      {selectedOption ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <HotelIcon aria-hidden="true" />
              선택 숙소
            </CardTitle>
            <CardDescription>{selectedOption.location}</CardDescription>
          </CardHeader>
          <CardContent className={styles.selectedHotel}>
            <div>
              <h3>{selectedOption.name}</h3>
              <p>
                1박 {formatKrw(selectedOption.nightlyRateKrw)} · 총액{" "}
                {formatKrw(selectedOption.totalKrw)}
              </p>
            </div>
            <Badge
              variant={
                selectedOption.policyStatus === "approved" ? "default" : "outline"
              }
            >
              {selectedOption.policyStatus === "approved"
                ? "정책 적합"
                : selectedOption.policyStatus === "warning"
                  ? "확인 필요"
                  : "정책 제외"}
            </Badge>
            {selectedOption.highlights.length > 0 ? (
              <ul>
                {selectedOption.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {state.draftPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <CalendarDaysIcon aria-hidden="true" />
              일정 초안
            </CardTitle>
            <CardDescription>{state.draftPlan.summary}</CardDescription>
          </CardHeader>
          <CardContent className={styles.timeline}>
            {primaryEvents.map((event) => (
              <div key={`${event.day}-${event.title}-${event.startTime}`}>
                <time>
                  {event.date ?? event.day} · {event.startTime ?? "--:--"}-
                  {event.endTime ?? "--:--"}
                </time>
                <strong>{event.title}</strong>
                <span>{event.location ?? event.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className={styles.checkList} aria-label="정책 검토">
        {checks.length > 0 ? (
          checks.map((check) => (
            <Card key={check.id}>
              <CardHeader>
                <CardTitle>{check.title}</CardTitle>
                <CardDescription>{check.detail}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={check.status === "approved" ? "default" : "outline"}>
                  {policyStatusLabel[check.status]}
                </Badge>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>정책 검토 대기</CardTitle>
              <CardDescription>
                선택된 옵션을 기준으로 검토 항목이 준비되면 이 영역에 표시됩니다.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <div className={styles.actions}>
        <Button
          type="button"
          disabled={actionDisabled}
          onClick={() =>
            onWorkspaceAction({
              source: "workspace_component",
              action: "approve_plan",
              stage: "review",
              payload: {},
            })
          }
        >
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          승인
        </Button>
        <Button
          type="button"
          disabled={actionDisabled}
          variant="outline"
          onClick={() =>
            onWorkspaceAction({
              source: "workspace_component",
              action: "reject_plan",
              stage: "review",
              payload: {},
            })
          }
        >
          <XIcon data-icon="inline-start" aria-hidden="true" />
          반려
        </Button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "미정"}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
