# Tech Reference

기준 날짜: 2026-06-09

이 문서는 `copilotkit_agui` 프론트엔드가 어떤 기술 계약을 따라야 하는지 기록한다. API 변경 가능성이 높은 CopilotKit, AG-UI, Pydantic AI 관련 내용은 구현 직전에 다시 확인하고 lockfile에 고정한다.

## Registry Baseline

2026-06-09에 registry에서 확인한 기준 버전은 아래와 같다.

| Package | Version |
| --- | ---: |
| `bun` | `1.3.4` |
| `next` | `16.2.7` |
| `react` | `19.2.7` |
| `@copilotkit/react-core` | `1.59.5` |
| `@copilotkit/react-ui` | `1.59.5` |
| `@copilotkit/runtime` | `1.59.5` |
| `@copilotkit/a2ui-renderer` | `1.59.5` |
| `@ag-ui/client` | `0.0.55` |
| `@ag-ui/core` | `0.0.55` |
| `pydantic-ai-slim` | `1.106.0` |
| `shadcn` | `4.11.0` |
| `tailwindcss` | `4.3.0` |
| `@tailwindcss/postcss` | `4.3.0` |
| `lucide-react` | `1.17.0` |

구현 직전에는 아래 명령으로 다시 확인한다.

```bash
npm view next version
npm view react version
npm view @copilotkit/react-core version
npm view @copilotkit/react-ui version
npm view @copilotkit/runtime version
npm view @copilotkit/a2ui-renderer version
npm view @ag-ui/client version
npm view @ag-ui/core version
npm view shadcn version
npm view tailwindcss version
npm view @tailwindcss/postcss version
npm view lucide-react version
python3 -m pip index versions pydantic-ai-slim
```

## App Stack

- Package manager/runtime: Bun
- Framework: Next.js App Router + TypeScript
- UI runtime: React
- Styling system: Tailwind CSS v4 + shadcn/ui
- Icon system: lucide-react by default, unless generated `components.json` declares another shadcn icon library
- Agent UI: CopilotKit prebuilt `CopilotSidebar`
- Agent protocol: AG-UI over SSE
- Declarative generative UI: A2UI through CopilotKit runtime/provider
- Python agent runtime: existing `../agent_shared_backend`
- Optional demo network: Tailscale only for remote device access to the local demo, never as an app dependency

Next.js scaffold는 구현 단계에서 Bun으로 생성한다.

```bash
bunx create-next-app@latest .
```

생성 옵션은 App Router, TypeScript, Tailwind CSS, `src/` directory를 기준으로 한다.

shadcn CLI는 Bun runner로만 실행한다.

```bash
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add button card badge table tabs sheet skeleton empty tooltip
```

`Tailscale`을 실제 원격 demo 접속용으로 쓰는 경우에도 URL은 env로만 관리한다. tailnet host, MagicDNS 이름, IP를 source에 하드코딩하지 않는다.

## Core Product Intention

이 앱의 핵심 의도는 "chat 옆에 workspace가 있는 화면"이 아니다.

목표는 아래 두 가지를 실제 동작으로 보여주는 것이다.

1. LLM이 A2UI를 통해 component surface를 렌더링할 수 있다.
2. AG-UI shared state가 route, workspace component, chat follow-up을 같은 사실로 유지한다.

따라서 구현 판단은 항상 "이 UI를 LLM이 선언적으로 렌더링해야 하는가"와 "이 데이터가 장기 상태로 유지되어야 하는가"를 기준으로 나눈다.

## Styling And Brand System

색상 기준은 사용자가 제공한 Toss brand color 캡처를 따른다.

| Token | Hex | Source detail | Usage |
| --- | --- | --- | --- |
| `toss-blue` | `#0064FF` | R0 G100 B255, PANTONE 2175 C | primary action, active route, focus/selection accent |
| `toss-gray` | `#202632` | R32 G38 B50, PANTONE 433 C | primary dark surface, text-heavy dark panel |
| `black` | `#000000` | captured background | dark background |
| `white` | `#FFFFFF` | captured text/background contrast | light foreground/background |

브랜드 컬러는 변형하지 않는다. `#0064FF`와 `#202632`는 임의로 밝게 하거나 어둡게 만든 파생 컬러를 만들지 않는다.

Tailwind CSS v4의 `@theme`/CSS variable과 shadcn semantic token을 기준으로 매핑한다. component에서는 `bg-primary`, `text-muted-foreground`, `border-border` 같은 semantic class를 우선 사용하고, `bg-blue-500`, `text-slate-700` 같은 raw utility 색상은 피한다.

component별 layout, spacing, animation, responsive detail은 component 폴더의 `*.module.css`에 둔다. `globals.css`는 Tailwind import, shadcn semantic token, Toss color token처럼 CSS 전역이어야 하는 것만 가진다. CopilotKit package style은 root layout/provider entry에서 한 번 import한다.

custom component를 무작정 만들지 않는다. 구현 전에 shadcn registry와 local installed component를 먼저 확인하고, 아래 component를 우선 조합한다.

- action: `Button`, `DropdownMenu`, `Tooltip`
- state display: `Card`, `Badge`, `Table`, `Progress`
- stage navigation: `Tabs`, `Sidebar`, `Breadcrumb`
- review/confirmation: `Alert`, `AlertDialog`, `Sheet`
- loading/empty: `Skeleton`, `Spinner`, `Empty`
- option set/input: `ToggleGroup`, `Select`, `Checkbox`, `RadioGroup`, `Field`

custom UI가 필요한 경우에는 이유를 component 파일의 한국어 주석으로 남긴다. "shadcn component 조합으로 표현할 수 없는 AG-UI/A2UI boundary"처럼 책임이 명확한 경우에만 허용한다.

## Runtime Architecture

```text
User
-> CopilotSidebar
-> CopilotKit provider
-> Next.js app/api/copilotkit/route.ts
-> CopilotRuntime
-> HttpAgent("travel_planner")
-> http://localhost:8200/api/ag-ui
-> Pydantic AI AGUIAdapter.dispatch_request()
-> travel_planner agent
-> AG-UI SSE events
-> CopilotKit frontend agent state
-> route + workspace components
```

## Backend Contract

프론트엔드는 새 Pydantic AI runtime을 만들지 않는다.

기존 backend:

- path: `../agent_shared_backend`
- health endpoint: `GET /health`
- chat debug endpoint: `POST /api/chat`
- primary AG-UI endpoint: `POST /api/ag-ui`
- default local URL: `http://localhost:8200/api/ag-ui`

현재 backend는 Pydantic AI 공식 최신 권장 경로인 `pydantic_ai.ui.ag_ui.AGUIAdapter.dispatch_request()`를 사용한다. `Agent.to_ag_ui()`는 Pydantic AI 1.x에서 deprecated로 문서화되어 있으므로 새 코드나 문서 기준으로 사용하지 않는다.

## CopilotKit Runtime Contract

Next.js route는 `src/app/api/copilotkit/route.ts`에 둔다.

구현 기준:

- `CopilotRuntime`에 agent id `travel_planner`를 등록한다.
- agent client는 `HttpAgent` from `@ag-ui/client`를 사용한다.
- backend URL은 server env `AGENT_AG_UI_URL`로 받고, local default는 `http://localhost:8200/api/ag-ui`로 둔다.
- A2UI를 쓸 경우 runtime config에 `a2ui: {}`를 반드시 포함한다.
- A2UI renderer를 직접 `renderActivityMessages`로 수동 주입하지 않는다.

주의: CopilotKit `1.59.5` 기준 `@copilotkit/react-core/v2`, `@copilotkit/runtime/v2`, `@copilotkit/a2ui-renderer` entrypoint가 존재한다. 구현 시 실제 import는 설치된 package type declaration으로 확인한다.

## Client Provider Contract

Root layout 또는 app shell에서 CopilotKit provider를 한 번만 감싼다.

필수 설정:

- `runtimeUrl="/api/copilotkit"`
- default agent 또는 sidebar `agentId`는 `travel_planner`
- A2UI 사용 시 provider의 `a2ui` option을 켠다.
- CopilotKit v2 style CSS를 root에서 한 번 import한다.

CopilotSidebar는 demo의 주 인터랙션 표면이다. custom chat UI를 먼저 만들지 않는다.

## Shared State Contract

원천 상태는 backend `TravelPlannerState`와 맞춘다.

주요 field:

- `stage`: `requirements | draft | comparison | review | final`
- `workflowStage`: backend compatibility field. `stage`와 같은 값으로 유지한다.
- `destination`
- `startDate`
- `nights`
- `budgetKrw`
- `selectedHotelId`
- `approvalStatus`
- `lastUserAction`
- `pendingAction`
- `requirementCards`
- `draftPlan`
- `hotelOptions`
- `policyChecks`
- `finalPlan`

프론트 구현에서는 위 schema를 `BusinessTripWorkspaceState` 타입으로 정의한다. backend field alias와 맞추기 위해 camelCase를 유지한다. backend class 이름이 `TravelPlannerState`여도 frontend domain naming은 `BusinessTrip`을 기준으로 한다.

## AG-UI State And Tool Schema Strategy

이 프로젝트의 기준은 한 개의 frontend tool이 전체 workspace payload를 모두 받는 구조가 아니다.

`update_travel_workspace`처럼 모든 field를 optional로 받는 단일 tool은 기존 backend prompt와 맞추기 위한 compatibility shim으로만 허용한다. 장기 구현 계약으로 삼지 않는다. schema가 커질수록 agent가 불필요한 field를 보게 되고, component별 책임과 validation 경계가 흐려지기 때문이다.

상태 동기화 기준:

- `STATE_SNAPSHOT`: 초기 run, 재연결, 큰 기준 상태 교체에 사용한다. frontend는 기존 state를 snapshot으로 대체한다.
- `STATE_DELTA`: 기본 state update 경로로 사용한다. JSON Patch RFC 6902 기반 partial update로 stage, 선택값, card 추가, policy 결과 변경처럼 작은 변경을 전달한다.
- frontend state update는 AG-UI client가 적용한 shared state를 기준으로 렌더링한다.
- patch 적용 실패나 state 불일치가 감지되면 snapshot 재동기화를 요청한다.

tool schema는 stage/component 단위로 나눈다.

| Concern | Preferred contract | State fields |
| --- | --- | --- |
| route stage 변경 | `set_business_trip_stage` 또는 `STATE_DELTA` | `stage`, `workflowStage` |
| requirement card 갱신 | `update_requirement_cards` 또는 `STATE_DELTA` | `destination`, `startDate`, `nights`, `budgetKrw`, `requirementCards` |
| calendar 일정 초안 | `update_draft_plan` 또는 `STATE_DELTA` | `draftPlan` |
| 숙소/이동 비교 | `update_hotel_options` 또는 `STATE_DELTA` | `hotelOptions`, `budgetKrw`, `selectedHotelId` |
| 정책 검토 | `update_policy_checks` 또는 `STATE_DELTA` | `policyChecks`, `approvalStatus`, `pendingAction` |
| 최종안 | `set_final_plan` 또는 `STATE_DELTA` | `finalPlan`, `approvalStatus` |
| 숙소 선택 UI action | `select_hotel_option` | `selectedHotelId`, `lastUserAction`, `pendingAction` |
| 일정 event 편집 UI action | `edit_draft_event` workspace action | `draftPlan.itinerary[].startTime`, `draftPlan.itinerary[].endTime`, `lastUserAction`, `pendingAction` |
| 승인 UI action | `approve_business_trip_plan` | `approvalStatus`, `lastUserAction`, `pendingAction` |
| 반려 UI action | `reject_business_trip_plan` | `approvalStatus`, `lastUserAction`, `pendingAction` |
| 요구사항 수정 UI action | `edit_requirement` | edited field, `lastUserAction`, `pendingAction` |

`draftPlan`은 단순 day card list가 아니라 calendar projection을 위한 contract로 유지한다.

```ts
type DraftPlan = {
  title: string;
  summary: string;
  timezone: string; // 예: "GMT+09"
  calendarStartHour: number; // 예: 7
  calendarEndHour: number; // 예: 22
  itinerary: Array<{
    day: string; // 예: "Day 1"
    date?: string; // YYYY-MM-DD
    weekday?: string; // 예: "화"
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    title: string;
    detail: string;
    location?: string;
    category: "travel" | "meeting" | "work" | "meal" | "lodging" | "buffer";
    notes?: string[];
  }>;
};
```

agent는 하루 전체 일정을 하나의 긴 `detail` 문자열로 만들지 않는다. 도착, 이동, 미팅, 점심, 검토, 체크인, 귀가처럼 calendar block이 되는 event 단위로 쪼개 `update_draft_plan`에 전달한다.

calendar event의 canonical state는 `DraftCalendar` 내부 state가 아니라 AG-UI shared state의 `draftPlan.itinerary`다. `DraftCalendar`는 drag/resize 중 preview만 local state로 유지하고, pointer up에서 `edit_draft_event` workspace action을 보내 shared state의 `startTime`/`endTime`을 갱신한다. agent는 다음 run에서 이 shared state를 받아 현재 일정으로 해석한다.

schema 작성 규칙:

- 각 tool은 자기 component나 stage가 필요한 field만 받는다.
- 전체 `BusinessTripWorkspaceState`를 통째로 받는 optional field 모음 schema를 만들지 않는다.
- route 전환은 별도 `navigate_*` tool보다 `stage` state update의 결과로 처리한다.
- UI component action은 browser state만 바꾸고 끝내지 않는다. 같은 payload가 agent follow-up run에도 전달되어 CopilotSidebar 응답에 영향을 주어야 한다.
- A2UI component 안의 action도 같은 원칙을 따른다. action bridge를 직접 다룰 때는 `a2uiAction` cleanup을 `finally`에서 보장한다.
- `render_a2ui`는 CopilotKit A2UI 경로에서 주입되는 rendering channel이다. 프론트에서 같은 이름의 custom tool을 직접 등록하지 않는다.

## AG-UI / A2UI Selection Matrix

하나의 tool 또는 하나의 protocol로 모든 것을 처리하지 않는다. 화면의 성격에 따라 AG-UI와 A2UI를 선택한다.

| Surface | Primary choice | Reason |
| --- | --- | --- |
| persistent workspace route | AG-UI shared state + Next.js route | stage가 장기 상태이고 URL과 동기화되어야 함 |
| workspace stage component | shadcn/ui + AG-UI shared state | 사용자가 반복적으로 확인하고 조작하는 업무 화면 |
| chat 안의 rich artifact | A2UI | agent가 대화 맥락에서 component surface를 선언적으로 렌더링 |
| LLM이 layout을 고르는 비교/요약 surface | A2UI dynamic surface | component tree와 data model을 agent가 구성 |
| 형태가 안정적인 flight/hotel/result card | A2UI fixed schema 또는 shadcn workspace component | schema가 고정이면 fixed, persistent state가 필요하면 workspace |
| workspace button/select action | AG-UI state update + component-specific action tool | 선택/승인/수정이 shared state와 후속 chat에 반영되어야 함 |
| A2UI-rendered button action | A2UI action bridge + AG-UI state update | A2UI surface 안의 action도 agent가 이해하는 user response가 되어야 함 |
| backend tool progress | AG-UI tool/activity events | 진행 상태는 protocol event로 표현하고, 필요한 경우 custom renderer만 붙임 |

## Route Contract

stage route는 아래로 고정한다.

| Stage | Route | Primary UI |
| --- | --- | --- |
| `requirements` | `/business-trip/requirements` | 요청 조건, consideration points |
| `draft` | `/business-trip/draft` | calendar형 일정 초안, event-level itinerary |
| `comparison` | `/business-trip/comparison` | 호텔/이동 옵션 비교, 예산 요약 |
| `review` | `/business-trip/review` | 정책 검토, 승인 대기 상태 |
| `final` | `/business-trip/final` | 확정안, 승인 note |

`/`는 `/business-trip/requirements`로 보내거나 같은 workspace shell을 보여준다. 구현 시 하나만 선택하고 route mapping을 `src/business-trip/routes.ts`에 모은다.

## A2UI Contract

초기 구현은 CopilotKit A2UI 기본 catalog와 shadcn workspace component 조합을 우선 사용한다.

custom catalog가 필요해질 때만 `@copilotkit/a2ui-renderer`의 `createCatalog`와 `extractSchema`를 사용한다. 이 경우 component definition, Zod schema, renderer를 한 파일에 모두 몰지 않고 `src/ui/components` 또는 `src/business-trip` 안에서 책임별로 분리한다. 별도 `features/*` 계층은 만들지 않는다.

A2UI는 chat 안에서 requirement card, itinerary comparison, approval step 같은 보조 artifact를 보여주는 역할이다. workspace의 persistent 화면 상태는 shared state가 책임진다.

A2UI 사용 방식은 두 가지로 나눈다.

- fixed schema: component tree가 안정적이고 agent가 data만 채우는 경우. 예: 승인 요약 카드, 정책 체크 결과.
- dynamic schema: agent가 어떤 layout과 component 조합이 적절한지 선택해야 하는 경우. 예: 숙소 비교 dashboard, 출장 리스크 요약 surface.

A2UI operation 기준:

- `createSurface`는 surface id마다 한 번만 emit한다.
- 이후 변경은 `updateComponents`와 `updateDataModel`로 처리한다.
- `updateDataModel`은 전체 `/` 교체보다 필요한 path update를 우선 고려한다.
- root component id가 없는 dynamic component payload는 renderer error가 나므로 backend helper에서 검증한다.
- A2UI surface data가 workspace shared state와 다른 사실을 말하면 안 된다.

## Local CopilotKit Reference Workflow

구현 전에 cloned CopilotKit repo의 예시를 먼저 확인한다. 현재 기준 repo 위치는 `../../../../week7/reference/copilotkit`이다.

특히 아래 파일을 우선 reference로 사용한다.

| Topic | Local reference |
| --- | --- |
| CopilotKit provider + A2UI catalog registration | `../../../../week7/reference/copilotkit/examples/integrations/langgraph-js/src/app/layout.tsx` |
| A2UI catalog renderer pattern | `../../../../week7/reference/copilotkit/examples/integrations/langgraph-js/src/app/declarative-generative-ui/renderers.tsx` |
| frontend shared state read/write | `../../../../week7/reference/copilotkit/examples/integrations/langgraph-js/src/components/example-canvas/index.tsx` |
| generative UI hooks and ignored `render_a2ui` tool rendering | `../../../../week7/reference/copilotkit/showcase/integrations/pydantic-ai/src/app/demos/beautiful-chat/hooks/use-generative-ui-examples.tsx` |
| dynamic A2UI operation builder | `../../../../week7/reference/copilotkit/showcase/shared/python/tools/generate_a2ui.py` |

주의: cloned repo 예시의 일부 Pydantic AI import는 repo 시점의 API일 수 있다. Pydantic AI runtime 연결은 공식 최신 문서와 설치된 type declaration을 우선하고, local repo에서는 architecture와 pattern을 가져온다.

## References

- Pydantic AI AG-UI: https://pydantic.dev/docs/ai/integrations/ui/ag-ui/
- AG-UI state management: https://docs.ag-ui.com/concepts/state
- AG-UI local state reference: `../../../reference/agui/concepts/state.md`
- AG-UI local events reference: `../../../reference/agui/concepts/events.md`
- CopilotKit Pydantic AI docs: https://docs.copilotkit.ai/pydantic-ai/
- AG-UI Dojo shared state example: https://dojo.ag-ui.com/pydantic-ai/feature/shared_state
- Local backend: `../agent_shared_backend/README.md`
- Local CopilotKit reference: `../../../../week7/reference/copilotkit`
- Local AG-UI reference: `../../../reference/agui`
- Local A2UI reference: `../../../reference/a2ui`

## Verification Checklist

구현 후 최소 확인 항목:

- backend `GET http://localhost:8200/health` 성공
- Next.js `bun dev` 성공
- `/api/copilotkit`가 runtime info와 POST 요청을 처리
- sidebar에서 메시지 전송 시 `/api/ag-ui`로 SSE 요청 전달
- route는 `/business-trip/{stage}` 기준으로 동작하고 frontend naming에 legacy travel naming이 다시 들어가지 않음
- `requirements -> draft -> comparison -> review -> final` stage 전환 시 route가 동기화
- `requirementCards`, `hotelOptions`, `policyChecks`가 hardcoded sample이 아니라 shared state에서 렌더링
- workspace update가 한 개의 거대한 optional schema tool에 몰리지 않고 stage/component 단위 schema로 분리됨
- 작은 state 변경은 `STATE_DELTA` partial update로 처리되고, 초기화/재동기화만 `STATE_SNAPSHOT`을 사용
- shadcn component를 먼저 검토했고 custom component는 필요한 이유가 명확함
- Toss brand color는 semantic token을 통해서만 사용하고 임의 파생색을 만들지 않음
- workspace component action이 state와 CopilotSidebar 후속 응답 양쪽에 반영됨
- A2UI artifact가 필요한 경우 chat 안에만 렌더링되고 workspace state와 충돌하지 않음
- `bun run lint`, `bun run build` 통과
