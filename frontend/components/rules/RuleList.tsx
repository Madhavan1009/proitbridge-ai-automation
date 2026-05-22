"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import type { AutomationRule } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EventChip } from "@/components/ui/EventChip";

const ACTION_LABEL: Record<string, string> = {
  notify_devops: "Notify DevOps",
  notify_oncall: "Page On-Call",
  create_trello_task: "Trello Task",
  gmail_reminder: "Gmail Reminder",
  log_sheet: "Sheets Log",
  discord_alert: "Discord Alert",
  escalate_review: "Escalate Review",
};

export function RuleList({
  rules,
  onToggle,
  onDelete,
  busyId,
}: {
  rules: AutomationRule[];
  onToggle: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
}) {
  if (rules.length === 0) {
    return (
      <div className="glass-card p-10 text-center text-sm text-slate-400">
        No automation rules yet. Create one above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {rules.map((rule) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-white">
                    {rule.name}
                  </h3>
                  {rule.risk_filter && <RiskBadge risk={rule.risk_filter} />}
                  {rule.event_filter && <EventChip type={rule.event_filter} />}
                  <span
                    className={
                      "chip text-[10px] " +
                      (rule.enabled
                        ? "text-risk-low border-risk-low/30 bg-risk-low/10"
                        : "text-slate-400 border-white/10 bg-white/[0.03]")
                    }
                  >
                    {rule.enabled ? "ENABLED" : "PAUSED"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {rule.condition}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rule.actions.map((a) => (
                    <span
                      key={a}
                      className="chip text-[10px] text-cyan-200 border-cyan-300/25 bg-cyan-300/5"
                    >
                      {ACTION_LABEL[a] || a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="btn-ghost"
                  onClick={() => onToggle(rule)}
                  title={rule.enabled ? "Pause rule" : "Enable rule"}
                  disabled={busyId === rule.id}
                >
                  {busyId === rule.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : rule.enabled ? (
                    <Power className="h-4 w-4 text-risk-low" />
                  ) : (
                    <PowerOff className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <button
                  className="btn-ghost hover:!text-risk-high"
                  onClick={() => rule.id && onDelete(rule.id)}
                  title="Delete rule"
                  disabled={busyId === rule.id}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
