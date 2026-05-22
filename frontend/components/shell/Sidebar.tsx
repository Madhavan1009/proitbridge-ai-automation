"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Sliders,
  Activity,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/rules", label: "Automation Rules", icon: Sliders },
  { href: "/summaries", label: "Daily Summaries", icon: CalendarClock },
  { href: "/timeline", label: "Activity Timeline", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-6 px-4 py-6 border-r border-white/[0.08] bg-white/[0.02] backdrop-blur-xl sticky top-0 h-screen">
      <Link href="/" className="block group">
        <div className="relative w-full aspect-[3.6/1] rounded-2xl overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.08] p-2">
          <Image
            src="/proitbridge-logo.png"
            alt="ProITBridge — Strive For Better Future"
            fill
            className="object-contain p-1"
            priority
          />
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-cyan-300/90 text-center font-semibold">
          Engineering Workflow Automation
        </p>
      </Link>

      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <nav className="flex-1 flex flex-col gap-1 px-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("nav-link", active && "nav-link-active")}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2">
        <div className="rounded-2xl bg-white/[0.06] border border-white/[0.14] p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-semibold uppercase tracking-wider">
              Free Tier Stack
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-200/80 leading-relaxed">
            Groq · Zapier · FastAPI on Render · Next.js on Vercel.
          </p>
        </div>
      </div>
    </aside>
  );
}
