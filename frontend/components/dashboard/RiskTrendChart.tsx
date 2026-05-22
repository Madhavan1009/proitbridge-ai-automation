"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  date: string;
  high: number;
  medium: number;
  low: number;
  total: number;
};

export function RiskTrendChart({
  data,
  tone = "dark",
}: {
  data: TrendPoint[];
  tone?: "dark" | "light";
}) {
  const friendly = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  const isDark = tone === "dark";
  const axisColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.5)";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)";
  const tooltipBg = isDark ? "rgba(11, 29, 63, 0.95)" : "rgba(255,255,255,0.98)";
  const tooltipBorder = isDark
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(15,23,42,0.08)";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

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
            7-Day Risk Trend
          </h3>
          <p className={"text-xs " + (isDark ? "text-slate-400" : "text-slate-500")}>
            Activity volume by AI-determined risk level
          </p>
        </div>
        <div className="flex gap-3 text-[10px] uppercase tracking-wider">
          <Legend color="#ef4444" label="High" />
          <Legend color="#f59e0b" label="Medium" />
          <Legend color="#22c55e" label="Low" />
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={friendly}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="grad-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-medium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={axisColor}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              stroke={axisColor}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: tooltipBg,
                border: tooltipBorder,
                borderRadius: 12,
                color: tooltipText,
                fontSize: 12,
              }}
              cursor={{ stroke: "rgba(4, 107, 210, 0.3)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#grad-low)"
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#grad-medium)"
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#grad-high)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="opacity-70">{label}</span>
    </span>
  );
}
