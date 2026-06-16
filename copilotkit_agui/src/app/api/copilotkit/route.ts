import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const agentUrl = process.env.AGENT_AG_UI_URL ?? "http://localhost:8200/api/ag-ui";
const travelPlannerAgent = new HttpAgent({
  agentId: "travel_planner",
  url: agentUrl,
});

const runtime = new CopilotRuntime({
  agents: {
    // CopilotKit 1.59.5 runtime package pins @ag-ui/client internally.
    // registry 최신 @ag-ui/client와 private field 타입만 갈라지므로 runtime agent 계약으로 좁혀서 넘긴다.
    travel_planner: travelPlannerAgent as never,
  },
  // A2UI renderer는 client provider가 직접 주입하지 않는다.
  // runtime이 이 값을 /info 경로로 알려야 CopilotKit v2 provider가 A2UI activity renderer를 자동으로 켠다.
  a2ui: {},
});

const handleCopilotKitRequest = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const GET = handleCopilotKitRequest;
export const POST = handleCopilotKitRequest;
