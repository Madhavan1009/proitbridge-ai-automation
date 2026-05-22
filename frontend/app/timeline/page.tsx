"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ActivityLog, EventType, RiskLevel } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TimelineEntry } from "@/components/timeline/TimelineEntry";

export default function TimelinePage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskLevel | "">("");
  const [event, setEvent] = useState<EventType | "">("");

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.logs({
        limit: 200,
        risk: risk || undefined,
        event_type: event || undefined,
      });
      setLogs(data.logs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load timeline.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [risk, event]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    logs.forEach((log) => {
      const day = new Date(log.timestamp).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const list = map.get(day) || [];
      list.push(log);
      map.set(day, list);
    });
    return Array.from(map.entries());
  }, [logs]);

  const clear = async () => {
    if (!confirm("Clear all activity logs? This cannot be undone.")) return;
    try {
      await api.clearLogs();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear logs.");
    }
  };

  return (
    <Section tone="dark" className="!pt-6 !pb-16">
      <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Activity Timeline"
        description="Webhook events, AI analyses, and triggered automations — newest first"
        action={
          <div className="flex items-center gap-2">
            <select
              className="input-base !py-2 !w-auto"
              value={risk}
              onChange={(e) => setRisk(e.target.value as RiskLevel | "")}
            >
              <option value="">All risks</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select
              className="input-base !py-2 !w-auto"
              value={event}
              onChange={(e) => setEvent(e.target.value as EventType | "")}
            >
              <option value="">All events</option>
              <option value="commit">Commits</option>
              <option value="pull_request">PRs</option>
              <option value="deployment">Deployments</option>
              <option value="incident">Incidents</option>
              <option value="approval">Approvals</option>
            </select>
            <button className="btn-secondary" onClick={load} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
            <button className="btn-ghost hover:!text-risk-high" onClick={clear}>
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-2xl border border-risk-high/40 bg-risk-high/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Trigger a simulation from the dashboard or send a real GitHub webhook to /api/github-webhook."
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-3 pl-8">
                {day}
              </h2>
              <div className="space-y-3">
                {items.map((log) => (
                  <TimelineEntry key={log.id} log={log} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </div>
    </Section>
  );
}
