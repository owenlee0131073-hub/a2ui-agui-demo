import { ArrowRight, CalendarDays, CircleDollarSign, MapPin } from "lucide-react";
import type {
  BusinessTripWorkspacePatch,
  BusinessTripWorkspaceState,
} from "@/business-trip/state";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import { Button } from "@/ui/primitives/button";
import styles from "./trip-request-form.module.css";

const preferenceOptions = [
  "역세권",
  "조용한 객실",
  "조식 포함",
  "고객사 인접",
  "예산 우선",
  "이동 최소화",
] as const;

type TripRequestFormProps = {
  actionDisabled: boolean;
  state: BusinessTripWorkspaceState;
  onStatePatch: (patch: BusinessTripWorkspacePatch) => void;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

function parsePositiveInteger(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.floor(numericValue);
}

export function TripRequestForm({
  actionDisabled,
  state,
  onStatePatch,
  onWorkspaceAction,
}: TripRequestFormProps) {
  const preferences = state.preferences ?? [];
  const isReady = Boolean(
    state.destination &&
      state.startDate &&
      state.nights &&
      state.budgetKrw &&
      state.tripPurpose,
  );

  const togglePreference = (preference: string) => {
    const nextPreferences = preferences.includes(preference)
      ? preferences.filter((item) => item !== preference)
      : [...preferences, preference];

    onStatePatch({ preferences: nextPreferences });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();

        if (!isReady || actionDisabled) {
          return;
        }

        void onWorkspaceAction({
          source: "workspace_component",
          action: "confirm_requirements",
          stage: "requirements",
        });
      }}
    >
      <header className={styles.formHeader}>
        <div>
          <p className={styles.eyebrow}>Request Form</p>
          <h2>출장 요청 조건</h2>
        </div>
        <div className={styles.statusCluster} aria-label="입력 상태">
          <span>{state.destination || "목적지 대기"}</span>
          <span>{state.nights ? `${state.nights}박` : "일정 대기"}</span>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="trip-basics-title">
        <div className={styles.sectionHeader}>
          <h3 id="trip-basics-title">기본 정보</h3>
          <span aria-hidden="true" />
        </div>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span>
              <MapPin size={16} aria-hidden="true" />
              목적지
            </span>
            <input
              value={state.destination ?? ""}
              placeholder="예: 부산"
              onChange={(event) =>
                onStatePatch({ destination: event.currentTarget.value || null })
              }
            />
          </label>

          <label className={styles.field}>
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              출발일
            </span>
            <input
              value={state.startDate ?? ""}
              placeholder="예: 2026-07-15"
              onChange={(event) =>
                onStatePatch({ startDate: event.currentTarget.value || null })
              }
            />
          </label>

          <label className={styles.field}>
            <span>숙박일수</span>
            <input
              inputMode="numeric"
              min={1}
              type="number"
              value={state.nights ?? ""}
              placeholder="2"
              onChange={(event) =>
                onStatePatch({
                  nights: parsePositiveInteger(event.currentTarget.value),
                })
              }
            />
          </label>

          <label className={styles.field}>
            <span>
              <CircleDollarSign size={16} aria-hidden="true" />
              예산
            </span>
            <input
              inputMode="numeric"
              min={1}
              type="number"
              value={state.budgetKrw ?? ""}
              placeholder="900000"
              onChange={(event) =>
                onStatePatch({
                  budgetKrw: parsePositiveInteger(event.currentTarget.value),
                })
              }
            />
          </label>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trip-context-title">
        <div className={styles.sectionHeader}>
          <h3 id="trip-context-title">출장 목적</h3>
          <span aria-hidden="true" />
        </div>
        <textarea
          className={styles.textarea}
          value={state.tripPurpose ?? ""}
          placeholder="예: 고객 미팅과 계약 조건 협의"
          rows={3}
          onChange={(event) =>
            onStatePatch({ tripPurpose: event.currentTarget.value || null })
          }
        />
      </section>

      <section className={styles.section} aria-labelledby="trip-preferences-title">
        <div className={styles.sectionHeader}>
          <h3 id="trip-preferences-title">선호 조건</h3>
          <span aria-hidden="true" />
        </div>
        <div className={styles.preferenceGrid}>
          {preferenceOptions.map((preference) => (
            <label key={preference} className={styles.preference}>
              <input
                checked={preferences.includes(preference)}
                type="checkbox"
                onChange={() => togglePreference(preference)}
              />
              <span>{preference}</span>
            </label>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          {isReady
            ? "입력된 조건이 agent shared state에 반영되었습니다."
            : "필수 항목을 채우면 다음 단계로 진행할 수 있습니다."}
        </p>
        <Button
          className={styles.nextButton}
          disabled={!isReady || actionDisabled}
          type="submit"
        >
          다음으로
          <ArrowRight size={17} strokeWidth={2.4} />
        </Button>
      </footer>
    </form>
  );
}
