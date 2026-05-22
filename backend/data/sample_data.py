"""Sample engineering activity data used by simulation endpoints."""
import random
from datetime import datetime, timezone
from typing import Any

COMMITS = [
    {
        "title": "Modified payment database schema",
        "description": "Altered payments.transactions table — added settlement_state column",
        "repository": "engflow/payments-service",
        "actor": "alice.kumar",
        "branch": "feature/settlement-state",
    },
    {
        "title": "Fixed authentication timeout bug",
        "description": "JWT verification was timing out under load — adjusted refresh window",
        "repository": "engflow/auth-service",
        "actor": "ravi.shankar",
        "branch": "hotfix/auth-timeout",
    },
    {
        "title": "Added retry logic for Groq API requests",
        "description": "Implemented exponential backoff for transient 5xx errors",
        "repository": "engflow/ai-orchestrator",
        "actor": "neha.patel",
        "branch": "feature/groq-retry",
    },
    {
        "title": "Refactored deployment middleware",
        "description": "Simplified middleware stack and removed legacy logging adapter",
        "repository": "engflow/deploy-runner",
        "actor": "manish.iyer",
        "branch": "refactor/deploy-middleware",
    },
    {
        "title": "Updated README and contributor docs",
        "description": "Routine documentation cleanup",
        "repository": "engflow/website",
        "actor": "priya.sharma",
        "branch": "docs/contributors",
    },
]

PULL_REQUESTS = [
    {
        "title": "PR #52: Modified payment database schema — pending review",
        "description": "Requires DBA sign-off before merge",
        "repository": "engflow/payments-service",
        "actor": "alice.kumar",
    },
    {
        "title": "PR #81: Multi-tenant deployment config — requires QA approval",
        "description": "Changes tenant routing logic; QA suite must pass",
        "repository": "engflow/deploy-runner",
        "actor": "manish.iyer",
    },
    {
        "title": "PR #97: Add Stripe webhook handler",
        "description": "Awaiting security review",
        "repository": "engflow/payments-service",
        "actor": "ravi.shankar",
    },
]

DEPLOYMENTS = [
    {
        "title": "Deployment failed in staging environment",
        "description": "payments-service v2.7.1 failed post-deploy smoke tests",
        "repository": "engflow/payments-service",
        "actor": "ci-bot",
    },
    {
        "title": "Database migration timeout detected",
        "description": "Migration 20260518_add_settlement_state exceeded 60s threshold",
        "repository": "engflow/payments-service",
        "actor": "migration-runner",
    },
    {
        "title": "High API latency in payment service",
        "description": "p95 latency 1.8s — above 800ms SLO",
        "repository": "engflow/payments-service",
        "actor": "observability-bot",
    },
]

INCIDENTS = [
    {
        "title": "Production chatbot returning invalid responses",
        "description": "Support team reports malformed JSON from /v1/chat endpoint",
        "repository": "engflow/ai-orchestrator",
        "actor": "support-team",
    },
    {
        "title": "Invoice generation service failed",
        "description": "Cron job invoice-generator failed for 14 customers overnight",
        "repository": "engflow/billing-service",
        "actor": "ops-on-call",
    },
    {
        "title": "Payment webhook signatures failing verification",
        "description": "Stripe webhook 401s — possible rotated secret",
        "repository": "engflow/payments-service",
        "actor": "stripe-bot",
    },
]

APPROVALS = [
    {
        "title": "Release v3.2.0 awaiting engineering manager approval",
        "description": "12 PRs bundled — manager review required before tag",
        "repository": "engflow/release-train",
        "actor": "release-bot",
    },
    {
        "title": "Schema change request pending DBA approval",
        "description": "Add index on transactions(settlement_state, created_at)",
        "repository": "engflow/payments-service",
        "actor": "alice.kumar",
    },
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def random_event(event_type: str | None = None) -> dict[str, Any]:
    """Return a random sample event of the given type (or random if None)."""
    pool_map = {
        "commit": COMMITS,
        "pull_request": PULL_REQUESTS,
        "deployment": DEPLOYMENTS,
        "incident": INCIDENTS,
        "approval": APPROVALS,
    }
    if event_type is None:
        event_type = random.choice(list(pool_map.keys()))
    sample = dict(random.choice(pool_map[event_type]))
    sample["event_type"] = event_type
    sample["timestamp"] = _now()
    sample.setdefault("branch", "main")
    return sample


def scenario_event(scenario: str) -> dict[str, Any]:
    """Return a sample event matching a high-level scenario."""
    mapping = {
        "deployment_failure": "deployment",
        "high_risk_pr": "pull_request",
        "production_incident": "incident",
        "pending_approval": "approval",
        "routine_commit": "commit",
    }
    return random_event(mapping.get(scenario, "commit"))


def seed_activities(count: int = 8) -> list[dict[str, Any]]:
    """Generate a starter batch of sample events for empty-state demos."""
    return [random_event() for _ in range(count)]
