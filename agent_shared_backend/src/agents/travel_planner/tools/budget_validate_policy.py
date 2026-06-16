"""Mock budget validation business logic."""

from __future__ import annotations

from .schemas import DemoToolResult


def validate_policy(budget_krw: int, estimated_total_krw: int) -> DemoToolResult:
    normalized_budget = max(budget_krw, 1)
    normalized_total = max(estimated_total_krw, 0)
    remaining = normalized_budget - normalized_total
    status = "approved" if remaining >= 0 else "warning"

    return DemoToolResult(
        display_name="budget.validate_policy",
        ui_component="BudgetMetric",
        status=status,
        title="예산 검증 완료" if remaining >= 0 else "예산 초과",
        summary=(
            f"총 예상 비용 {normalized_total:,}원은 예산 {normalized_budget:,}원 안에 있습니다."
            if remaining >= 0
            else f"총 예상 비용 {normalized_total:,}원이 예산을 {abs(remaining):,}원 초과합니다."
        ),
        details={
            "budget_krw": normalized_budget,
            "estimated_total_krw": normalized_total,
            "remaining_krw": remaining,
            "within_budget": remaining >= 0,
        },
    )
