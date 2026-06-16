import { Badge } from "@/ui/primitives/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import type { RequirementCardState } from "@/business-trip/state";
import styles from "./requirement-card.module.css";

const requirementStatusLabel: Record<RequirementCardState["status"], string> = {
  missing: "필요",
  draft: "확인 중",
  confirmed: "확정",
};

type RequirementCardProps = {
  requirement: RequirementCardState;
};

export function RequirementCard({ requirement }: RequirementCardProps) {
  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{requirement.title}</CardTitle>
        <CardDescription>{requirement.value}</CardDescription>
      </CardHeader>
      {requirement.description ? (
        <CardContent>
          <p className={styles.description}>{requirement.description}</p>
        </CardContent>
      ) : null}
      <CardContent>
        <Badge
          variant={requirement.status === "missing" ? "outline" : "secondary"}
        >
          {requirementStatusLabel[requirement.status]}
        </Badge>
      </CardContent>
    </Card>
  );
}
