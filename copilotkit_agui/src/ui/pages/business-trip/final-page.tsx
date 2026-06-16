import { FileCheckIcon } from "lucide-react";
import type { BusinessTripWorkspaceState } from "@/business-trip/state";
import { Badge } from "@/ui/primitives/badge";
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
import styles from "./final-page.module.css";

type BusinessTripFinalPageProps = {
  state: BusinessTripWorkspaceState;
};

export function BusinessTripFinalPage({ state }: BusinessTripFinalPageProps) {
  if (!state.finalPlan) {
    return (
      <Empty className={styles.empty}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCheckIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>확정된 출장안이 없습니다</EmptyTitle>
          <EmptyDescription>
            승인된 일정과 예산 정보가 준비되면 최종안이 표시됩니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader>
          <CardTitle>{state.finalPlan.title}</CardTitle>
          <CardDescription>{state.finalPlan.summary}</CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          <Badge variant="default">승인 완료</Badge>
          <p>{state.finalPlan.approvalNote}</p>
        </CardContent>
      </Card>
    </div>
  );
}
