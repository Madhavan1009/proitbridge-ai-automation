"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { eventLabels } from "@/lib/utils";
import type { EventType } from "@/lib/types";

const PALETTE: Record<string, string> = {
  commit: "#22d3ee",
  pull_request: "#046bd2",
  deployment: "#f59e0b",
  incident: "#ef4444",
  approval: "#a78bfa",
  webhook: "#64748b",
};

export function EventBreakdown({
  breakdown,
  tone = "dark",
}: {
  breakdown: Record<string, number>;
  tone?: "dark" | "light";
}) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: eventLabels[k as EventType] || k,
      key: k,
      value: v,
    }));

  const total = data.reduce((s, d) => s + d.value, 0);
  const isDark = tone === "dark";

  return (
    <div className={isDark ? "glass-card p-6" : "card-light p-6"}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className={
              "text-base font-semibold tracking-tight " +
              (isDark ? "text-white" : "text-slate-900")
            }
          >
            Event Mix
          </h3>
          <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>
            Breakdown of ingested engineering events
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div
          className={
            "h-56 grid place-items-center text-sm " +
            (isDark ? "text-slate-500" : "text-slate-400")
          }
        >
          No events yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: isDark
                      ? "rgba(11, 29, 63, 0.95)"
                      : "rgba(255,255,255,0.98)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 12,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: 12,
                  }}
                />
                <Pie
                  data={data}
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke={isDark ? "rgba(7,22,51,1)" : "#ffffff"}
                  strokeWidth={2}
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={PALETTE[d.key] || "#64748b"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className={
                  "text-2xl font-bold tabular-nums " +
                  (isDark ? "text-white" : "text-slate-900")
                }
              >
                {total}
              </span>
              <span
                className={
                  "text-[10px] uppercase tracking-wider " +
                  (isDark ? "text-slate-500" : "text-slate-500")
                }
              >
                events
              </span>
            </div>
          </div>
          <ul className="space-y-2">
            {data.map((d) => (
              <li
                key={d.key}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span
                  className={
                    "inline-flex items-center gap-2 " +
                    (isDark ? "text-slate-300" : "text-slate-700")
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PALETTE[d.key] }}
                  />
                  {d.name}
                </span>
                <span
                  className={
                    "font-mono tabular-nums " +
                    (isDark ? "text-slate-400" : "text-slate-500")
                  }
                >
                  {d.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
