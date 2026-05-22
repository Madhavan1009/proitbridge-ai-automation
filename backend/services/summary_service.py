"""Daily engineering summary generator.

Aggregates the last N hours of activity, asks Groq to roll it up into a
standup-style report, and returns a DailySummary object.

Falls back to a deterministic heuristic summary when Groq is unavailable
so the scheduled automation works out-of-the-box.
"""
import json
import logging
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

from config import settings
from models.schemas import DailySummary

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are ProITBridge's daily engineering standup assistant.

You receive a JSON list of engineering activity (commits, PRs, deployments,
incidents, approvals) that occurred in the last 24 hours, each with a
risk_level already assigned by an upstream AI. Roll the list up into ONE
JSON object describing the state of engineering operations.

Respond with ONLY a JSON object (no markdown, no prose) with exactly these
keys:

{
  "headline": "<one-sentence headline an engineering manager could read in 3 seconds>",
  "overall_health": "GREEN" | "YELLOW" | "RED",
  "summary": "<2-3 sentence executive summary>",
  "top_risks": ["<concise risk #1>", "<risk #2>"],
  "active_blockers": ["<blocker #1>", "..."],
  "pending_approvals": ["<approval #1>", "..."],
  "completed_work": ["<notable completion #1>", "..."],
  "recommended_focus": ["<what the team should prioritize today>", "..."]
}

Health guidance:
- RED: any production incident, failed deployment, payment/auth/security
  HIGH-risk events, or 3+ HIGH-risk events in the window.
- YELLOW: 1-2 HIGH-risk events, or many MEDIUM-risk events, or pending
  approvals on critical paths.
- GREEN: routine activity only, no HIGH-risk events.

Keep each bullet under 12 words. Be specific — reference repos/PRs by name
when possible.
"""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_ts(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return datetime.now(timezone.utc)


def filter_window(activities: list[dict], window_hours: int) -> list[dict]:
    """Return activities within the last `window_hours`."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
    return [a for a in activities if _parse_ts(a.get("timestamp", "")) >= cutoff]


def _heuristic_health(risk_counts: Counter) -> str:
    if risk_counts.get("HIGH", 0) >= 3:
        return "RED"
    if risk_counts.get("HIGH", 0) >= 1:
        return "YELLOW"
    if risk_counts.get("MEDIUM", 0) >= 3:
        return "YELLOW"
    return "GREEN"


def _heuristic_summary(
    activities: list[dict],
    window_hours: int,
) -> dict[str, Any]:
    """Deterministic fallback when Groq is unavailable or returns no data."""
    if not activities:
        return {
            "headline": f"Quiet engineering window — no activity in the last {window_hours}h.",
            "overall_health": "GREEN",
            "summary": (
                "No new engineering events were recorded in the last "
                f"{window_hours} hours. The platform is idle."
            ),
            "top_risks": [],
            "active_blockers": [],
            "pending_approvals": [],
            "completed_work": [],
            "recommended_focus": ["Trigger a simulation or connect a GitHub webhook"],
        }

    risk_counts = Counter(a.get("risk_level", "LOW") for a in activities)
    health = _heuristic_health(risk_counts)

    top_risks = [
        f"{a.get('event_type','event').replace('_',' ').title()}: {a.get('title','')}"
        for a in activities
        if a.get("risk_level") == "HIGH"
    ][:5]

    active_blockers = list({
        b for a in activities for b in a.get("analysis", {}).get("blockers", [])
    })[:6]

    pending_approvals = list({
        p for a in activities for p in a.get("analysis", {}).get("pending_reviews", [])
    })[:6]

    completed_work = [
        a.get("title", "") for a in activities
        if a.get("risk_level") == "LOW" and a.get("event_type") == "commit"
    ][:5]

    recommended_focus = list({
        action for a in activities
        if a.get("risk_level") == "HIGH"
        for action in a.get("analysis", {}).get("recommended_actions", [])
    })[:5] or ["Continue routine reviews"]

    headline = {
        "RED": f"{risk_counts.get('HIGH',0)} HIGH-risk events need attention this morning",
        "YELLOW": f"Engineering ops mostly stable — {risk_counts.get('HIGH',0)} HIGH-risk item(s) to triage",
        "GREEN": "Engineering ops are healthy across all tracked services",
    }[health]

    summary_text = (
        f"In the last {window_hours}h the platform processed "
        f"{len(activities)} engineering events: "
        f"{risk_counts.get('HIGH',0)} HIGH, "
        f"{risk_counts.get('MEDIUM',0)} MEDIUM, "
        f"{risk_counts.get('LOW',0)} LOW risk. "
        f"Overall health is {health}."
    )

    return {
        "headline": headline,
        "overall_health": health,
        "summary": summary_text,
        "top_risks": top_risks,
        "active_blockers": active_blockers,
        "pending_approvals": pending_approvals,
        "completed_work": completed_work,
        "recommended_focus": recommended_focus,
    }


async def generate_daily_summary(
    activities: list[dict],
    window_hours: int = 24,
) -> DailySummary:
    """Build a DailySummary for the activities passed in (already windowed)."""
    risk_counts = Counter(a.get("risk_level", "LOW") for a in activities)
    event_counts = Counter(a.get("event_type", "commit") for a in activities)

    if not settings.has_groq or not activities:
        data = _heuristic_summary(activities, window_hours)
    else:
        # Compact payload — title + risk + event_type + blockers are enough
        condensed = [
            {
                "title": a.get("title"),
                "repository": a.get("repository"),
                "event_type": a.get("event_type"),
                "risk_level": a.get("risk_level"),
                "blockers": a.get("analysis", {}).get("blockers", []),
                "pending_reviews": a.get("analysis", {}).get("pending_reviews", []),
                "recommended_actions": a.get("analysis", {}).get(
                    "recommended_actions", []
                ),
            }
            for a in activities
        ]
        user_payload = {
            "window_hours": window_hours,
            "activity_count": len(activities),
            "risk_breakdown": dict(risk_counts),
            "event_breakdown": dict(event_counts),
            "activities": condensed,
        }
        try:
            from groq import Groq
            client = Groq(api_key=settings.GROQ_API_KEY)
            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(user_payload)},
                ],
                temperature=0.2,
                max_tokens=900,
                response_format={"type": "json_object"},
            )
            raw = completion.choices[0].message.content or "{}"
            data = json.loads(raw)
        except Exception as exc:
            logger.warning(
                "Groq daily-summary call failed (%s) — falling back.", exc
            )
            data = _heuristic_summary(activities, window_hours)

    return DailySummary(
        id=f"sum-{uuid.uuid4().hex[:10]}",
        generated_at=_now_iso(),
        window_hours=window_hours,
        activity_count=len(activities),
        headline=data.get("headline", "Daily Engineering Summary"),
        overall_health=data.get("overall_health", "GREEN"),
        summary=data.get("summary", ""),
        top_risks=data.get("top_risks", []) or [],
        active_blockers=data.get("active_blockers", []) or [],
        pending_approvals=data.get("pending_approvals", []) or [],
        completed_work=data.get("completed_work", []) or [],
        recommended_focus=data.get("recommended_focus", []) or [],
        risk_breakdown=dict(risk_counts),
        event_breakdown=dict(event_counts),
    )
