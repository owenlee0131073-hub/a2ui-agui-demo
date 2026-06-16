import { CalendarDaysIcon } from "lucide-react";
import type { BusinessTripWorkspaceState } from "@/business-trip/state";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import { Badge } from "@/ui/primitives/badge";
import { DraftCalendar } from "@/ui/components/draft-calendar/draft-calendar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/primitives/empty";
import styles from "./draft-page.module.css";

type BusinessTripDraftPageProps = {
  actionDisabled: boolean;
  state: BusinessTripWorkspaceState;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

export function BusinessTripDraftPage({
  actionDisabled,
  state,
  onWorkspaceAction,
}: BusinessTripDraftPageProps) {
  if (!state.draftPlan) {
    return (
      <Empty className={styles.empty}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDaysIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>작성된 일정 초안이 없습니다</EmptyTitle>
          <EmptyDescription>
            조건이 충분해지면 일정 초안이 이곳에 표시됩니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.summary}>
        <Badge variant="secondary">초안</Badge>
        <h2>{state.draftPlan.title}</h2>
        <p>{state.draftPlan.summary}</p>
      </section>
      <DraftCalendar
        actionDisabled={actionDisabled}
        draftPlan={state.draftPlan}
        onWorkspaceAction={onWorkspaceAction}
      />
    </div>
  );
}
