"""Mock calendar availability business logic."""

from __future__ import annotations

from .schemas import DemoToolResult


def check_availability(destination: str, start_date: str | None, nights: int) -> DemoToolResult:
    destination_name = destination.strip() or "서울"
    normalized_nights = max(1, min(nights, 5))
    start_label = start_date.strip() if start_date else "다음 주 화요일"

    return DemoToolResult(
        display_name="calendar.check_availability",
        ui_component="ScheduleTimeline",
        status="available",
        title=f"{destination_name} 출장 일정 가능",
        summary=f"{start_label}부터 {normalized_nights}박 일정으로 mock calendar slot을 확보했습니다.",
        details={
            "destination": destination_name,
            "start_date": start_label,
            "nights": normalized_nights,
            "slots": [
                {"day": 1, "label": "이동 및 도착", "available": True},
                {"day": 1, "label": "오후 고객 미팅", "available": True},
                {"day": normalized_nights + 1, "label": "후속 미팅 및 복귀", "available": True},
            ],
        },
    )
