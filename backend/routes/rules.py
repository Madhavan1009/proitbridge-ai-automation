"""Automation rules CRUD."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from config import settings
from models.schemas import AutomationRule
from services import storage

router = APIRouter()


@router.get("/rules")
async def list_rules():
    rules = storage.load_rules(settings.RULES_FILE)
    return {"count": len(rules), "rules": rules}


@router.post("/rules")
async def create_rule(rule: AutomationRule):
    rules = storage.load_rules(settings.RULES_FILE)
    new_rule = rule.model_dump()
    new_rule["id"] = new_rule.get("id") or f"rule-{uuid.uuid4().hex[:8]}"
    new_rule["created_at"] = datetime.now(timezone.utc).isoformat()
    rules.insert(0, new_rule)
    storage.save_rules(settings.RULES_FILE, rules)
    return {"status": "ok", "rule": new_rule}


@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, rule: AutomationRule):
    rules = storage.load_rules(settings.RULES_FILE)
    for index, existing in enumerate(rules):
        if existing.get("id") == rule_id:
            updated = rule.model_dump()
            updated["id"] = rule_id
            updated["created_at"] = existing.get("created_at")
            rules[index] = updated
            storage.save_rules(settings.RULES_FILE, rules)
            return {"status": "ok", "rule": updated}
    raise HTTPException(status_code=404, detail="Rule not found")


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    rules = storage.load_rules(settings.RULES_FILE)
    remaining = [r for r in rules if r.get("id") != rule_id]
    if len(remaining) == len(rules):
        raise HTTPException(status_code=404, detail="Rule not found")
    storage.save_rules(settings.RULES_FILE, remaining)
    return {"status": "ok", "deleted": rule_id}
