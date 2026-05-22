import type { EventType, RiskLevel } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export const riskColor: Record<RiskLevel, string> = {
  HIGH: "text-risk-high border-risk-high/40 bg-risk-high/10",
  MEDIUM: "text-risk-medium border-risk-medium/40 bg-risk-medium/10",
  LOW: "text-risk-low border-risk-low/40 bg-risk-low/10",
};

export const riskDot: Record<RiskLevel, string> = {
  HIGH: "bg-risk-high shadow-[0_0_12px_-2px_rgba(239,68,68,0.8)]",
  MEDIUM: "bg-risk-medium shadow-[0_0_12px_-2px_rgba(245,158,11,0.8)]",
  LOW: "bg-risk-low shadow-[0_0_12px_-2px_rgba(34,197,94,0.8)]",
};

export const eventLabels: Record<EventType, string> = {
  commit: "Commit",
  pull_request: "Pull Request",
  deployment: "Deployment",
  incident: "Incident",
  approval: "Approval",
  webhook: "Webhook",
};

export const eventTone: Record<EventType, string> = {
  commit: "text-cyan-300 border-cyan-300/30 bg-cyan-300/5",
  pull_request: "text-brand-300 border-brand-300/30 bg-brand-300/5",
  deployment: "text-amber-300 border-amber-300/30 bg-amber-300/5",
  incident: "text-rose-300 border-rose-300/30 bg-rose-300/5",
  approval: "text-violet-300 border-violet-300/30 bg-violet-300/5",
  webhook: "text-slate-300 border-slate-300/30 bg-slate-300/5",
};
