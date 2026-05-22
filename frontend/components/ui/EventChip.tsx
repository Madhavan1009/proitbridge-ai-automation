import { cn, eventLabels, eventTone } from "@/lib/utils";
import type { EventType } from "@/lib/types";

export function EventChip({
  type,
  className,
}: {
  type: EventType;
  className?: string;
}) {
  return (
    <span className={cn("chip uppercase tracking-wider text-[10px]", eventTone[type], className)}>
      {eventLabels[type]}
    </span>
  );
}
