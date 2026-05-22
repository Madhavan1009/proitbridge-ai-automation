import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse",
        className
      )}
    />
  );
}
