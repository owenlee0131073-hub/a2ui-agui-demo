"""Structured console logs for the AG-UI / A2UI demo flow."""

from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any

from ag_ui.core import RunAgentInput
from pydantic import ValidationError
from pydantic_ai.agent import AgentRunResult
from starlette.datastructures import Headers
from starlette.responses import Response

logger = logging.getLogger("a2ui_agui.flow")


def _json_default(value: Any) -> str:
    return repr(value)


def _pretty(value: dict[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, default=_json_default)


def _preview(value: Any, *, max_chars: int = 220) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        return value if len(value) <= max_chars else f"{value[:max_chars]}..."
    try:
        encoded = json.dumps(value, ensure_ascii=False, default=_json_default)
    except TypeError:
        encoded = repr(value)
    return encoded if len(encoded) <= max_chars else f"{encoded[:max_chars]}..."


def _message_preview(message: Any) -> str | None:
    content = getattr(message, "content", None)
    if isinstance(content, str):
        return _preview(content)
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            text = getattr(item, "text", None)
            if isinstance(text, str):
                parts.append(text)
        return _preview(" ".join(parts))
    return None


def _summarize_run_input(run_input: RunAgentInput) -> dict[str, Any]:
    role_counts = Counter(getattr(message, "role", "unknown") for message in run_input.messages)
    last_user_message = next(
        (
            message
            for message in reversed(run_input.messages)
            if getattr(message, "role", None) == "user"
        ),
        None,
    )
    state = run_input.state if isinstance(run_input.state, dict) else {}

    return {
        "threadId": run_input.thread_id,
        "runId": run_input.run_id,
        "messages": {
            "count": len(run_input.messages),
            "roles": dict(role_counts),
            "lastUserPreview": _message_preview(last_user_message),
        },
        "state": {
            "keys": sorted(state.keys()),
            "preview": _preview(state),
        },
        "tools": [tool.name for tool in run_input.tools],
        "context": [
            {
                "description": item.description,
                "valuePreview": _preview(item.value),
            }
            for item in run_input.context
        ],
        "forwardedPropsPreview": _preview(run_input.forwarded_props),
        "resumeCount": len(run_input.resume or []),
    }


def log_chat_request(message: str, client: str) -> None:
    logger.info(
        "backend.chat.request\n%s",
        _pretty(
            {
                "endpoint": "POST /api/chat",
                "client": client,
                "messagePreview": _preview(message),
                "note": "Debug-only path. It does not receive AG-UI messages, state, or frontend tools.",
            }
        ),
    )


def log_chat_response(output: str) -> None:
    logger.info(
        "backend.chat.response\n%s",
        _pretty({"endpoint": "POST /api/chat", "outputPreview": _preview(output)}),
    )


def log_ag_ui_request(body: bytes, headers: Headers) -> None:
    try:
        run_input = RunAgentInput.model_validate_json(body)
    except ValidationError as exc:
        logger.warning(
            "backend.ag_ui.request.invalid\n%s",
            _pretty(
                {
                    "endpoint": "POST /api/ag-ui",
                    "contentType": headers.get("content-type"),
                    "bodyBytes": len(body),
                    "error": exc.errors(include_url=False),
                }
            ),
        )
        return

    logger.info(
        "backend.ag_ui.request\n%s",
        _pretty(
            {
                "endpoint": "POST /api/ag-ui",
                "contentType": headers.get("content-type"),
                **_summarize_run_input(run_input),
            }
        ),
    )


def log_ag_ui_stream_opened(response: Response) -> None:
    logger.info(
        "backend.ag_ui.response.opened\n%s",
        _pretty(
            {
                "endpoint": "POST /api/ag-ui",
                "statusCode": response.status_code,
                "contentType": response.headers.get("content-type"),
                "note": "SSE stream is open; final model output is logged by on_complete.",
            }
        ),
    )


def log_ag_ui_completion(result: AgentRunResult[Any]) -> None:
    logger.info(
        "backend.ag_ui.response.completed\n%s",
        _pretty(
            {
                "endpoint": "POST /api/ag-ui",
                "outputPreview": _preview(getattr(result, "output", None)),
                "messageCount": len(result.all_messages()),
                "usage": _preview(result.usage()),
            }
        ),
    )
