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


def _default_trigger(actions: list[str], risk: str) -> bool:
    """Built-in fallback when no user rules are configured.

    Trigger Zapier for any HIGH/MEDIUM risk event, or whenever explicit
    actions were recommended."""
    return risk in {"HIGH", "MEDIUM"} or bool(actions)


def evaluate_rules(
    rules: list[dict],
    event_type: str,
    risk_level: str,
) -> list[dict]:
    """Return every enabled rule whose risk/event filters match this event.

    A rule with no filter on a dimension matches every value for that
    dimension — i.e. an unset risk_filter matches HIGH/MEDIUM/LOW alike.
    """
    matched: list[dict] = []
    for rule in rules:
        if not rule.get("enabled", True):
            continue
        rfilter = rule.get("risk_filter")
        if rfilter and rfilter != risk_level:
            continue
        efilter = rule.get("event_filter")
        if efilter and efilter != event_type:
            continue
        matched.append(rule)
    return matched


def _should_trigger(
    rules: list[dict],
    matched_rules: list[dict],
    event_type: str,
    risk: str,
    actions: list[str],
) -> tuple[bool, str]:
    """Decide whether to fire Zapier and explain why.

    Decision flow:
      1. If the user has configured ANY rules, only fire when at least one
         enabled rule matches. (Rules ARE the contract.)
      2. If no rules are configured at all, fall back to the default
         risk-based threshold.
    """
    if rules:
        if matched_rules:
            names = ", ".join(r.get("name", "rule") for r in matched_rules)
            return True, f"Matched rule(s): {names}"
        return False, "No matching automation rule"

    if _default_trigger(actions, risk):
        return True, f"Default policy: risk={risk}"
    return False, "Below default trigger threshold"


async def trigger_zapier(
    activity_id: str,
    event_type: str,
    title: str,
    actor: str,
    repository: str,
    analysis: AnalysisResult,
    rules: list[dict] | None = None,
) -> tuple[bool, str]:
    """Send analysis payload to Zapier. Returns (triggered, message)."""
    rules = rules or []
    matched_rules = evaluate_rules(rules, event_type, analysis.risk_level)
    should, reason = _should_trigger(
        rules, matched_rules, event_type, analysis.risk_level, analysis.recommended_actions
    )
    if not should:
        return False, reason

    # Flatten rule-recommended actions on top of AI-recommended actions
    rule_actions: list[str] = []
    for r in matched_rules:
        for a in r.get("actions", []):
            if a not in rule_actions:
                rule_actions.append(a)

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
        # Rule metadata so Zapier can branch on it (Paths, Filter, etc.)
        "matched_rule_ids": [r.get("id") for r in matched_rules],
        "matched_rule_names": [r.get("name") for r in matched_rules],
        "rule_actions": rule_actions,
        "trigger_reason": reason,
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
    """Send a daily summary payload to Zapier as the standup digest.

    Includes both the daily-summary-native fields (`headline`,
    `overall_health`, …) AND an event-driven-compatible projection
    (`title`, `risk_level`, `blockers`, …) so a single Zap can handle
    both event-driven and scheduled payloads without a Filter/Path step.
    """
    # Map summary health → risk_level so existing Gmail Zaps keep working
    health_to_risk = {"RED": "HIGH", "YELLOW": "MEDIUM", "GREEN": "LOW"}

    payload: dict[str, Any] = {
        # ─── Discriminator ───
        "kind": "daily_summary",
        "subject": f"Daily Engineering Standup — {summary.overall_health}",

        # ─── Daily-summary-native fields ───
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

        # ─── Event-driven-compatible projection ───
        # so an existing Gmail Zap with {{title}} {{risk_level}}
        # placeholders still produces a meaningful email.
        "activity_id": summary.id,
        "event_type": "daily_summary",
        "title": summary.headline,
        "actor": "ProITBridge Daily Standup",
        "repository": "engflow/daily-summary",
        "risk_level": health_to_risk.get(summary.overall_health, "LOW"),
        "blockers": summary.active_blockers,
        "pending_reviews": summary.pending_approvals,
        "recommended_actions": summary.recommended_focus,
        "confidence": 0.95,
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
