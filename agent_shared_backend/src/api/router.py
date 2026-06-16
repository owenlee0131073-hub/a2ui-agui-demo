"""API router composition."""

from __future__ import annotations

from fastapi import APIRouter

from .endpoints import router as endpoints_router

router = APIRouter()
router.include_router(endpoints_router)
