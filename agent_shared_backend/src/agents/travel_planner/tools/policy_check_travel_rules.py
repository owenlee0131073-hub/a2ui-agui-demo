"""Mock travel policy business logic."""

from __future__ import annotations

from .schemas import DemoToolResult


def check_travel_rules(destination: str, estimated_total_krw: int, needs_approval: bool) -> DemoToolResult:
    destination_name = destination.strip() or "서울"
    rules = [
        {"rule": "숙박비는 1박 기준 20만 원 이하", "passed": True},
        {"rule": "총 출장비 100만 원 이하는 팀 리드 승인", "passed": estimated_total_krw <= 1_000_000},
        {"rule": "사전 승인 필요 여부 확인", "passed": not needs_approval},
    ]
    passed = all(item["passed"] for item in rules)

    return DemoToolResult(
        display_name="policy.check_travel_rules",
        ui_component="PolicyCheckList",
        status="approved" if passed else "warning",
        title=f"{destination_name} 출장 정책 {'통과' if passed else '확인 필요'}",
        summary=(
            "mock travel policy 기준으로 바로 진행 가능합니다."
            if passed
            else "일부 정책 항목에 추가 확인 또는 승인이 필요합니다."
        ),
        details={
            "destination": destination_name,
            "estimated_total_krw": estimated_total_krw,
            "needs_approval": needs_approval,
            "rules": rules,
        },
    )
