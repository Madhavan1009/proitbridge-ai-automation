"""Helpers shared by route modules."""
import uuid
from datetime import datetime, timezone

from config import settings
from models.schemas import ActivityLog, AnalysisResult
from services import storage
from services.groq_service import analyze_event
from services.zapier_service import trigger_zapier


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def process_event(
    *,
    event_type: str,
    title: str,
    description: str,
    actor: str,
    repository: str,
    branch: str = "main",
    context: dict | None = None,
) -> ActivityLog:
    """Full pipeline: AI analysis -> Zapier trigger -> log -> return activity."""
    analysis: AnalysisResult = await analyze_event(
        title=title,
        description=description,
        event_type=event_type,
        context=context,
    )

    # Load user-defined automation rules — process_event applies them
    # when deciding whether to fan out to Zapier.
    rules = storage.load_rules(settings.RULES_FILE)

    activity_id = f"act-{uuid.uuid4().hex[:10]}"
    triggered, message = await trigger_zapier(
        activity_id=activity_id,
        event_type=event_type,
        title=title,
        actor=actor,
        repository=repository,
        analysis=analysis,
        rules=rules,
    )

    activity = ActivityLog(
        id=activity_id,
        timestamp=_now_iso(),
        event_type=event_type,
        actor=actor,
        repository=repository,
        title=title,
        description=description,
        risk_level=analysis.risk_level,
        analysis=analysis,
        zapier_triggered=triggered,
        zapier_response=message,
    )
    storage.append_activity(settings.ACTIVITIES_FILE, activity.model_dump())
    return activity
