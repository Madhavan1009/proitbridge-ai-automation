"""GitHub webhook ingestion endpoints.

Two flavors:

  POST /api/github-webhook
      Simple normalized payload (used by simulator + external tools).

  POST /api/github
      Raw GitHub webhook endpoint. Point your repo's webhook here with
      content-type application/json. Handles `push` and `pull_request`
      events. Verifies X-Hub-Signature-256 when GITHUB_WEBHOOK_SECRET is set.
"""
import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Header, HTTPException, Request

from config import settings
from models.schemas import GitHubWebhookPayload
from routes._helpers import process_event

logger = logging.getLogger(__name__)
router = APIRouter()


def _verify_github_signature(body: bytes, signature: str | None) -> bool:
    """Validate the X-Hub-Signature-256 header GitHub sends.

    Returns True when:
      - No GITHUB_WEBHOOK_SECRET is configured (open mode), OR
      - The HMAC-SHA256 digest matches the supplied signature.
    """
    if not settings.GITHUB_WEBHOOK_SECRET:
        return True
    if not signature:
        return False
    expected = (
        "sha256="
        + hmac.new(
            settings.GITHUB_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
    )
    return hmac.compare_digest(expected, signature)


# ───────────────────────── Simple webhook ─────────────────────────

@router.post("/github-webhook")
async def github_webhook(payload: GitHubWebhookPayload):
    """Normalized webhook endpoint — used by the simulator and any tool that
    can send the simplified `GitHubWebhookPayload` schema directly."""
    activity = await process_event(
        event_type=payload.event_type,
        title=payload.title,
        description=payload.description or "",
        actor=payload.actor,
        repository=payload.repository,
        branch=payload.branch or "main",
        context=payload.metadata,
    )
    return {"status": "ok", "activity": activity.model_dump()}


# ───────────────────────── Raw GitHub webhook ─────────────────────

@router.post("/github")
async def github_event(
    request: Request,
    x_github_event: str | None = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: str | None = Header(None, alias="X-Hub-Signature-256"),
    x_github_delivery: str | None = Header(None, alias="X-GitHub-Delivery"),
):
    """Accept a raw GitHub webhook event.

    Configure your repo:
      Settings → Webhooks → Add webhook
      Payload URL:  https://<your-render-url>/api/github
      Content type: application/json
      Secret:       <same value as GITHUB_WEBHOOK_SECRET env var>
      Events:       push, pull_request

    Each push commit becomes its own ActivityLog entry. Pull request open /
    review_requested / closed events become a single PR ActivityLog.
    """
    body = await request.body()

    if not _verify_github_signature(body, x_hub_signature_256):
        raise HTTPException(status_code=401, detail="Invalid GitHub signature")

    try:
        payload = json.loads(body) if body else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = (x_github_event or "").lower()
    logger.info(
        "GitHub event received: %s (delivery=%s)", event, x_github_delivery
    )

    if event in ("", "ping"):
        return {
            "status": "ok",
            "message": "pong from ProITBridge",
            "zen": payload.get("zen"),
        }

    if event == "push":
        return await _handle_push(payload)

    if event == "pull_request":
        return await _handle_pull_request(payload)

    if event == "deployment_status":
        return await _handle_deployment_status(payload)

    logger.info("Ignoring unsupported GitHub event: %s", event)
    return {"status": "ignored", "event": event}


async def _handle_push(payload: dict) -> dict:
    """Process a push event — one ActivityLog per commit."""
    repo = payload.get("repository", {}).get("full_name", "unknown/repo")
    ref = payload.get("ref", "refs/heads/main")
    branch = ref.replace("refs/heads/", "")
    pusher = payload.get("pusher", {}).get("name") or payload.get(
        "sender", {}
    ).get("login", "unknown")
    commits = payload.get("commits") or []

    if not commits and payload.get("head_commit"):
        commits = [payload["head_commit"]]

    if not commits:
        return {"status": "ok", "message": "No commits in push payload"}

    activities = []
    for commit in commits:
        full_message = (commit.get("message") or "").strip()
        first_line = full_message.split("\n", 1)[0] or "(empty commit message)"
        author = (
            (commit.get("author") or {}).get("name")
            or (commit.get("author") or {}).get("username")
            or pusher
        )
        activity = await process_event(
            event_type="commit",
            title=first_line,
            description=full_message,
            actor=author,
            repository=repo,
            branch=branch,
            context={
                "commit_id": (commit.get("id") or "")[:8],
                "url": commit.get("url", ""),
                "modified": commit.get("modified", []),
                "added": commit.get("added", []),
                "removed": commit.get("removed", []),
            },
        )
        activities.append(activity.model_dump())

    return {
        "status": "ok",
        "event": "push",
        "repository": repo,
        "branch": branch,
        "processed": len(activities),
        "activities": activities,
    }


async def _handle_pull_request(payload: dict) -> dict:
    """Process a pull_request event — open / synchronize / closed / review."""
    action = payload.get("action", "")
    pr = payload.get("pull_request") or {}
    repo = payload.get("repository", {}).get("full_name", "unknown/repo")
    number = pr.get("number")
    title = pr.get("title", "")
    body_text = pr.get("body") or ""
    actor = (pr.get("user") or {}).get("login") or "unknown"
    branch = (pr.get("head") or {}).get("ref") or "main"

    # Only act on meaningful state changes
    if action not in {
        "opened",
        "reopened",
        "synchronize",
        "ready_for_review",
        "review_requested",
        "closed",
    }:
        return {"status": "ignored", "action": action}

    activity = await process_event(
        event_type="pull_request",
        title=f"PR #{number}: {title}",
        description=body_text,
        actor=actor,
        repository=repo,
        branch=branch,
        context={
            "pr_number": number,
            "action": action,
            "url": pr.get("html_url", ""),
            "merged": pr.get("merged", False),
            "draft": pr.get("draft", False),
            "additions": pr.get("additions", 0),
            "deletions": pr.get("deletions", 0),
            "changed_files": pr.get("changed_files", 0),
        },
    )

    return {
        "status": "ok",
        "event": "pull_request",
        "action": action,
        "repository": repo,
        "activity": activity.model_dump(),
    }


async def _handle_deployment_status(payload: dict) -> dict:
    """Process a deployment_status event — fires on success/failure/in_progress."""
    repo = payload.get("repository", {}).get("full_name", "unknown/repo")
    deployment = payload.get("deployment") or {}
    status = (payload.get("deployment_status") or {}).get("state", "")
    env = deployment.get("environment", "production")
    sha = (deployment.get("sha") or "")[:8]

    activity = await process_event(
        event_type="deployment",
        title=f"Deployment {status} in {env}",
        description=deployment.get("description") or "",
        actor=(deployment.get("creator") or {}).get("login") or "ci",
        repository=repo,
        branch=deployment.get("ref", "main"),
        context={"sha": sha, "environment": env, "status": status},
    )

    return {
        "status": "ok",
        "event": "deployment_status",
        "deployment_state": status,
        "activity": activity.model_dump(),
    }
