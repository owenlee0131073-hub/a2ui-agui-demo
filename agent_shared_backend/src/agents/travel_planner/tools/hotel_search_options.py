"""Mock hotel search business logic."""

from __future__ import annotations

from .schemas import DemoToolResult


CITY_HOTEL_HINTS = {
    "서울": ("강남", "역삼", "시청"),
    "부산": ("해운대", "서면", "부산역"),
    "제주": ("제주시", "서귀포", "공항"),
}


def search_options(destination: str, budget_krw: int, nights: int) -> DemoToolResult:
    destination_name = destination.strip() or "서울"
    normalized_budget = max(budget_krw, 100_000)
    normalized_nights = max(1, min(nights, 5))
    per_night_cap = max(90_000, int(normalized_budget * 0.45 / normalized_nights))
    areas = CITY_HOTEL_HINTS.get(destination_name, (f"{destination_name} 중심가", "역세권", "업무지구"))

    options = [
        {
            "name": f"{area} 비즈니스 호텔",
            "area": area,
            "price_per_night_krw": per_night_cap + index * 18_000,
            "distance": "미팅 장소 20분 이내",
            "policy_ok": index < 2,
        }
        for index, area in enumerate(areas)
    ]

    return DemoToolResult(
        display_name="hotel.search_options",
        ui_component="HotelOptionList",
        status="active",
        title=f"{destination_name} 호텔 후보 {len(options)}개",
        summary=f"{normalized_nights}박 기준 예산 상한에 맞춰 업무 접근성 중심 후보를 만들었습니다.",
        details={
            "destination": destination_name,
            "budget_krw": normalized_budget,
            "nights": normalized_nights,
            "per_night_cap_krw": per_night_cap,
            "options": options,
        },
    )
