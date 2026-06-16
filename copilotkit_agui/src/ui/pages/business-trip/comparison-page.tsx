import { HotelIcon } from "lucide-react";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import {
  formatKrw,
  type BusinessTripWorkspaceState,
} from "@/business-trip/state";
import { HotelOptionCard } from "@/ui/components/hotel-option-card/hotel-option-card";
import { Badge } from "@/ui/primitives/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/primitives/empty";
import styles from "./comparison-page.module.css";

type BusinessTripComparisonPageProps = {
  actionDisabled: boolean;
  state: BusinessTripWorkspaceState;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

export function BusinessTripComparisonPage({
  actionDisabled,
  state,
  onWorkspaceAction,
}: BusinessTripComparisonPageProps) {
  const options = state.hotelOptions ?? [];

  if (options.length === 0) {
    return (
      <Empty className={styles.empty}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HotelIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>비교할 옵션이 없습니다</EmptyTitle>
          <EmptyDescription>
            숙소와 이동 조건이 준비되면 비교 결과가 표시됩니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.summary}>
        <Badge variant="secondary">예산 {formatKrw(state.budgetKrw) || "미정"}</Badge>
        <span>{options.length}개 옵션</span>
      </div>
      <div className={styles.grid}>
        {options.map((option) => (
          <HotelOptionCard
            key={option.id}
            disabled={actionDisabled}
            option={option}
            selected={state.selectedHotelId === option.id}
            onSelect={(selectedHotelId) =>
              onWorkspaceAction({
                source: "workspace_component",
                action: "select_hotel",
                stage: "comparison",
                payload: { selectedHotelId },
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
