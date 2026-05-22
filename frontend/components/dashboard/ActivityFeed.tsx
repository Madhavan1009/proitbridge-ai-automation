"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, GitBranch, User } from "lucide-react";
import type { ActivityLog } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EventChip } from "@/components/ui/EventChip";

export function ActivityFeed({ activities }: { activities: ActivityLog[] }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Recent Activity
          </h3>
          <p className="text-xs text-slate-400">
            Most recent events analyzed by ProITBridge AI
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          live feed
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-10">
          No activity yet. Trigger a simulation to see events stream in.
        </div>
      ) : (
        <ul className="space-y-3 scrollbar-thin max-h-[520px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {activities.map((a) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EventChip type={a.event_type} />
                      <RiskBadge risk={a.risk_level} />
                      {a.zapier_triggered && (
                        <span className="chip text-cyan-300 border-cyan-300/30 bg-cyan-300/5 text-[10px]">
                          <Zap className="h-3 w-3" />
                          Zapier
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-white leading-snug">
                      {a.title}
                    </p>
                    {a.analysis.summary && (
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {a.analysis.summary}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> {a.repository}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> {a.actor}
                      </span>
                      <span className="ml-auto">{timeAgo(a.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
