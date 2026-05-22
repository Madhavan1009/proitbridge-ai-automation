"use client";

import { motion } from "framer-motion";
import {
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  Clock,
  ListChecks,
  ShieldQuestion,
  Sparkles,
  Zap,
} from "lucide-react";
import type { DailySummary } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { HealthBadge } from "./HealthBadge";

export function SummaryCard({
  summary,
  highlight = false,
}: {
  summary: DailySummary;
  highlight?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        "glass-card p-6 " +
        (highlight
          ? "ring-1 ring-cyan-400/30 shadow-[0_0_60px_-20px_rgba(34,211,238,0.45)]"
          : "")
      }
    >
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {highlight && (
              <span className="chip text-cyan-300 border-cyan-300/30 bg-cyan-300/5 text-[10px]">
                <Sparkles className="h-3 w-3" />
                Latest
              </span>
            )}
            <HealthBadge health={summary.overall_health} />
            {summary.zapier_triggered && (
              <span className="chip text-cyan-300 border-cyan-300/30 bg-cyan-300/5 text-[10px]">
                <Zap className="h-3 w-3" />
                Sent to Zapier
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-white leading-snug text-balance">
            {summary.headline}
          </h3>
          <p className="mt-1.5 text-sm text-slate-300/90 leading-relaxed max-w-3xl">
            {summary.summary}
          </p>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-400">
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span title={formatDate(summary.generated_at)}>
              {timeAgo(summary.generated_at)}
            </span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">
            window: last {summary.window_hours}h · {summary.activity_count} events
          </div>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat
          label="HIGH"
          value={summary.risk_breakdown.HIGH || 0}
          tone="text-risk-high"
        />
        <Stat
          label="MED"
          value={summary.risk_breakdown.MEDIUM || 0}
          tone="text-risk-medium"
        />
        <Stat
          label="LOW"
          value={summary.risk_breakdown.LOW || 0}
          tone="text-risk-low"
        />
      </dl>

      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <Block
          icon={<AlertOctagon className="h-3.5 w-3.5 text-risk-high" />}
          title="Top Risks"
          items={summary.top_risks}
          tone="risk"
        />
        <Block
          icon={<ListChecks className="h-3.5 w-3.5 text-risk-medium" />}
          title="Active Blockers"
          items={summary.active_blockers}
          tone="block"
        />
        <Block
          icon={<ShieldQuestion className="h-3.5 w-3.5 text-violet-300" />}
          title="Pending Approvals"
          items={summary.pending_approvals}
          tone="approval"
        />
        <Block
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-risk-low" />}
          title="Completed Work"
          items={summary.completed_work}
          tone="done"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.04] p-4">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-4 w-4 text-cyan-300" />
          <h4 className="text-xs uppercase tracking-[0.18em] text-cyan-200 font-semibold">
            Recommended Focus Today
          </h4>
        </div>
        {summary.recommended_focus.length === 0 ? (
          <p className="text-sm text-slate-400">No specific focus required.</p>
        ) : (
          <ul className="space-y-1.5">
            {summary.recommended_focus.map((f, i) => (
              <li
                key={i}
                className="text-sm text-slate-200 flex items-start gap-2"
              >
                <span className="mt-1.5 h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] py-3">
      <div className={"text-2xl font-bold tabular-nums " + tone}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Block({
  icon,
  title,
  items,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  tone: "risk" | "block" | "approval" | "done";
}) {
  const tones = {
    risk: "border-risk-high/20 bg-risk-high/5",
    block: "border-risk-medium/20 bg-risk-medium/5",
    approval: "border-violet-300/20 bg-violet-300/5",
    done: "border-risk-low/20 bg-risk-low/5",
  };
  return (
    <div className={"rounded-xl border p-3 " + tones[tone]}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-slate-300 font-semibold">
          {title}
        </h4>
        <span className="ml-auto text-[10px] font-mono text-slate-500">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">None.</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 5).map((it, i) => (
            <li
              key={i}
              className="text-xs text-slate-200 leading-relaxed flex items-start gap-2"
            >
              <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
              <span>{it}</span>
            </li>
          ))}
          {items.length > 5 && (
            <li className="text-[11px] text-slate-500 pl-3">
              +{items.length - 5} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
