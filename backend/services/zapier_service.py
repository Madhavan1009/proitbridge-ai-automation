"""Zapier webhook orchestrator.

Posts the AI analysis result to a Zapier 'Catch Hook' webhook URL configured
via the ZAPIER_WEBHOOK_URL environment variable. From Zapier you can fan-out
to Gmail, Trello, Google Sheets, Discord/Slack, etc.

If no Zapier webhook is configured we log the payload locally so the
dashboard can still demonstrate the orchestration flow.
"""
import logging
from typing import Any

import httpx

from config import settings
from models.schemas import AnalysisResult, DailySummary

logger = logging.getLogger(__name__)


def _should_trigger(actions: list[str], risk: str) -> bool:
    """Trigger Zapier for any HIGH/MEDIUM risk event, or whenever explicit
    actions were recommended."""
    return risk in {"HIGH", "MEDIUM"} or bool(actions)


async def trigger_zapier(
    activity_id: str,
    event_type: str,
    title: str,
    actor: str,
    repository: str,
    analysis: AnalysisResult,
) -> tuple[bool, str]:
    """Send analysis payload to Zapier. Returns (triggered, message)."""
    if not _should_trigger(analysis.recommended_actions, analysis.risk_level):
        return False, "Below trigger threshold"

    payload: dict[str, Any] = {
        "activity_id": activity_id,
        "event_type": event_type,
        "title": title,
        "actor": actor,
        "repository": repository,
        "risk_level": analysis.risk_level,
        "summary": analysis.summary,
        "blockers": analysis.blockers,
        "pending_reviews": analysis.pending_reviews,
        "recommended_actions": analysis.recommended_actions,
        "confidence": analysis.confidence,
    }

    if not settings.has_zapier:
        logger.info("Zapier webhook not configured — payload logged only: %s", payload)
        return True, "Zapier webhook not configured (payload logged locally)"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(settings.ZAPIER_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return True, f"Zapier accepted (HTTP {response.status_code})"
    except httpx.HTTPError as exc:
        logger.warning("Zapier call failed: %s", exc)
        return False, f"Zapier call failed: {exc}"


async def trigger_zapier_summary(summary: DailySummary) -> tuple[bool, str]:
    """Send a daily summary payload to Zapier as the standup digest."""
    payload: dict[str, Any] = {
        "kind": "daily_summary",
        "subject": f"Daily Engineering Standup — {summary.overall_health}",
        "summary_id": summary.id,
        "generated_at": summary.generated_at,
        "window_hours": summary.window_hours,
        "activity_count": summary.activity_count,
        "headline": summary.headline,
        "overall_health": summary.overall_health,
        "summary": summary.summary,
        "top_risks": summary.top_risks,
        "active_blockers": summary.active_blockers,
        "pending_approvals": summary.pending_approvals,
        "completed_work": summary.completed_work,
        "recommended_focus": summary.recommended_focus,
        "risk_breakdown": summary.risk_breakdown,
        "event_breakdown": summary.event_breakdown,
    }

    if not settings.has_zapier:
        logger.info(
            "Zapier webhook not configured — daily summary payload logged only."
        )
        return True, "Zapier webhook not configured (payload logged locally)"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(settings.ZAPIER_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return True, f"Zapier accepted summary (HTTP {response.status_code})"
    except httpx.HTTPError as exc:
        logger.warning("Zapier summary call failed: %s", exc)
        return False, f"Zapier summary call failed: {exc}"
