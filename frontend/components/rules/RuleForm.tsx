"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { AutomationRule, EventType, RiskLevel } from "@/lib/types";

const ACTION_OPTIONS = [
  { id: "notify_devops", label: "Notify DevOps" },
  { id: "notify_oncall", label: "Page On-Call Engineer" },
  { id: "create_trello_task", label: "Create Trello Task" },
  { id: "gmail_reminder", label: "Send Gmail Reminder" },
  { id: "log_sheet", label: "Log to Google Sheets" },
  { id: "discord_alert", label: "Discord/Slack Alert" },
  { id: "escalate_review", label: "Escalate Deployment Review" },
];

export function RuleForm({
  onCreate,
  busy,
}: {
  onCreate: (rule: AutomationRule) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [condition, setCondition] = useState("");
  const [risk, setRisk] = useState<RiskLevel | "">("HIGH");
  const [event, setEvent] = useState<EventType | "">("");
  const [actions, setActions] = useState<string[]>(["notify_devops"]);

  const toggleAction = (id: string) => {
    setActions((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !condition.trim() || actions.length === 0) return;
    await onCreate({
      name: name.trim(),
      condition: condition.trim(),
      risk_filter: (risk || null) as RiskLevel | null,
      event_filter: (event || null) as EventType | null,
      actions,
      enabled: true,
    });
    setName("");
    setCondition("");
    setActions(["notify_devops"]);
  };

  return (
    <form onSubmit={submit} className="glass-card p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white tracking-tight">
          New Automation Rule
        </h3>
        <p className="text-xs text-slate-400">
          Describe a condition in plain English. ProITBridge will match it
          against incoming events.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Label>Rule Name</Label>
          <input
            className="input-base"
            placeholder="e.g. Escalate High-Risk Payments PRs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Trigger Condition</Label>
          <input
            className="input-base"
            placeholder='e.g. "If deployment risk is HIGH, notify DevOps and create QA task"'
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Label>Risk Filter</Label>
          <select
            className="input-base"
            value={risk}
            onChange={(e) => setRisk(e.target.value as RiskLevel | "")}
          >
            <option value="">Any risk level</option>
            <option value="HIGH">HIGH only</option>
            <option value="MEDIUM">MEDIUM and above</option>
            <option value="LOW">LOW only</option>
          </select>
        </div>
        <div>
          <Label>Event Filter</Label>
          <select
            className="input-base"
            value={event}
            onChange={(e) => setEvent(e.target.value as EventType | "")}
          >
            <option value="">Any event type</option>
            <option value="commit">Commit</option>
            <option value="pull_request">Pull Request</option>
            <option value="deployment">Deployment</option>
            <option value="incident">Incident</option>
            <option value="approval">Approval</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Actions ({actions.length} selected)</Label>
        <div className="flex flex-wrap gap-2">
          {ACTION_OPTIONS.map((a) => {
            const active = actions.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAction(a.id)}
                className={
                  "chip text-xs transition-all " +
                  (active
                    ? "text-white border-cyan-400/60 bg-cyan-400/15 shadow-glow"
                    : "text-slate-300 border-white/10 bg-white/[0.03] hover:border-white/25")
                }
              >
                {active ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
          disabled={busy || !name || !condition || actions.length === 0}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create Rule
        </button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold mb-1.5">
      {children}
    </label>
  );
}
