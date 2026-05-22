import { cn } from "@/lib/utils";
import type { HealthLevel } from "@/lib/types";

const STYLES: Record<HealthLevel, string> = {
  GREEN: "text-risk-low border-risk-low/40 bg-risk-low/10",
  YELLOW: "text-risk-medium border-risk-medium/40 bg-risk-medium/10",
  RED: "text-risk-high border-risk-high/40 bg-risk-high/10",
};

const DOTS: Record<HealthLevel, string> = {
  GREEN: "bg-risk-low shadow-[0_0_12px_-2px_rgba(34,197,94,0.8)]",
  YELLOW: "bg-risk-medium shadow-[0_0_12px_-2px_rgba(245,158,11,0.8)]",
  RED: "bg-risk-high shadow-[0_0_12px_-2px_rgba(239,68,68,0.8)]",
};

const LABELS: Record<HealthLevel, string> = {
  GREEN: "Healthy",
  YELLOW: "Watch",
  RED: "At Risk",
};

export function HealthBadge({
  health,
  className,
}: {
  health: HealthLevel;
  className?: string;
}) {
  return (
    <span className={cn("chip", STYLES[health], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[health])} />
      <span className="font-semibold tracking-wide">
        {health} · {LABELS[health]}
      </span>
    </span>
  );
}
