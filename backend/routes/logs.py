"""Activity log endpoints."""
from typing import Optional

from fastapi import APIRouter, Query

from config import settings
from services import storage

router = APIRouter()


@router.get("/logs")
async def get_logs(
    limit: int = Query(100, ge=1, le=500),
    risk: Optional[str] = Query(None, pattern="^(HIGH|MEDIUM|LOW)$"),
    event_type: Optional[str] = None,
):
    activities = storage.load_activities(settings.ACTIVITIES_FILE)
    if risk:
        activities = [a for a in activities if a.get("risk_level") == risk]
    if event_type:
        activities = [a for a in activities if a.get("event_type") == event_type]
    return {"count": len(activities), "logs": activities[:limit]}


@router.delete("/logs")
async def clear_logs():
    storage.save_activities(settings.ACTIVITIES_FILE, [])
    return {"status": "ok", "cleared": True}
