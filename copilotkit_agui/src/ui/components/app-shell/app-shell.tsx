import type { ReactNode } from "react";
import { CopilotBusinessTripSidebar } from "@/ui/components/copilot-business-trip-sidebar/copilot-business-trip-sidebar";
import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <CopilotBusinessTripSidebar />
    </div>
  );
}
