"""Thread-safe JSON file storage for activities and rules."""
import json
import threading
from pathlib import Path
from typing import Any

_file_lock = threading.Lock()


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with _file_lock:
            with path.open("r", encoding="utf-8") as f:
                return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def _write_json(path: Path, data: Any) -> None:
    with _file_lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)


def load_activities(path: Path) -> list[dict]:
    return _read_json(path, [])


def save_activities(path: Path, activities: list[dict]) -> None:
    _write_json(path, activities)


def append_activity(path: Path, activity: dict, max_entries: int = 500) -> None:
    activities = load_activities(path)
    activities.insert(0, activity)
    if len(activities) > max_entries:
        activities = activities[:max_entries]
    save_activities(path, activities)


def load_rules(path: Path) -> list[dict]:
    rules = _read_json(path, None)
    if rules is None:
        rules = _default_rules()
        save_rules(path, rules)
    return rules


def save_rules(path: Path, rules: list[dict]) -> None:
    _write_json(path, rules)


def load_summaries(path: Path) -> list[dict]:
    return _read_json(path, [])


def save_summaries(path: Path, summaries: list[dict]) -> None:
    _write_json(path, summaries)


def append_summary(path: Path, summary: dict, max_entries: int = 60) -> None:
    summaries = load_summaries(path)
    summaries.insert(0, summary)
    if len(summaries) > max_entries:
        summaries = summaries[:max_entries]
    save_summaries(path, summaries)


def _default_rules() -> list[dict]:
    """Seed rules so the rules page is not empty on first run."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": "rule-default-1",
            "name": "Escalate High-Risk Deployments",
            "condition": "If deployment risk is HIGH, notify DevOps lead and create QA task in Trello.",
            "risk_filter": "HIGH",
            "event_filter": "deployment",
            "actions": ["notify_devops", "create_trello_task", "log_sheet"],
            "enabled": True,
            "created_at": now,
        },
        {
            "id": "rule-default-2",
            "name": "Track PR Approvals",
            "condition": "When a pull request is pending review for more than 24h, send Gmail reminder.",
            "risk_filter": None,
            "event_filter": "pull_request",
            "actions": ["gmail_reminder", "log_sheet"],
            "enabled": True,
            "created_at": now,
        },
        {
            "id": "rule-default-3",
            "name": "Incident Auto-Response",
            "condition": "On production incident, notify on-call engineer and open Trello incident card.",
            "risk_filter": "HIGH",
            "event_filter": "incident",
            "actions": ["notify_oncall", "create_trello_task", "discord_alert"],
            "enabled": True,
            "created_at": now,
        },
    ]
