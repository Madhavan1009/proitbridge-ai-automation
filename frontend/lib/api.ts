import type {
  ActivityLog,
  AnalysisResult,
  AutomationRule,
  DailySummary,
  DashboardStats,
  SimulationScenario,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  baseUrl: BASE_URL,

  health: () => request<{ status: string; env: string }>("/api/health"),

  dashboard: () => request<DashboardStats & {
    integrations: { groq_configured: boolean; zapier_configured: boolean };
  }>("/api/dashboard"),

  logs: (params?: { limit?: number; risk?: string; event_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.risk) q.set("risk", params.risk);
    if (params?.event_type) q.set("event_type", params.event_type);
    const suffix = q.toString() ? `?${q}` : "";
    return request<{ count: number; logs: ActivityLog[] }>(`/api/logs${suffix}`);
  },

  clearLogs: () => request<{ status: string }>("/api/logs", { method: "DELETE" }),

  analyze: (body: {
    title: string;
    description?: string;
    event_type?: string;
  }) =>
    request<AnalysisResult>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  simulate: (scenario: SimulationScenario) =>
    request<{ status: string; scenario: string; activity: ActivityLog }>(
      "/api/simulate",
      { method: "POST", body: JSON.stringify({ scenario }) }
    ),

  simulateRandom: () =>
    request<{ status: string; activity: ActivityLog }>("/api/simulate/random", {
      method: "POST",
    }),

  simulateSeed: () =>
    request<{ status: string; seeded?: number; existing?: number }>(
      "/api/simulate/seed",
      { method: "POST" }
    ),

  webhook: (body: {
    event_type?: string;
    title: string;
    description?: string;
    actor?: string;
    repository?: string;
    branch?: string;
  }) =>
    request<{ status: string; activity: ActivityLog }>(
      "/api/github-webhook",
      { method: "POST", body: JSON.stringify(body) }
    ),

  rules: () =>
    request<{ count: number; rules: AutomationRule[] }>("/api/rules"),

  createRule: (rule: AutomationRule) =>
    request<{ status: string; rule: AutomationRule }>("/api/rules", {
      method: "POST",
      body: JSON.stringify(rule),
    }),

  updateRule: (id: string, rule: AutomationRule) =>
    request<{ status: string; rule: AutomationRule }>(`/api/rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(rule),
    }),

  deleteRule: (id: string) =>
    request<{ status: string; deleted: string }>(`/api/rules/${id}`, {
      method: "DELETE",
    }),

  runDailySummary: (windowHours = 24, triggerZapier = true) =>
    request<DailySummary>("/api/daily-summary", {
      method: "POST",
      body: JSON.stringify({
        window_hours: windowHours,
        trigger_zapier: triggerZapier,
      }),
    }),

  listSummaries: (limit = 30) =>
    request<{ count: number; summaries: DailySummary[] }>(
      `/api/summaries?limit=${limit}`
    ),

  latestSummary: () =>
    request<{ summary: DailySummary | null }>("/api/summaries/latest"),

  clearSummaries: () =>
    request<{ status: string }>("/api/summaries", { method: "DELETE" }),
};
