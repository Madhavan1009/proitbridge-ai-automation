"use client";

import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  User,
  Zap,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";
import type { ActivityLog } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EventChip } from "@/components/ui/EventChip";

export function TimelineEntry({ log }: { log: ActivityLog }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative pl-8"
    >
      <span className="absolute left-2 top-5 h-3 w-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/15 shadow-glow" />
      <span className="absolute left-[14px] top-8 bottom-[-12px] w-px bg-gradient-to-b from-cyan-400/40 to-transparent" />

      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full text-left glass-card p-4 hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-400">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <EventChip type={log.event_type} />
              <RiskBadge risk={log.risk_level} />
              {log.zapier_triggered && (
                <span className="chip text-cyan-300 border-cyan-300/30 bg-cyan-300/5 text-[10px]">
                  <Zap className="h-3 w-3" />
                  Zapier
                </span>
              )}
              <span className="ml-auto text-[11px] text-slate-500" title={formatDate(log.timestamp)}>
                {timeAgo(log.timestamp)}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">{log.title}</p>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <GitBranch className="h-3 w-3" /> {log.repository}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" /> {log.actor}
              </span>
            </div>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="mt-4 ml-7 grid lg:grid-cols-2 gap-4"
          >
            <DetailBlock
              icon={<ClipboardCheck className="h-3.5 w-3.5 text-cyan-300" />}
              title="AI Summary"
            >
              <p className="text-sm text-slate-200 leading-relaxed">
                {log.analysis.summary}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Confidence:{" "}
                <span className="font-mono text-cyan-300">
                  {Math.round((log.analysis.confidence || 0) * 100)}%
                </span>
              </p>
              {log.description && (
                <>
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Description
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {log.description}
                  </p>
                </>
              )}
            </DetailBlock>

            <DetailBlock
              icon={<AlertCircle className="h-3.5 w-3.5 text-amber-300" />}
              title="Blockers & Recommended Actions"
            >
              {log.analysis.blockers.length > 0 && (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Blockers
                  </p>
                  <ul className="mt-1 space-y-1">
                    {log.analysis.blockers.map((b, i) => (
                      <li key={i} className="text-xs text-amber-200">
                        • {b}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {log.analysis.recommended_actions.length > 0 && (
                <>
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Recommended Actions
                  </p>
                  <ul className="mt-1 space-y-1">
                    {log.analysis.recommended_actions.map((a, i) => (
                      <li
                        key={i}
                        className="text-xs text-cyan-100 flex items-start gap-1.5"
                      >
                        <span className="mt-1 h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {log.zapier_response && (
                <p className="mt-3 text-[11px] text-slate-500">
                  Zapier:{" "}
                  <span className="text-slate-300">{log.zapier_response}</span>
                </p>
              )}
            </DetailBlock>
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}

function DetailBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
