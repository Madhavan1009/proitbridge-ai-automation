import { Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card p-10 text-center">
      <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl bg-brand-gradient shadow-glow">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-md mx-auto text-sm text-slate-400">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
