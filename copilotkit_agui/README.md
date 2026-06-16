# CopilotKit AG-UI / A2UI Frontend

이 디렉토리는 Bun 기반 Next.js 앱으로 출장 계획 agent demo를 구현하기 위한 프론트엔드 작업 공간이다.

frontend route, folder, component 이름은 `business-trip` / `BusinessTrip`을 기준으로 한다. `travel_planner`, `TravelPlannerState`, `update_travel_workspace` 같은 `travel` 이름은 기존 backend 계약과 맞추기 위한 compatibility 이름으로만 남긴다.

## Planning Documents

- [`instruction.md`](./instruction.md): 이 디렉토리에서 코드를 작성할 때 지켜야 하는 구조, 네이밍, 주석, UI 문구, 책임 분리 규칙.
- [`tech.md`](./tech.md): Next.js, Bun, CopilotKit, AG-UI, A2UI, Pydantic AI backend 연결 방식과 버전 관리 기준.
- [`scenario.md`](./scenario.md): 출장 요청 demo의 사용자 흐름, 라우팅 흐름, 화면 갱신 방식, 앱 톤.

## Backend Boundary

이 프론트엔드는 새 agent runtime을 만들지 않는다. Pydantic AI runtime은 기존 `../agent_shared_backend`를 사용한다.

프론트엔드 구현 시 기본 연결은 아래 흐름을 따른다.

```text
CopilotSidebar
-> Next.js /api/copilotkit
-> CopilotRuntime + HttpAgent
-> ../agent_shared_backend /api/ag-ui
-> Pydantic AI AGUIAdapter
```
