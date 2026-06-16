# CopilotKit AG-UI Frontend Instruction

## 작업 원칙

이 디렉토리의 프론트엔드는 A2UI / AG-UI를 보여주기 위한 출장 계획 앱이다. 구현할 때 앱 화면 안에 "이 앱은 A2UI를 사용해서..." 같은 설명문을 넣지 않는다. 설명은 문서와 발표에서만 하고, 앱은 실제 출장 업무 도구처럼 동작해야 한다.

기본 scaffold 이후에도 이 문서의 구조와 네이밍을 기준으로 구현을 확장한다. 새 기능을 추가할 때는 먼저 기존 책임 경계를 확인하고, route entry, shared state, frontend tool, page component, 반복 component를 한 파일에 섞지 않는다.

## 구조 원칙

- 쓸데없는 중첩 디렉토리를 만들지 않는다.
- Next.js routing entry 파일은 `src/app` 안에만 둔다.
- `src/app`은 routing adapter 역할만 한다. 화면 구현을 `src/app` 안에 길게 작성하지 않는다.
- 실제 page-level React component는 `src/ui/pages`에 둔다.
- 재사용 가능한 화면 조각은 `src/ui/components`에 둔다.
- 출장 도메인 상태, route mapping, action/tool schema는 `src/business-trip`에 둔다.
- CopilotKit runtime/client 연결 보조 코드는 필요할 때만 `src/copilotkit`에 둔다.
- 하나의 파일에 route handler, 상태 타입, tool schema, 화면 component를 모두 넣지 않는다.
- 포함 관계가 명확해야 한다. route entry는 page component를 import하고, page component는 필요한 domain component를 조립한다.

처음 만들 수 있는 구조는 아래 정도로 제한한다. 여기서 `api/copilotkit/route.ts`와 `business-trip/[stage]/page.tsx`의 중첩은 Next.js file-system routing 때문에 필요한 중첩이다.

주의: `src/pages`는 만들지 않는다. Next.js가 Pages Router로 인식할 수 있어 App Router 구조와 섞인다. React식 page/component 레이어는 `src/ui/pages`로 둔다.

```text
src/
  app/
    api/copilotkit/route.ts
    layout.tsx
    page.tsx
    business-trip/
      [stage]/page.tsx
  ui/
    pages/
      business-trip/
        requirements-page.tsx
        requirements-page.module.css
        draft-page.tsx
        draft-page.module.css
        comparison-page.tsx
        comparison-page.module.css
        review-page.tsx
        review-page.module.css
        final-page.tsx
        final-page.module.css
    components/
      app-shell/
        app-shell.tsx
        app-shell.module.css
      copilot-business-trip-provider/
        copilot-business-trip-provider.tsx
      copilot-business-trip-sidebar/
        copilot-business-trip-sidebar.tsx
      business-trip-workspace/
        business-trip-workspace.tsx
        business-trip-workspace.module.css
      requirement-card/
        requirement-card.tsx
        requirement-card.module.css
      hotel-option-card/
        hotel-option-card.tsx
        hotel-option-card.module.css
    primitives/
      button.tsx
      card.tsx
      ...
    utils.ts
  business-trip/
    routes.ts
    state.ts
    tools.tsx
    actions.ts
```

`src/copilotkit/runtime-config.ts`는 `/api/copilotkit` route나 client provider에서 같은 설정을 반복하게 될 때만 만든다.

component별 CSS는 같은 폴더의 `*.module.css`로 둔다. 전역 CSS는 Tailwind import, shadcn token, Toss color token처럼 앱 전체에 필요한 것만 담는다. CopilotKit package style은 root layout/provider entry에서 한 번 import한다.

`src/ui/primitives`는 shadcn CLI가 생성한 낮은 수준의 primitive만 둔다. 출장 도메인 문구, agent state 접근, tool handler, route 전환 로직을 primitive에 넣지 않는다.

구현 중 파일이 커지면 먼저 책임을 확인한 뒤 파일 또는 component 폴더로 분리한다. 단순히 "정리되어 보이기 위해" `components/business-trip/cards/items/parts` 같은 깊은 구조를 만들지 않는다.

## 네이밍 규칙

- 이름은 도메인 의미를 드러낸다.
- `data`, `item`, `card`, `handler`, `utils`처럼 맥락 없는 이름을 단독으로 쓰지 않는다.
- stage 이름은 backend state와 맞춘다: `requirements`, `draft`, `comparison`, `review`, `final`.
- frontend route, folder, component 이름에는 `travel` 대신 `business-trip` 또는 `BusinessTrip`을 쓴다.
- backend agent id는 기존 runtime 계약 때문에 `travel_planner`로 고정한다.
- workspace 상태 갱신 tool은 stage/component 책임별로 나눈다. `update_travel_workspace`는 기존 backend prompt와 맞추기 위한 compatibility shim이 필요할 때만 둔다.
- A2UI chat rendering은 CopilotKit가 주입하는 `render_a2ui` 경로를 사용한다. 별도 `renderBusinessTripCard` 같은 임의 tool을 만들지 않는다.

## 주석 규칙

- 복잡한 agent / runtime / state 경계에는 한국어 주석을 충분히 단다.
- 주석은 "무엇을 하는지"가 아니라 "왜 이 경계가 필요한지"를 설명한다.
- 단순 JSX, 단순 prop 전달, 뻔한 변수 할당에는 주석을 달지 않는다.
- 특히 아래 코드는 한국어 주석을 남긴다.
  - Next.js `/api/copilotkit` runtime route
  - `HttpAgent`가 `../agent_shared_backend`의 `/api/ag-ui`로 연결되는 부분
  - stage/component별 frontend tool schema가 나뉘는 이유
  - shared state의 `stage`가 route로 변환되는 부분
  - A2UI renderer를 provider에서 켜는 부분

## UI 문구 규칙

- 앱 화면에는 demo 설명문을 하드코딩하지 않는다.
- "A2UI를 사용해 카드를 렌더링합니다", "에이전트가 화면을 업데이트합니다" 같은 메타 설명은 금지한다.
- 빈 상태 문구도 실제 제품 문구처럼 쓴다. 예: "출장 요청을 입력하세요", "검토할 항목이 없습니다".
- component에 들어가는 데이터는 backend tool result 또는 AG-UI shared state에서 온다.
- 샘플 출장지, 호텔명, 금액, 정책 결과를 frontend에 하드코딩하지 않는다.

## 상태와 렌더링 책임

- shared state가 화면의 원천 데이터다.
- component는 shared state의 projection이다.
- route는 shared state의 `stage`와 동기화한다.
- backend Pydantic AI tool은 도메인 데이터를 만든다.
- frontend tool은 component별 사용자 action과 작은 state update를 agent가 이해할 수 있는 단위로 전달한다.
- A2UI `render_a2ui`는 chat 안의 보조 artifact를 렌더링한다.
- workspace 본문 화면을 바꿔야 할 때 A2UI만 호출하고 끝내지 않는다. 반드시 shared state도 갱신한다.

## 구현 전 체크

구현을 시작하기 전에 아래를 확인한다.

- `tech.md`의 package version 기준이 현재 registry와 맞는가.
- `../agent_shared_backend`의 `/health`와 `/api/ag-ui` endpoint가 유지되는가.
- backend prompt가 기대하는 frontend tool schema와 state field가 `tech.md`의 stage/component 분리 기준과 일치하는가.
- routing stage와 backend `TravelPlannerState.workflowStage` 값이 일치하는가.
