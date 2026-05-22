"""Dashboard analytics endpoint."""
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from config import settings
from services import storage

router = APIRouter()


def _parse_ts(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


@router.get("/dashboard")
async def dashboard():
    activities = storage.load_activities(settings.ACTIVITIES_FILE)

    risk_counter = Counter(a.get("risk_level", "LOW") for a in activities)
    event_counter = Counter(a.get("event_type", "commit") for a in activities)
    triggered = sum(1 for a in activities if a.get("zapier_triggered"))
    pending_reviews = sum(
        len(a.get("analysis", {}).get("pending_reviews", [])) for a in activities
    )
    active_blockers = sum(
        len(a.get("analysis", {}).get("blockers", [])) for a in activities
    )

    # Build a 7-day risk trend
    today = datetime.now(timezone.utc).date()
    trend: list[dict] = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_str = day.isoformat()
        day_activities = [
            a for a in activities
            if _parse_ts(a.get("timestamp", "")).date() == day
        ]
        trend.append({
            "date": day_str,
            "high": sum(1 for a in day_activities if a.get("risk_level") == "HIGH"),
            "medium": sum(1 for a in day_activities if a.get("risk_level") == "MEDIUM"),
            "low": sum(1 for a in day_activities if a.get("risk_level") == "LOW"),
            "total": len(day_activities),
        })

    return {
        "total_activities": len(activities),
        "high_risk_count": risk_counter.get("HIGH", 0),
        "medium_risk_count": risk_counter.get("MEDIUM", 0),
        "low_risk_count": risk_counter.get("LOW", 0),
        "automations_triggered": triggered,
        "pending_reviews": pending_reviews,
        "active_blockers": active_blockers,
        "recent_activities": activities[:10],
        "risk_trend": trend,
        "event_breakdown": dict(event_counter),
        "integrations": {
            "groq_configured": settings.has_groq,
            "zapier_configured": settings.has_zapier,
        },
    }
