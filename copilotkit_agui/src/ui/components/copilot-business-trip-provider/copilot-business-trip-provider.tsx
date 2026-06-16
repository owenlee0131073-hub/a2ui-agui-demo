"use client";

import type { ReactNode } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { TooltipProvider } from "@/ui/primitives/tooltip";

type CopilotBusinessTripProviderProps = {
  children: ReactNode;
};

export function CopilotBusinessTripProvider({
  children,
}: CopilotBusinessTripProviderProps) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint
      a2ui={{
        theme: {
          colors: {
            primary: "#0064FF",
          },
        },
      }}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </CopilotKitProvider>
  );
}
