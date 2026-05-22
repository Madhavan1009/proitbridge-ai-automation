"""Direct AI analysis endpoint."""
from fastapi import APIRouter

from models.schemas import AnalysisRequest, AnalysisResult
from services.groq_service import analyze_event

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(request: AnalysisRequest):
    """Analyze an engineering event without triggering Zapier or logging.

    Useful for ad-hoc evaluation from the dashboard or external tools.
    """
    return await analyze_event(
        title=request.title,
        description=request.description or "",
        event_type=request.event_type,
        context=request.context,
    )
