"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cpu, Plug, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

const titles: Record<string, { title: string; sub: string }> = {
  "/": {
    title: "Operations Dashboard",
    sub: "AI-driven engineering workflow automation overview",
  },
  "/workflows": {
    title: "Workflow Visualizer",
    sub: "From GitHub trigger to Zapier fan-out",
  },
  "/rules": {
    title: "Automation Rules",
    sub: "Define how ProITBridge AI responds to engineering signals",
  },
  "/summaries": {
    title: "Daily Engineering Summaries",
    sub: "Scheduled AI standup digests rolled up across all activity",
  },
  "/timeline": {
    title: "Activity Timeline",
    sub: "Webhook events, AI analyses, and triggered automations",
  },
};

type Health = {
  groq: boolean;
  zapier: boolean;
  online: boolean;
};

export function Topbar() {
  const pathname = usePathname();
  const meta = titles[pathname] || titles["/"];
  const [health, setHealth] = useState<Health>({
    groq: false,
    zapier: false,
    online: false,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .dashboard()
      .then((data) => {
        if (cancelled) return;
        setHealth({
          groq: data.integrations.groq_configured,
          zapier: data.integrations.zapier_configured,
          online: true,
        });
      })
      .catch(() => {
        if (!cancelled) setHealth({ groq: false, zapier: false, online: false });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-navy-950/60 border-b border-white/[0.05]">
      <div className="px-6 lg:px-10 py-4 flex items-center gap-4 max-w-[1600px] w-full mx-auto">
        <Link href="/" className="lg:hidden flex items-center">
          <div className="relative h-10 w-36">
            <Image
              src="/proitbridge-logo.png"
              alt="ProITBridge"
              fill
              className="object-contain object-left"
            />
          </div>
        </Link>

        <div className="hidden lg:block min-w-0">
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {meta.title}
          </h1>
          <p className="text-sm text-slate-400">{meta.sub}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <HealthChip
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="API"
            ok={health.online}
          />
          <HealthChip
            icon={<Cpu className="h-3.5 w-3.5" />}
            label="Groq"
            ok={health.groq}
            fallbackLabel="heuristic"
          />
          <HealthChip
            icon={<Plug className="h-3.5 w-3.5" />}
            label="Zapier"
            ok={health.zapier}
            fallbackLabel="local"
          />
        </div>
      </div>
    </header>
  );
}

function HealthChip({
  icon,
  label,
  ok,
  fallbackLabel,
}: {
  icon: React.ReactNode;
  label: string;
  ok: boolean;
  fallbackLabel?: string;
}) {
  return (
    <div
      className={
        "chip " +
        (ok
          ? "text-risk-low border-risk-low/30 bg-risk-low/10"
          : "text-amber-300 border-amber-300/30 bg-amber-300/5")
      }
      title={ok ? `${label} connected` : `${label} not configured`}
    >
      {icon}
      <span>{label}</span>
      <span className="opacity-60">·</span>
      <span className="font-mono text-[10px]">
        {ok ? "live" : fallbackLabel || "off"}
      </span>
    </div>
  );
}
