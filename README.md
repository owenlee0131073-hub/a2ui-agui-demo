# A2UI AG-UI 데모

Week 8 실습에서 만든 A2UI / AG-UI 데모 프로젝트입니다.

이 프로젝트는 다음 두 부분으로 구성됩니다.

- `agent_shared_backend/`: FastAPI + Pydantic AI 기반 agent backend
- `copilotkit_agui/`: Next.js + CopilotKit 기반 frontend

전체 실행 흐름은 아래와 같습니다.

```text
Browser
-> Next.js /api/copilotkit
-> CopilotRuntime HttpAgent
-> FastAPI /api/ag-ui
-> Pydantic AI travel_planner agent
```

원래 스터디 랩 폴더에 있던 `node_modules`, `.next`, `.venv`, reference clone, build output은 public repo에 포함하지 않았습니다.

## 환경 변수 설정

비밀값이 들어가는 실제 `.env` 파일은 git에 커밋하지 않습니다.
반드시 각 디렉토리의 `.env.example`을 복사해서 로컬 `.env`를 만든 뒤 값을 채워야 합니다.

### Backend `.env`

```bash
cd agent_shared_backend
cp .env.example .env
```

`agent_shared_backend/.env`에 들어가는 값:

```env
SERVICE_NAME=a2ui-agui-agent-shared-backend
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8301
PYDANTIC_AI_MODEL=openrouter:openai/gpt-oss-120b
OPENROUTER_API_KEY=
```

채워야 하는 값:

- `OPENROUTER_API_KEY`: 필수. 실제 agent가 LLM을 호출하려면 OpenRouter API key를 넣어야 합니다.
- `PYDANTIC_AI_MODEL`: 기본값은 `openrouter:openai/gpt-oss-120b`입니다. 다른 OpenRouter 모델을 쓰려면 여기만 바꾸면 됩니다.
- `CORS_ORIGINS`: frontend 포트를 바꾸는 경우 해당 origin을 추가합니다. 기본 `make run`은 `http://localhost:3000`을 사용합니다.
- `SERVICE_NAME`, `LOG_LEVEL`: 기본값 그대로 둬도 됩니다.

`OPENROUTER_API_KEY`가 비어 있어도 backend 서버와 `/health`는 뜹니다. 다만 실제 agent 실행은 실패합니다.

### Frontend `.env`

```bash
cd copilotkit_agui
cp .env.example .env
```

`copilotkit_agui/.env`에 들어가는 값:

```env
AGENT_AG_UI_URL=http://localhost:8200/api/ag-ui
```

채워야 하는 값:

- `AGENT_AG_UI_URL`: Next.js server route가 호출할 backend AG-UI endpoint입니다.
- 같은 머신에서 기본 포트로 실행한다면 `http://localhost:8200/api/ag-ui` 그대로 쓰면 됩니다.
- Docker, 배포 환경, 다른 포트 사용 시 backend에 접근 가능한 URL로 바꿔야 합니다.

참고로 `make run`은 기본값으로 `AGENT_AG_UI_URL=http://127.0.0.1:8200/api/ag-ui`를 frontend dev server에 주입합니다. 직접 `bun run dev`로 실행할 때는 위 `.env` 파일이 필요합니다.

## 빠른 실행

repo root에서 한 번에 설치합니다.

```bash
make install
```

그 다음 backend와 frontend를 같이 실행합니다.

```bash
make run
```

기본 실행 주소:

- backend: `http://127.0.0.1:8200`
- frontend: `http://localhost:3000`
- backend AG-UI endpoint: `http://127.0.0.1:8200/api/ag-ui`
- frontend CopilotKit endpoint: `http://localhost:3000/api/copilotkit`

## 수동 실행

Backend:

```bash
cd agent_shared_backend
uv sync
cp .env.example .env
uv run uvicorn src.app:app --host 0.0.0.0 --port 8200
```

Frontend:

```bash
cd copilotkit_agui
bun install
cp .env.example .env
bun run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 네트워크 확인

라우팅과 로컬 네트워크 연결만 확인하려면:

```bash
make check-network
```

이 명령은 두 서버를 임시로 띄운 뒤 다음을 확인합니다.

- backend `GET /health`
- backend `POST /api/ag-ui` CORS preflight
- frontend server-side에서 `AGENT_AG_UI_URL` 기준 backend `/health` fetch 가능 여부
- CopilotKit v2 single-route `POST /api/copilotkit` runtime info envelope

주의할 점:

- 이 프로젝트의 CopilotKit runtime은 `single-route` mode입니다.
- 그래서 단순 `GET /api/copilotkit` 확인이 아니라, `POST /api/copilotkit`에 `{ "method": "info", "params": {}, "body": {} }` envelope를 보내야 runtime info를 확인할 수 있습니다.

## 주요 디렉토리

- `agent_shared_backend/src/`: FastAPI app, Pydantic AI agent, mock business tools
- `copilotkit_agui/src/`: Next.js app, CopilotKit provider, business trip UI
- `flow.md`: 전체 runtime 흐름 설명
- `docs/`: 프로젝트 설명 문서와 다이어그램 asset
- `eraser_diagrams/`: runtime / UI flow 다이어그램 원본
