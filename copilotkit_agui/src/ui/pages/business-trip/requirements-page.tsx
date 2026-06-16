import type {
  BusinessTripWorkspacePatch,
  BusinessTripWorkspaceState,
} from "@/business-trip/state";
import type { BusinessTripWorkspaceAction } from "@/business-trip/actions";
import { TripRequestForm } from "@/ui/components/trip-request-form/trip-request-form";
import styles from "./requirements-page.module.css";

type BusinessTripRequirementsPageProps = {
  actionDisabled: boolean;
  state: BusinessTripWorkspaceState;
  onStatePatch: (patch: BusinessTripWorkspacePatch) => void;
  onWorkspaceAction: (action: BusinessTripWorkspaceAction) => Promise<void>;
};

export function BusinessTripRequirementsPage({
  actionDisabled,
  state,
  onStatePatch,
  onWorkspaceAction,
}: BusinessTripRequirementsPageProps) {
  return (
    <div className={styles.page}>
      <TripRequestForm
        actionDisabled={actionDisabled}
        state={state}
        onStatePatch={onStatePatch}
        onWorkspaceAction={onWorkspaceAction}
      />
    </div>
  );
}
