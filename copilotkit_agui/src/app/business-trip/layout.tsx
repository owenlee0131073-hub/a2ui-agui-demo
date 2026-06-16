import type { ReactNode } from "react";
import { AppShell } from "@/ui/components/app-shell/app-shell";
import { CopilotBusinessTripProvider } from "@/ui/components/copilot-business-trip-provider/copilot-business-trip-provider";

type BusinessTripLayoutProps = {
  children: ReactNode;
};

export default function BusinessTripLayout({
  children,
}: BusinessTripLayoutProps) {
  return (
    <CopilotBusinessTripProvider>
      <AppShell>{children}</AppShell>
    </CopilotBusinessTripProvider>
  );
}
