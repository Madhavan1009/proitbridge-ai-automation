"""Daily engineering summary endpoints.

Provides two ways to fire the scheduled automation:

  POST /api/daily-summary
      Manual trigger. Authenticated only by FastAPI's normal flow.
      Use from the dashboard "Run Now" button.

  POST /api/cron/daily-summary
      Cron-friendly trigger. Requires the X-Cron-Secret header to match the
      CRON_SECRET env var (if configured). Designed to be called by a
      GitHub Actions workflow / external scheduler.

And one history endpoint:

  GET  /api/summaries
      Returns the list of past daily summaries.
"""
import logging

from fastapi import APIRouter, Header, HTTPException, Query

from config import settings
from models.schemas import DailySummary, SummaryRequest
from services import storage
from services.summary_service import filter_window, generate_daily_summary
from services.zapier_service import trigger_zapier_summary

logger = logging.getLogger(__name__)

router = APIRouter()


async def _build_and_store(req: SummaryRequest) -> DailySummary:
    activities = storage.load_activities(settings.ACTIVITIES_FILE)
    windowed = filter_window(activities, req.window_hours)
    summary = await generate_daily_summary(windowed, req.window_hours)

    if req.trigger_zapier:
        triggered, message = await trigger_zapier_summary(summary)
        summary.zapier_triggered = triggered
        summary.zapier_response = message

    storage.append_summary(settings.SUMMARIES_FILE, summary.model_dump())
    return summary


@router.post("/daily-summary", response_model=DailySummary)
async def daily_summary(req: SummaryRequest | None = None):
    """Manually generate (and store + optionally fan-out) the daily summary."""
    return await _build_and_store(req or SummaryRequest())


@router.post("/cron/daily-summary", response_model=DailySummary)
async def cron_daily_summary(
    req: SummaryRequest | None = None,
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret"),
):
    """Cron-friendly endpoint protected by an optional shared secret.

    Configure `CRON_SECRET` on Render and pass it as the `X-Cron-Secret`
    header from your GitHub Actions / external scheduler. If `CRON_SECRET`
    is unset on the server the endpoint is open (handy during first setup).
    """
    if settings.CRON_SECRET and x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron secret")
    summary = await _build_and_store(req or SummaryRequest())
    logger.info(
        "Cron daily summary fired — health=%s, activities=%d, zapier=%s",
        summary.overall_health,
        summary.activity_count,
        summary.zapier_triggered,
    )
    return summary


@router.get("/summaries")
async def list_summaries(limit: int = Query(30, ge=1, le=120)):
    summaries = storage.load_summaries(settings.SUMMARIES_FILE)
    return {"count": len(summaries), "summaries": summaries[:limit]}


@router.get("/summaries/latest")
async def latest_summary():
    summaries = storage.load_summaries(settings.SUMMARIES_FILE)
    if not summaries:
        return {"summary": None}
    return {"summary": summaries[0]}


@router.delete("/summaries")
async def clear_summaries():
    storage.save_summaries(settings.SUMMARIES_FILE, [])
    return {"status": "ok", "cleared": True}
