"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  GitPullRequest,
  Siren,
  CheckSquare,
  GitCommit,
  Shuffle,
  Database,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { SimulationScenario } from "@/lib/types";
import { RiskBadge } from "@/components/ui/RiskBadge";

type Scenario = {
  id: SimulationScenario;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

const scenarios: Scenario[] = [
  {
    id: "deployment_failure",
    label: "Deployment Failure",
    description: "Failed staging deploy with migration timeout",
    icon: AlertTriangle,
    accent: "text-risk-high bg-risk-high/10 border-risk-high/30",
  },
  {
    id: "high_risk_pr",
    label: "High-Risk PR",
    description: "Pull request touching payment schema",
    icon: GitPullRequest,
    accent: "text-amber-300 bg-amber-300/10 border-amber-300/30",
  },
  {
    id: "production_incident",
    label: "Production Incident",
    description: "Live service returning invalid responses",
    icon: Siren,
    accent: "text-risk-high bg-risk-high/10 border-risk-high/30",
  },
  {
    id: "pending_approval",
    label: "Pending Approval",
    description: "Release awaiting manager sign-off",
    icon: CheckSquare,
    accent: "text-violet-300 bg-violet-300/10 border-violet-300/30",
  },
  {
    id: "routine_commit",
    label: "Routine Commit",
    description: "Low-risk documentation update",
    icon: GitCommit,
    accent: "text-risk-low bg-risk-low/10 border-risk-low/30",
  },
];

export function SimulationPanel({
  onSimulated,
}: {
  onSimulated?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<{
    title: string;
    risk: "HIGH" | "MEDIUM" | "LOW";
    summary: string;
    actions: string[];
    zapier: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (id: SimulationScenario | "random" | "seed") => {
    setError(null);
    setBusy(id);
    try {
      let activity;
      if (id === "random") {
        const res = await api.simulateRandom();
        activity = res.activity;
      } else if (id === "seed") {
        await api.simulateSeed();
        onSimulated?.();
        setBusy(null);
        return;
      } else {
        const res = await api.simulate(id);
        activity = res.activity;
      }
      setLast({
        title: activity.title,
        risk: activity.risk_level,
        summary: activity.analysis.summary,
        actions: activity.analysis.recommended_actions,
        zapier: activity.zapier_triggered,
      });
      onSimulated?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Simulation failed — is the backend running?"
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 font-semibold">
              Simulation Mode
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white tracking-tight">
            Trigger engineering events
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            Fire realistic GitHub-style events through the full Groq AI + Zapier
            pipeline. No real integrations required.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="btn-secondary"
            onClick={() => run("random")}
            disabled={!!busy}
          >
            {busy === "random" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            Random
          </button>
          <button
            className="btn-secondary"
            onClick={() => run("seed")}
            disabled={!!busy}
            title="Seed activity log if it's empty (one-shot)"
          >
            {busy === "seed" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Seed Demo
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {scenarios.map((s) => {
          const isBusy = busy === s.id;
          return (
            <motion.button
              key={s.id}
              whileHover={{ y: -2 }}
              onClick={() => run(s.id)}
              disabled={!!busy}
              className="text-left rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 p-4 transition-all disabled:opacity-50"
            >
              <div
                className={
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border " +
                  s.accent
                }
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-white">{s.label}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {s.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-risk-high/40 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">
          {error}
        </div>
      )}

      {last && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-2xl border border-white/[0.08] bg-navy-900/40 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <RiskBadge risk={last.risk} />
                <span
                  className={
                    "chip text-[10px] " +
                    (last.zapier
                      ? "text-cyan-300 border-cyan-300/30 bg-cyan-300/5"
                      : "text-slate-400 border-slate-400/30 bg-slate-400/5")
                  }
                >
                  {last.zapier ? "Zapier triggered" : "Below threshold"}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-white">{last.title}</p>
              <p className="mt-1 text-xs text-slate-400">{last.summary}</p>
            </div>
          </div>
          {last.actions.length > 0 && (
            <ul className="mt-3 grid sm:grid-cols-2 gap-1.5">
              {last.actions.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-300"
                >
                  <span className="mt-1 h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}
