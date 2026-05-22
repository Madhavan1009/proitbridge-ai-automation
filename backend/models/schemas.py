"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


RiskLevel = Literal["HIGH", "MEDIUM", "LOW"]
EventType = Literal[
    "commit",
    "pull_request",
    "deployment",
    "incident",
    "approval",
    "webhook",
]


class GitHubWebhookPayload(BaseModel):
    """Simplified GitHub webhook payload."""
    event_type: EventType = "commit"
    repository: str = "demo-repo"
    actor: str = "developer"
    title: str
    description: Optional[str] = ""
    branch: Optional[str] = "main"
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnalysisRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    event_type: EventType = "commit"
    context: Optional[dict[str, Any]] = None


class AnalysisResult(BaseModel):
    summary: str
    risk_level: RiskLevel
    blockers: list[str] = []
    pending_reviews: list[str] = []
    recommended_actions: list[str] = []
    confidence: float = 0.85


class ActivityLog(BaseModel):
    id: str
    timestamp: str
    event_type: EventType
    actor: str
    repository: str
    title: str
    description: str
    risk_level: RiskLevel
    analysis: AnalysisResult
    zapier_triggered: bool = False
    zapier_response: Optional[str] = None


class AutomationRule(BaseModel):
    id: Optional[str] = None
    name: str
    condition: str
    risk_filter: Optional[RiskLevel] = None
    event_filter: Optional[EventType] = None
    actions: list[str]
    enabled: bool = True
    created_at: Optional[str] = None


class DashboardStats(BaseModel):
    total_activities: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    automations_triggered: int
    pending_reviews: int
    active_blockers: int
    recent_activities: list[ActivityLog]
    risk_trend: list[dict[str, Any]]
    event_breakdown: dict[str, int]


class SimulationRequest(BaseModel):
    scenario: Literal[
        "deployment_failure",
        "high_risk_pr",
        "production_incident",
        "pending_approval",
        "routine_commit",
    ]


class DailySummary(BaseModel):
    """Roll-up of engineering activity over a time window (default 24h)."""
    id: str
    generated_at: str
    window_hours: int
    activity_count: int
    headline: str                       # one-line standup headline
    overall_health: Literal["GREEN", "YELLOW", "RED"]
    summary: str                        # 2-3 sentence executive summary
    top_risks: list[str]
    active_blockers: list[str]
    pending_approvals: list[str]
    completed_work: list[str]
    recommended_focus: list[str]        # what the team should prioritize today
    risk_breakdown: dict[str, int]      # {"HIGH":3,"MEDIUM":2,"LOW":5}
    event_breakdown: dict[str, int]
    zapier_triggered: bool = False
    zapier_response: Optional[str] = None


class SummaryRequest(BaseModel):
    window_hours: int = 24
    trigger_zapier: bool = True
