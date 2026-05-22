"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Github,
  Layers,
  ListChecks,
  Plug,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { Section, SectionHero } from "@/components/ui/Section";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { SimulationPanel } from "@/components/dashboard/SimulationPanel";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EventBreakdown } from "@/components/dashboard/EventBreakdown";
import { AIInsights } from "@/components/dashboard/AIInsights";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const stats = await api.dashboard();
      setData(stats);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Could not reach backend at ${api.baseUrl}. Start it with: uvicorn main:app --reload`
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="animate-fade-in">
      {/* ────────── 1. HERO (DARK) ────────── */}
      <Hero />

      {error && (
        <Section tone="dark" className="!py-6">
          <div className="rounded-2xl border border-risk-medium/40 bg-risk-medium/10 p-4 text-sm text-amber-200">
            <span className="font-semibold">Backend unreachable.</span>{" "}
            <span className="opacity-80">{error}</span>
          </div>
        </Section>
      )}

      {/* ────────── 2. LIVE METRICS (LIGHT) ────────── */}
      <Section tone="light">
        <SectionHero
          tone="light"
          eyebrow={
            <>
              <Activity className="h-3 w-3" />
              Live Engineering Telemetry
            </>
          }
          title={
            <>
              Real-time operational metrics —{" "}
              <span className="text-gradient">at a glance</span>
            </>
          }
          description="Every webhook, simulation, and incident flows into a single AI-analyzed feed. The platform tracks risk, blockers, and triggered automations across all your engineering activity."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !data ? (
            <>
              <Skeleton className="h-28 !bg-slate-200/60" />
              <Skeleton className="h-28 !bg-slate-200/60" />
              <Skeleton className="h-28 !bg-slate-200/60" />
              <Skeleton className="h-28 !bg-slate-200/60" />
            </>
          ) : (
            <>
              <StatCard
                tone="light"
                label="Total Events"
                value={data.total_activities}
                icon={<Activity className="h-5 w-5" />}
                accent="cyan"
                hint="All-time ingested"
              />
              <StatCard
                tone="light"
                label="High-Risk Events"
                value={data.high_risk_count}
                icon={<AlertTriangle className="h-5 w-5" />}
                accent="high"
                hint="Require manual review"
              />
              <StatCard
                tone="light"
                label="Automations Triggered"
                value={data.automations_triggered}
                icon={<Zap className="h-5 w-5" />}
                accent="brand"
                hint="Sent to Zapier"
              />
              <StatCard
                tone="light"
                label="Active Blockers"
                value={data.active_blockers}
                icon={<ListChecks className="h-5 w-5" />}
                accent="medium"
                hint="Pending across all events"
              />
            </>
          )}
        </div>
      </Section>

      {/* ────────── 3. SIMULATION (DARK) ────────── */}
      <Section tone="dark">
        <SectionHero
          eyebrow={
            <>
              <Sparkles className="h-3 w-3" />
              Simulation Mode
            </>
          }
          title={
            <>
              Trigger an engineering event —{" "}
              <span className="text-gradient">see AI + Zapier respond</span>
            </>
          }
          description="No GitHub repository, Zapier account, or production system required. Fire realistic events through the full AI analysis + automation pipeline in a single click."
        />

        <SimulationPanel onSimulated={refresh} />
      </Section>

      {/* ────────── 4. ANALYTICS (LIGHT) ────────── */}
      <Section tone="light">
        <SectionHero
          tone="light"
          eyebrow={
            <>
              <Layers className="h-3 w-3" />
              Risk & Volume Analytics
            </>
          }
          title={
            <>
              Trend insights powered by{" "}
              <span className="text-gradient">Groq AI</span>
            </>
          }
          description="Llama 3.3 70B scores every event for deployment risk, surface area, and operational urgency. Watch the rhythm of your engineering org in real time."
        />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loading || !data ? (
              <Skeleton className="h-80 !bg-slate-200/60" />
            ) : (
              <RiskTrendChart data={data.risk_trend} tone="light" />
            )}
          </div>
          <div>
            {loading || !data ? (
              <Skeleton className="h-80 !bg-slate-200/60" />
            ) : (
              <EventBreakdown breakdown={data.event_breakdown} tone="light" />
            )}
          </div>
        </div>
      </Section>

      {/* ────────── 5. AI INSIGHTS + FEED (DARK) ────────── */}
      <Section tone="dark">
        <SectionHero
          eyebrow={
            <>
              <Brain className="h-3 w-3" />
              AI-Driven Operational Intelligence
            </>
          }
          title={
            <>
              What needs attention,{" "}
              <span className="text-gradient">right now</span>
            </>
          }
          description="ProITBridge surfaces the highest-risk events, active blockers, and concrete next-steps so your team spends time fixing problems — not finding them."
        />

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loading || !data ? (
              <Skeleton className="h-96" />
            ) : (
              <AIInsights activities={data.recent_activities} />
            )}
          </div>
          <div>
            {loading || !data ? (
              <Skeleton className="h-96" />
            ) : (
              <ActivityFeed activities={data.recent_activities} />
            )}
          </div>
        </div>
      </Section>

      {/* ────────── 6. HOW IT WORKS (LIGHT) ────────── */}
      <HowItWorks />

      {/* ────────── 7. CTA / BRAND BAND (DARK) ────────── */}
      <BrandCTA />
    </div>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-cyan-400/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-[1500px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="section-eyebrow-dark">
                <Sparkles className="h-3 w-3" />
                Strive For Better Future
              </p>
              <h1 className="mt-4 text-4xl lg:text-6xl font-bold tracking-tight text-white text-balance leading-[1.05]">
                Want to <span className="text-white">automate</span>{" "}
                <span className="block text-gradient">
                  Your Engineering Operations
                </span>
                with AI + Zapier?
              </h1>
              <p className="mt-5 text-base lg:text-lg text-slate-300/90 leading-relaxed max-w-2xl">
                ProITBridge ingests GitHub commits, pull requests, deployment
                alerts, and production incidents — then orchestrates Gmail,
                Trello, Google Sheets, and Discord through Zapier in real time.
                One platform, end-to-end engineering workflow automation.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="#simulation"
                  className="btn-primary !px-5 !py-3 text-base"
                >
                  Try a Simulation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/workflows"
                  className="btn-secondary !px-5 !py-3 text-base"
                >
                  <Workflow className="h-4 w-4" />
                  See the Workflow
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <HeroBadge
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  label="100% Free Tier"
                />
                <HeroBadge
                  icon={<Cpu className="h-3.5 w-3.5" />}
                  label="Groq · Llama 3.3 70B"
                />
                <HeroBadge
                  icon={<Plug className="h-3.5 w-3.5" />}
                  label="Zapier orchestrator"
                />
                <HeroBadge
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  label="Realtime risk scoring"
                />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="chip text-slate-100 border-white/20 bg-white/[0.06] backdrop-blur">
      <span className="text-cyan-300">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-brand-gradient opacity-30 blur-2xl rounded-3xl" />
      <div className="relative rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="relative h-12 w-44">
            <Image
              src="/proitbridge-logo.png"
              alt="ProITBridge"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="chip text-cyan-300 border-cyan-300/30 bg-cyan-300/10 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LIVE
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <FlowRow
            icon={<Github className="h-3.5 w-3.5" />}
            label="GitHub webhook"
            value="payment-service · main"
            accent="text-cyan-300"
          />
          <FlowArrow />
          <FlowRow
            icon={<Brain className="h-3.5 w-3.5" />}
            label="Groq AI analysis"
            value="risk: HIGH · confidence 0.92"
            accent="text-brand-300"
            highlight
          />
          <FlowArrow />
          <FlowRow
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Zapier orchestrator"
            value="→ Gmail · Trello · Sheets"
            accent="text-amber-300"
          />
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Latency p95</span>
          <span className="font-mono text-cyan-300">1.4s end-to-end</span>
        </div>
      </div>
    </div>
  );
}

function FlowRow({
  icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border px-3 py-2.5 flex items-center gap-3 " +
        (highlight
          ? "border-cyan-400/40 bg-cyan-400/5 shadow-glow"
          : "border-white/10 bg-white/[0.03]")
      }
    >
      <span className={"shrink-0 " + accent}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-sm text-white font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center">
      <div className="h-4 w-px bg-gradient-to-b from-cyan-400/60 to-brand-500/60" />
    </div>
  );
}

/* ─────────────────── HOW IT WORKS ─────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: <Github className="h-5 w-5" />,
      title: "1 · Capture",
      body: "Receive a GitHub webhook, deployment alert, incident report, or simulated event via /api/github-webhook.",
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: "2 · Analyze",
      body: "Groq runs Llama 3.3 70B to assess operational risk, surface blockers, and recommend concrete actions.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "3 · Orchestrate",
      body: "Structured JSON is posted to your Zapier Catch Hook. Zapier fans it out to whichever tools you've connected.",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "4 · Audit",
      body: "Every event lands in the activity timeline with full AI context, recommended actions, and Zapier response.",
    },
  ];

  return (
    <Section tone="light">
      <SectionHero
        tone="light"
        align="center"
        eyebrow={
          <>
            <Workflow className="h-3 w-3" />
            How It Works
          </>
        }
        title={
          <>
            From engineering signal to{" "}
            <span className="text-gradient">automated action</span> in seconds
          </>
        }
        description="Four steps. No queues, no Kubernetes, no microservices. ProITBridge is intentionally simple — built on a 100% free-tier stack so you can fork, deploy, and own it."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card-light p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-glow-blue">
              {s.icon}
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              {s.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {s.body}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="text-slate-500">Powered by</span>
        {[
          "Groq",
          "Zapier",
          "FastAPI",
          "Next.js",
          "Vercel",
          "Render",
          "Tailwind",
        ].map((t) => (
          <span
            key={t}
            className="chip text-slate-700 border-slate-300 bg-white"
          >
            {t}
          </span>
        ))}
      </div>
    </Section>
  );
}

/* ─────────────────── BRAND CTA ─────────────────── */

function BrandCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
      <div className="absolute inset-0 -z-10 bg-brand-radial" />
      <div className="px-6 lg:px-10 py-14 lg:py-20 max-w-[1500px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <p className="section-eyebrow-dark">
              <Sparkles className="h-3 w-3" />
              Built by ProITBridge
            </p>
            <h2 className="mt-4 text-3xl lg:text-5xl font-bold tracking-tight text-white text-balance leading-tight">
              Strive For{" "}
              <span className="text-gradient">Better Future</span>
            </h2>
            <p className="mt-4 text-base text-slate-300/90 max-w-2xl leading-relaxed">
              ProITBridge partners with engineering teams to deliver
              AI-augmented operations, data science consulting, and elite
              workflow automation. This dashboard is one piece of that vision —
              fork it, extend it, ship it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workflows" className="btn-primary">
                <Workflow className="h-4 w-4" />
                Explore the Workflow
              </Link>
              <Link href="/rules" className="btn-secondary">
                <Plug className="h-4 w-4" />
                Configure Automation Rules
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-6">
              <div className="relative h-16 w-full">
                <Image
                  src="/proitbridge-logo.png"
                  alt="ProITBridge"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                The platform is{" "}
                <span className="text-cyan-300 font-semibold">
                  fully open & free-tier
                </span>
                . Bring your own Groq key and Zapier hook, deploy to Vercel +
                Render, and you're live in under 10 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
