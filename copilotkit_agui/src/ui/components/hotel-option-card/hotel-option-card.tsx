import { CheckIcon, MapPinIcon } from "lucide-react";
import { formatKrw, type HotelOptionState } from "@/business-trip/state";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/primitives/card";
import styles from "./hotel-option-card.module.css";

const policyLabel: Record<HotelOptionState["policyStatus"], string> = {
  approved: "정책 적합",
  warning: "확인 필요",
  rejected: "정책 제외",
};

type HotelOptionCardProps = {
  disabled: boolean;
  option: HotelOptionState;
  selected: boolean;
  onSelect: (hotelId: string) => void;
};

export function HotelOptionCard({
  disabled,
  option,
  selected,
  onSelect,
}: HotelOptionCardProps) {
  return (
    <Card className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <CardHeader>
        <CardTitle>{option.name}</CardTitle>
        <CardAction>
          <Badge variant={option.policyStatus === "approved" ? "default" : "outline"}>
            {policyLabel[option.policyStatus]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className={styles.content}>
        <div className={styles.location}>
          <MapPinIcon aria-hidden="true" />
          <span>{option.location}</span>
        </div>
        <dl className={styles.priceGrid}>
          <div>
            <dt>1박</dt>
            <dd>{formatKrw(option.nightlyRateKrw)}</dd>
          </div>
          <div>
            <dt>총액</dt>
            <dd>{formatKrw(option.totalKrw)}</dd>
          </div>
        </dl>
        {option.highlights.length > 0 ? (
          <ul className={styles.highlights}>
            {option.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        ) : null}
        <Button
          type="button"
          disabled={disabled}
          variant={selected ? "secondary" : "default"}
          onClick={() => onSelect(option.id)}
        >
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          {selected ? "선택됨" : "선택"}
        </Button>
      </CardContent>
    </Card>
  );
}
