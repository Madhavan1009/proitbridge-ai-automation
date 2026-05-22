"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  accent = "brand",
  delta,
  hint,
  tone = "dark",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: "brand" | "cyan" | "high" | "medium" | "low";
  delta?: string;
  hint?: string;
  tone?: "dark" | "light";
}) {
  const accentRing: Record<string, string> = {
    brand: "shadow-glow-blue ring-brand-500/40",
    cyan: "shadow-glow ring-cyan-400/40",
    high: "ring-risk-high/40 shadow-[0_0_25px_-10px_rgba(239,68,68,0.5)]",
    medium: "ring-risk-medium/40 shadow-[0_0_25px_-10px_rgba(245,158,11,0.5)]",
    low: "ring-risk-low/40 shadow-[0_0_25px_-10px_rgba(34,197,94,0.5)]",
  };
  const accentText: Record<string, string> = {
    brand: tone === "light" ? "text-brand-600" : "text-brand-300",
    cyan: tone === "light" ? "text-brand-500" : "text-cyan-300",
    high: "text-risk-high",
    medium: "text-risk-medium",
    low: "text-risk-low",
  };

  const isDark = tone === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(isDark ? "glass-card" : "card-light", "p-5")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-xs uppercase tracking-[0.16em]",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tabular-nums tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {value}
          </p>
          {hint && (
            <p
              className={cn(
                "mt-1 text-xs",
                isDark ? "text-slate-500" : "text-slate-500"
              )}
            >
              {hint}
            </p>
          )}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-xl grid place-items-center ring-1",
            isDark
              ? "bg-white/[0.04] border border-white/10"
              : "bg-brand-500/5 border border-brand-500/15",
            accentRing[accent],
            accentText[accent]
          )}
        >
          {icon}
        </div>
      </div>
      {delta && (
        <div className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400">
          <span className={cn("font-semibold", accentText[accent])}>{delta}</span>
        </div>
      )}
    </motion.div>
  );
}
