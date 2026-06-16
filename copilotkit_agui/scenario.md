# Demo Scenario

## Demo Tone

이 앱은 출장 준비를 위한 실제 업무 도구처럼 보여야 한다. A2UI / AG-UI를 설명하는 페이지가 아니라, agent가 사용자의 출장 요청을 받아 화면과 상태를 함께 움직이는 제품 화면이어야 한다.

앱 내부에 아래와 같은 문장은 넣지 않는다.

- "이 데모는 A2UI를 사용해서 화면을 렌더링합니다."
- "CopilotKit과 Pydantic AI를 연결한 예제입니다."
- "사용자가 요청하면 컴포넌트가 업데이트됩니다."

이런 설명은 발표자 말과 문서에서만 다룬다.

## Core Demo Promise

사용자는 오른쪽 CopilotSidebar에서 출장 요청을 말한다. agent는 같은 대화 안에서 아래 두 가지 렌더링을 수행한다.

1. 시나리오 stage에 맞춰 workspace route를 이동한다.
2. shared state를 갱신해 workspace component를 업데이트한다.

여기서 "화면 렌더링"은 단순히 chat message를 예쁘게 보여주는 것이 아니다. route, shared state, component projection이 함께 변해야 한다.

반대로 사용자가 workspace component 안에서 선택, 승인, 반려 같은 UI action을 수행했을 때도 chat 흐름이 갱신되어야 한다. UI component interaction은 browser state만 바꾸고 끝나는 side effect가 아니라, agent가 이해할 수 있는 사용자 응답으로 전달되어 CopilotSidebar 안에 후속 답변이 생성되어야 한다.

## Primary User Story

사용자는 서울 본사 직원이고, 짧은 국내/해외 출장을 준비한다. 목적지는 사용자가 말한 값으로 결정되며, frontend에 미리 박힌 출장지나 호텔 목록은 없다.

예시 요청:

```text
다음 주 수요일부터 금요일까지 부산 출장을 준비해야 해. 예산은 90만원이고, 부산역 근처 숙소면 좋겠어. 오전 미팅이 있어서 이동 시간을 줄이고 싶어.
```

이 문장은 문서와 테스트 입력 예시일 뿐이다. 앱 화면에 고정 문구로 넣지 않는다.

## Stage Flow

### 1. Requirements

Route: `/business-trip/requirements`

사용자가 목적지, 날짜, 예산, 출장 목적, 선호 조건을 말하면 agent는 requirement 전용 schema 또는 AG-UI `STATE_DELTA`를 통해 requirement cards를 갱신한다.

화면에는 아래 정보가 실제 상태에서 렌더링된다.

- 목적지
- 날짜 또는 출발 표현
- 숙박 일수
- 예산
- 출장 목적
- consideration points

사용자가 "고려해야 할 점을 정리해줘"라고 말하면 consideration point 카드가 추가된다. 이 카드들은 hardcoded list가 아니라 agent가 state에 넣은 `requirementCards` 또는 별도 normalized state에서 렌더링한다.

### 2. Draft

Route: `/business-trip/draft`

조건이 충분해지면 agent는 초안 일정을 만든다.

화면에는 아래가 렌더링된다.

- 일정 제목
- 요약
- 날짜/시간 축 기반 daily calendar
- 이동, 미팅, 식사, 숙소, 업무 block
- 아직 확정되지 않은 항목

이 단계에서는 호텔 비교나 정책 승인 결과를 미리 확정하지 않는다.

### 3. Comparison

Route: `/business-trip/comparison`

사용자가 "숙소 옵션 비교해줘", "예산 안에서 골라줘"라고 요청하면 backend의 숙소/예산/정책 조회 tool이 도메인 데이터를 만든다. frontend는 결과를 `hotelOptions`, `policyChecks`, `budgetKrw` 등의 shared state에서 읽어 비교 화면을 렌더링한다.

화면에는 아래가 필요하다.

- 호텔 옵션 리스트
- 위치와 출장 동선 관점의 장단점
- 총액과 예산 대비 상태
- 정책 상태 badge
- 선택 액션

선택 버튼은 실제 browser state를 갱신해야 한다. 단순히 alert를 띄우거나 chat에만 답하지 않는다.

### 4. Review

Route: `/business-trip/review`

사용자가 옵션을 선택하거나 승인 검토를 요청하면 agent는 정책 검토 상태를 만든다.

화면에는 아래가 렌더링된다.

- 선택된 옵션
- 정책 체크 리스트
- 승인 상태: `pending`, `approved`, `rejected`
- 사용자가 승인 또는 반려할 수 있는 action

승인/반려 action은 `lastUserAction`, `pendingAction`, `approvalStatus`를 갱신한다.

### 5. Final

Route: `/business-trip/final`

사용자가 승인하면 최종 출장안이 렌더링된다.

화면에는 아래가 필요하다.

- 최종 일정 제목
- 최종 요약
- 숙소/예산/정책 결과
- 승인 note
- 다음 업무 action

최종 화면도 "데모 완료" 같은 문구를 쓰지 않는다. 실제 업무 결과처럼 보여야 한다.

## Agent Interaction Rules

- agent는 모르는 값을 지어내지 않는다.
- 부족한 요구사항은 `requirements` stage에 남기고 사용자에게 묻는다.
- backend tool 결과는 도메인 데이터로 취급한다.
- workspace update는 stage/component별 schema 또는 AG-UI partial state update로 처리한다.
- 전체 workspace를 한 번에 받는 거대한 optional schema tool을 기본 계약으로 두지 않는다.
- chat 안에 보조 artifact가 필요할 때만 `render_a2ui`를 사용한다.
- A2UI artifact와 workspace state가 서로 다른 내용을 보여주면 안 된다.

## UI Component Interaction To Chat Loop

사용자가 chat이 아닌 workspace component에서 수행한 action도 conversation의 일부다.

예를 들어 사용자가 `/business-trip/comparison`에서 호텔 옵션을 선택하면 아래 흐름이 일어나야 한다.

1. 선택된 option id가 shared state의 `selectedHotelId`, `lastUserAction`, `pendingAction`에 반영된다.
2. route가 필요한 경우 다음 stage로 이동한다.
3. 같은 action payload가 agent에게 사용자 응답처럼 전달된다.
4. CopilotSidebar에는 agent의 후속 응답이 생성된다.

승인/반려도 같은 원칙을 따른다. `/business-trip/review`에서 승인 버튼을 누르면 `approvalStatus="approved"`로 상태가 바뀌고, agent는 chat에서 최종안 생성 또는 다음 action 안내를 이어가야 한다.

`/business-trip/draft`의 calendar event 편집도 같은 원칙을 따른다. 사용자가 event를 위아래로 이동하거나 하단 handle로 길이를 조정하면, 확정된 `startTime`/`endTime`이 shared state의 `draftPlan.itinerary`에 반영되고 agent는 다음 run에서 이 변경을 현재 일정으로 이해해야 한다. drag 중 preview는 component-local state일 수 있지만, 유지되는 일정 state는 AG-UI shared state가 책임진다.

이 흐름은 "버튼을 누르면 화면만 바뀐다"가 아니라 "버튼을 누르면 화면과 대화가 같은 사실을 공유한다"는 것을 보여주기 위한 핵심 시나리오다.

구현 단계에서는 UI action payload를 아래 형태로 정규화한다.

```text
source: "workspace_component"
action: "select_hotel" | "approve_plan" | "reject_plan" | "edit_requirement" | "edit_draft_event"
stage: current stage
payload: selected option, approval decision, edited field, edited event time, or user note
```

이 payload는 frontend state update와 agent follow-up run 양쪽에 사용한다. 실제 tool schema는 `select_hotel_option`, `approve_business_trip_plan`, `reject_business_trip_plan`, `edit_requirement`처럼 component action 단위로 나눈다. A2UI component 안에서 발생한 action도 같은 원칙을 따른다. action bridge를 쓸 경우 이전 action이 다음 run에 새어 들어가지 않도록 cleanup을 보장한다.

## Component Responsibilities

초기 component 책임은 아래처럼 나눈다.

| Component | Responsibility |
| --- | --- |
| `BusinessTripWorkspace` | 현재 stage를 받아 stage component를 선택 |
| `BusinessTripRequirementsPage` | 요구사항과 consideration point 렌더링 |
| `BusinessTripDraftPage` | 일정 초안 page 조립 |
| `DraftCalendar` | `draftPlan.itinerary`를 날짜/시간 축 기반 calendar로 렌더링하고, event drag/resize 확정 시 shared state action 전달 |
| `BusinessTripComparisonPage` | 옵션 비교와 선택 action 렌더링 |
| `BusinessTripReviewPage` | 정책 검토와 승인/반려 action 렌더링 |
| `BusinessTripFinalPage` | 확정안과 승인 note 렌더링 |
| `CopilotBusinessTripSidebar` | CopilotSidebar 설정만 담당 |
| `RequirementCard` | 요구사항과 consideration point의 단일 카드 표현 |
| `HotelOptionCard` | 숙소 옵션과 선택 action 표현 |

component는 backend tool을 직접 호출하지 않는다. agent와 통신하는 경로는 CopilotKit runtime이다.

## Demo Script

1. 앱을 열면 `requirements` workspace와 CopilotSidebar가 보인다.
2. 사용자가 출장 목적지, 날짜, 예산, 선호 조건을 말한다.
3. agent가 requirement cards를 갱신하고 `/business-trip/requirements` 상태를 채운다.
4. 사용자가 "고려할 점도 정리해줘"라고 말한다.
5. consideration point 카드가 추가된다.
6. 사용자가 "일정 초안 만들어줘"라고 말한다.
7. route가 `/business-trip/draft`로 이동하고 calendar형 itinerary가 렌더링된다.
8. 사용자가 "숙소 옵션 비교해줘"라고 말한다.
9. route가 `/business-trip/comparison`으로 이동하고 호텔 옵션, 예산, 정책 상태가 렌더링된다.
10. 사용자가 comparison 화면의 option component에서 하나를 선택한다.
11. 선택 action이 shared state에 반영되고, CopilotSidebar에는 agent의 후속 응답이 생성된다.
12. route가 `/business-trip/review`로 이동하고 승인 검토 상태가 `pending`이 된다.
13. 사용자가 review 화면의 승인 component를 누른다.
14. 승인 action이 shared state에 반영되고, CopilotSidebar에는 최종 처리 응답이 생성된다.
15. route가 `/business-trip/final`로 이동하고 최종 출장안이 렌더링된다.

## Acceptance Criteria

- sidebar 대화만으로 stage route가 바뀐다.
- 각 business-trip page/component는 shared state를 기준으로 렌더링된다.
- frontend에 가짜 출장지, 가짜 호텔, 가짜 예산 결과가 고정되어 있지 않다.
- 앱 화면에 프로토콜 설명문이나 demo 설명문이 없다.
- user action과 agent action이 같은 state contract를 사용한다.
- state update schema가 한 개의 거대한 workspace update tool에 몰리지 않는다.
- workspace component에서 발생한 선택/승인/반려 action이 chat 후속 응답으로 이어진다.
- UI action으로 변경된 state와 CopilotSidebar의 agent 응답이 같은 사실을 말한다.
- 같은 backend agent를 유지하면서 frontend가 AG-UI/A2UI의 차이를 실제 동작으로 보여준다.
