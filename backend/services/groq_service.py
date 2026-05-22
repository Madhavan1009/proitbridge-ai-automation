"""Groq AI integration for engineering workflow analysis."""
import json
import logging
from typing import Optional

from config import settings
from models.schemas import AnalysisResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are EngFlow AI, an engineering operations risk analyzer.

You receive a GitHub commit, pull request, deployment alert, incident report,
or approval event from an engineering team. Your job is to evaluate it and
return ONE valid JSON object describing operational risk and recommended
automated actions.

You MUST respond with ONLY a JSON object (no prose, no markdown fences) with
exactly these keys:

{
  "summary": "<one-sentence summary of the engineering event>",
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "blockers": ["..."],
  "pending_reviews": ["..."],
  "recommended_actions": ["..."],
  "confidence": 0.0-1.0
}

Risk guidance:
- HIGH: production impact, database/schema changes, payment/auth code, failed
  deployments, severe incidents, security-sensitive changes.
- MEDIUM: PRs awaiting review for critical paths, partial deploy failures,
  flaky tests on important services, configuration changes.
- LOW: routine commits, doc updates, dependency bumps, formatting.

Recommended actions should be concrete operational steps such as
"Notify DevOps", "Create QA checklist", "Escalate to incident channel",
"Gmail reminder to PR reviewer", "Update Google Sheets log".
"""


def _fallback_analysis(title: str, description: str, event_type: str) -> AnalysisResult:
    """Heuristic analysis used when Groq is unavailable (no API key, error, etc.)."""
    text = f"{title} {description}".lower()

    high_signals = [
        "payment", "schema", "database", "migration", "auth", "production",
        "incident", "outage", "failed", "timeout", "security", "rollback",
        "critical", "p0", "p1", "breach",
    ]
    medium_signals = [
        "pr ", "pull request", "review", "qa", "staging", "config", "flaky",
        "approval", "pending", "deployment",
    ]

    if any(signal in text for signal in high_signals):
        risk = "HIGH"
    elif any(signal in text for signal in medium_signals) or event_type in {
        "pull_request", "deployment", "incident"
    }:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    blockers, reviews, actions = [], [], []
    if event_type == "pull_request":
        reviews.append(title)
        actions.append("Send Gmail reminder to PR reviewer")
    if event_type == "deployment" and risk == "HIGH":
        blockers.append("Pending QA approval")
        actions.extend([
            "Notify DevOps lead",
            "Create QA checklist in Trello",
            "Escalate deployment review",
        ])
    if event_type == "incident":
        blockers.append("Production impact under investigation")
        actions.extend([
            "Page on-call engineer",
            "Open Trello incident card",
            "Post status to Discord/Slack",
        ])
    if not actions:
        actions.append("Log activity to Google Sheets")

    return AnalysisResult(
        summary=f"{event_type.replace('_', ' ').title()}: {title}",
        risk_level=risk,
        blockers=blockers,
        pending_reviews=reviews,
        recommended_actions=actions,
        confidence=0.6,
    )


async def analyze_event(
    title: str,
    description: str = "",
    event_type: str = "commit",
    context: Optional[dict] = None,
) -> AnalysisResult:
    """Send an engineering event to Groq and return structured analysis."""
    if not settings.has_groq:
        logger.info("Groq API key missing — using fallback analyzer.")
        return _fallback_analysis(title, description, event_type)

    user_payload = {
        "event_type": event_type,
        "title": title,
        "description": description or "",
        "context": context or {},
    }
    user_message = json.dumps(user_payload, indent=2)

    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
            max_tokens=512,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)
        return AnalysisResult(
            summary=data.get("summary", title),
            risk_level=data.get("risk_level", "LOW"),
            blockers=data.get("blockers", []),
            pending_reviews=data.get("pending_reviews", []),
            recommended_actions=data.get("recommended_actions", []),
            confidence=float(data.get("confidence", 0.85)),
        )
    except Exception as exc:
        logger.warning("Groq call failed (%s) — falling back to heuristic.", exc)
        return _fallback_analysis(title, description, event_type)
