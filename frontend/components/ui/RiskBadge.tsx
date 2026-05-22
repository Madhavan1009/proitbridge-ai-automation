import { cn, riskColor, riskDot } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  return (
    <span className={cn("chip", riskColor[risk], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", riskDot[risk])} />
      <span className="font-semibold tracking-wide">{risk}</span>
    </span>
  );
}
