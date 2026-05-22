"use client";

import { Brain, AlertOctagon, ClipboardList } from "lucide-react";
import type { ActivityLog } from "@/lib/types";

export function AIInsights({ activities }: { activities: ActivityLog[] }) {
  const highRisk = activities.filter((a) => a.risk_level === "HIGH").slice(0, 3);
  const blockers = activities
    .flatMap((a) => a.analysis.blockers.map((b) => ({ activity: a, blocker: b })))
    .slice(0, 4);
  const recommended = activities
    .flatMap((a) =>
      a.analysis.recommended_actions.map((action) => ({ activity: a, action }))
    )
    .slice(0, 5);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-gradient grid place-items-center shadow-glow-blue">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              AI Insights
            </h3>
            <p className="text-xs text-slate-400">
              Top-of-stack risks, blockers, and recommended automations
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Column
          title="Top Risks"
          icon={<AlertOctagon className="h-3.5 w-3.5 text-risk-high" />}
          empty="No HIGH-risk events yet."
        >
          {highRisk.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-risk-high/20 bg-risk-high/5 p-3"
            >
              <p className="text-xs text-risk-high font-semibold uppercase tracking-wider">
                {a.event_type.replace("_", " ")}
              </p>
              <p className="mt-1 text-sm text-white leading-snug">{a.title}</p>
            </div>
          ))}
        </Column>

        <Column
          title="Active Blockers"
          icon={
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          }
          empty="No active blockers."
        >
          {blockers.map((b, i) => (
            <div
              key={i}
              className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3"
            >
              <p className="text-sm text-white leading-snug">{b.blocker}</p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {b.activity.repository}
              </p>
            </div>
          ))}
        </Column>

        <Column
          title="Recommended Actions"
          icon={<ClipboardList className="h-3.5 w-3.5 text-cyan-300" />}
          empty="No recommended actions yet."
        >
          {recommended.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3"
            >
              <p className="text-sm text-white leading-snug">{r.action}</p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">
                {r.activity.title}
              </p>
            </div>
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasContent = items.flat().filter(Boolean).length > 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-xs uppercase tracking-[0.16em] text-slate-300 font-semibold">
          {title}
        </h4>
      </div>
      {hasContent ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}
