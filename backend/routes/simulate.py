"""Simulation endpoints that drive the demo without real integrations."""
from fastapi import APIRouter

from config import settings
from data.sample_data import random_event, scenario_event, seed_activities
from models.schemas import SimulationRequest
from routes._helpers import process_event
from services import storage

router = APIRouter()


@router.post("/simulate")
async def simulate(req: SimulationRequest):
    """Run a single scenario through the full AI + Zapier pipeline."""
    event = scenario_event(req.scenario)
    activity = await process_event(
        event_type=event["event_type"],
        title=event["title"],
        description=event.get("description", ""),
        actor=event.get("actor", "developer"),
        repository=event.get("repository", "engflow/demo"),
        branch=event.get("branch", "main"),
    )
    return {"status": "ok", "scenario": req.scenario, "activity": activity.model_dump()}


@router.post("/simulate/random")
async def simulate_random():
    """Generate one random engineering event."""
    event = random_event()
    activity = await process_event(
        event_type=event["event_type"],
        title=event["title"],
        description=event.get("description", ""),
        actor=event.get("actor", "developer"),
        repository=event.get("repository", "engflow/demo"),
        branch=event.get("branch", "main"),
    )
    return {"status": "ok", "activity": activity.model_dump()}


@router.post("/simulate/seed")
async def simulate_seed(count: int = 8):
    """Seed the activity log with a starter batch (one-shot, for empty demos)."""
    existing = storage.load_activities(settings.ACTIVITIES_FILE)
    if existing:
        return {
            "status": "skipped",
            "reason": "Activity log already populated",
            "existing": len(existing),
        }
    activities = []
    for event in seed_activities(count=count):
        activity = await process_event(
            event_type=event["event_type"],
            title=event["title"],
            description=event.get("description", ""),
            actor=event.get("actor", "developer"),
            repository=event.get("repository", "engflow/demo"),
            branch=event.get("branch", "main"),
        )
        activities.append(activity.model_dump())
    return {"status": "ok", "seeded": len(activities)}
