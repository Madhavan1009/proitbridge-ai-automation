"use client";

import {
  Brain,
  Github,
  Zap,
  Mail,
  Trello,
  Table,
  MessageSquare,
} from "lucide-react";
import { WorkflowFlow } from "@/components/workflows/WorkflowFlow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Section } from "@/components/ui/Section";

const steps = [
  {
    id: 1,
    icon: <Github className="h-4 w-4" />,
    label: "GitHub Trigger",
    body: "A commit, pull request, deployment alert, or incident hits the /api/github-webhook endpoint.",
  },
  {
    id: 2,
    icon: <Brain className="h-4 w-4" />,
    label: "Groq AI Analysis",
    body: "Llama 3.3 70B scores deployment risk, identifies blockers and pending reviews, and recommends concrete operational actions.",
  },
  {
    id: 3,
    icon: <Zap className="h-4 w-4" />,
    label: "Zapier Orchestration",
    body: "Structured JSON is posted to a Zapier Catch Hook. Zapier then fans out to whichever integrations you've connected.",
  },
  {
    id: 4,
    icon: <Mail className="h-4 w-4" />,
    label: "Downstream Automations",
    body: "Gmail alerts, Trello cards, Google Sheets audit logs, Discord/Slack pings — all free-tier.",
  },
];

const integrations = [
  { icon: <Mail className="h-4 w-4" />, label: "Gmail", desc: "Alerts & reminders" },
  { icon: <Trello className="h-4 w-4" />, label: "Trello", desc: "QA & incident cards" },
  { icon: <Table className="h-4 w-4" />, label: "Google Sheets", desc: "Audit log" },
  { icon: <MessageSquare className="h-4 w-4" />, label: "Discord", desc: "On-call pings" },
];

export default function WorkflowsPage() {
  return (
    <Section tone="dark" className="!pt-6 !pb-16">
      <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Workflow Visualizer"
        description="End-to-end flow from GitHub event to multi-channel automation"
      />

      <WorkflowFlow />

      <div className="grid lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <div key={s.id} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-brand-gradient grid place-items-center text-white shadow-glow-blue">
                {s.icon}
              </div>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold">
                Step {s.id}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white">{s.label}</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <SectionHeader
          title="Connected Integrations"
          description="Out-of-the-box Zapier targets — all free-tier"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {integrations.map((i) => (
            <div
              key={i.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-navy-900 border border-white/10 grid place-items-center text-cyan-300">
                {i.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{i.label}</p>
                <p className="text-xs text-slate-400">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <SectionHeader
          title="Example JSON contract"
          description="ProITBridge posts this exact structure to your Zapier webhook"
        />
        <pre className="rounded-xl bg-navy-950/70 border border-white/10 p-4 text-xs text-cyan-100 overflow-auto scrollbar-thin">
{`{
  "activity_id": "act-9f8c4a12bd",
  "event_type": "deployment",
  "title": "Database migration timeout detected",
  "actor": "migration-runner",
  "repository": "engflow/payments-service",
  "risk_level": "HIGH",
  "summary": "Migration exceeded 60s threshold on payment service.",
  "blockers": ["Pending QA approval"],
  "pending_reviews": ["PR #52"],
  "recommended_actions": [
    "Notify DevOps lead",
    "Create QA checklist in Trello",
    "Escalate deployment review"
  ],
  "confidence": 0.92
}`}
        </pre>
      </div>
      </div>
    </Section>
  );
}
