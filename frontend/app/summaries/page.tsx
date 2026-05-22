"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  Clock3,
  Loader2,
  PlayCircle,
  RefreshCcw,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DailySummary } from "@/lib/types";
import { Section, SectionHero } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SummaryCard } from "@/components/summaries/SummaryCard";

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [windowHours, setWindowHours] = useState<number>(24);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.listSummaries(30);
      setSummaries(res.summaries);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load summaries."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runNow = async (zapier: boolean) => {
    setRunning(true);
    setError(null);
    try {
      await api.runDailySummary(windowHours, zapier);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run summary.");
    } finally {
      setRunning(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("Clear all summary history? This cannot be undone.")) return;
    try {
      await api.clearSummaries();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear.");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ── LIGHT: how it works ── */}
      <Section tone="light">
        <SectionHero
          tone="light"
          eyebrow={
            <>
              <CalendarClock className="h-3 w-3" />
              Scheduled Automation · Daily Standup
            </>
          }
          title={
            <>
              Roll up engineering activity into a{" "}
              <span className="text-gradient">daily standup digest</span>
            </>
          }
          description="Beyond per-event automation, ProITBridge fires a scheduled job once a day. Groq aggregates the last 24h of commits, PRs, deployments, incidents, and approvals into one executive summary — and Zapier delivers it to your inbox or Slack."
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <FlowStep
            n="1"
            icon={<Clock3 className="h-5 w-5" />}
            title="Schedule"
            body="GitHub Actions cron fires daily at 09:00 IST (configurable) and pings /api/cron/daily-summary."
          />
          <FlowStep
            n="2"
            icon={<Workflow className="h-5 w-5" />}
            title="Aggregate + Analyze"
            body="Backend pulls the last 24h of activity and asks Groq Llama 3.3 70B for a rolled-up standup digest."
          />
          <FlowStep
            n="3"
            icon={<Zap className="h-5 w-5" />}
            title="Deliver"
            body="Structured JSON goes to Zapier → Gmail standup email, Slack standup channel, and a Google Sheets archive."
          />
        </div>
      </Section>

      {/* ── DARK: actions + summary history ── */}
      <Section tone="dark">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">
              Summary History
            </h2>
            <p className="text-sm text-slate-400">
              Latest digest is on top. Stored locally — your team can read them
              here even when the Zapier email has been buried.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold">
              Window
            </label>
            <select
              className="input-base !py-2 !w-auto"
              value={windowHours}
              onChange={(e) => setWindowHours(Number(e.target.value))}
              disabled={running}
            >
              <option value={6}>Last 6h</option>
              <option value={12}>Last 12h</option>
              <option value={24}>Last 24h</option>
              <option value={48}>Last 48h</option>
              <option value={168}>Last 7 days</option>
            </select>
            <button
              className="btn-secondary"
              onClick={() => runNow(false)}
              disabled={running}
              title="Generate a summary without sending to Zapier"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Generate (no Zapier)
            </button>
            <button
              className="btn-primary"
              onClick={() => runNow(true)}
              disabled={running}
              title="Generate and send to Zapier"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Run + Send to Zapier
            </button>
            <button
              className="btn-ghost"
              onClick={refresh}
              disabled={running || loading}
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              className="btn-ghost hover:!text-risk-high"
              onClick={clearAll}
              disabled={running || summaries.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-risk-high/40 bg-risk-high/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : summaries.length === 0 ? (
          <EmptyState
            title="No summaries yet"
            description="Click 'Run + Send to Zapier' to generate the first daily standup digest from your current activity log."
          />
        ) : (
          <div className="space-y-4">
            {summaries.map((s, i) => (
              <SummaryCard key={s.id} summary={s} highlight={i === 0} />
            ))}
          </div>
        )}
      </Section>

      {/* ── LIGHT: setup the GitHub Action ── */}
      <Section tone="light">
        <SectionHero
          tone="light"
          align="center"
          eyebrow={<>Production setup</>}
          title={
            <>
              Wire up the cron in{" "}
              <span className="text-gradient">three steps</span>
            </>
          }
          description="The repo ships a GitHub Actions workflow that pings /api/cron/daily-summary once a day. No Render paid plan required."
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <SetupStep
            n="1"
            title="Set CRON_SECRET on Render"
            body="In your Render service env vars, add CRON_SECRET=<any-random-string>. This locks down the cron endpoint."
          />
          <SetupStep
            n="2"
            title="Add GitHub secrets"
            body="In your GitHub repo settings → Secrets and variables → Actions, add BACKEND_URL (your Render URL) and CRON_SECRET (same value)."
          />
          <SetupStep
            n="3"
            title="Enable the workflow"
            body=".github/workflows/daily-summary.yml fires at 03:30 UTC / 09:00 IST. Adjust the cron schedule and you're live."
          />
        </div>
      </Section>
    </div>
  );
}

function FlowStep({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card-light p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-blue font-bold">
          {n}
        </span>
        <span className="text-brand-600">{icon}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}

function SetupStep({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card-light p-5">
      <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-brand-600">
        Step {n}
      </span>
      <h3 className="mt-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
