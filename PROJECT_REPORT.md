# ProITBridge — Project Report

**AI Engineering Workflow Automation Assistant**
Built by: Madhavan A
Repo: <https://github.com/Madhavan1009/proitbridge-ai-automation>
Live: <https://proitbridge-ai-automation.vercel.app>
Backend: <https://proitbridge-backend.onrender.com>

---

## 1. Problem statement

Engineering teams lose hours every week on **manual operational work** that
sits between writing code and shipping it:

| Manual task | Time cost / week |
| --- | --- |
| Checking GitHub commits for risky changes | 3–5 hrs |
| Reviewing deployments for QA gates | 2–4 hrs |
| Writing daily standup updates | 30 min/dev × team size |
| Tracking blockers across PRs | 2 hrs |
| Chasing pending approvals | 1–2 hrs |
| Sending escalation reminders | 1 hr |

These activities are **repetitive, rule-driven, and prone to being missed**.
A risky payment-schema PR sitting unreviewed for 3 days, or a failed
staging deploy nobody acted on, is exactly the kind of operational debt
that compounds.

---

## 2. Before vs After

| Scenario | Before ProITBridge | After ProITBridge |
| --- | --- | --- |
| Risky PR pushed (e.g. "Modified payment database schema") | Sits in queue until someone notices in standup the next day | AI flags HIGH risk **in <5 seconds**, Gmail/Slack alert to DevOps + Trello QA card auto-created |
| Failed deployment in staging | DevOps engineer checks CI dashboard manually | Auto-detected, on-call paged via Discord, incident card opened in Trello |
| Daily engineering standup | EM spends 20 min compiling commits, PRs, blockers | Cron job at 09:00 IST generates standup digest (5 risks, 4 blockers, 3 recommended actions) and emails the team |
| Pending PR approvals | Need to chase reviewers manually | Filter rule auto-sends Gmail reminder when PR is pending >24h |
| Audit log of incidents | Spreadsheet maintained by hand | Every event auto-logged to Google Sheets with AI summary |

**Bottom line:** ~10 hrs/week of operational toil removed per team of 5
engineers, with zero infrastructure beyond free-tier SaaS.

---

## 3. Tech stack — what runs where, why it's free

| Layer | Tool | Free-tier limits we stay within |
| --- | --- | --- |
| Frontend | **Next.js 14** + Tailwind CSS + React Flow + Framer Motion + Recharts | Vercel hobby: 100 GB-hr/mo, unlimited static |
| Frontend hosting | **Vercel** | One project, automatic preview deploys on every git push |
| Backend | **FastAPI** (Python 3.11) + Uvicorn | n/a |
| Backend hosting | **Render** Web Service free | 750 hrs/mo, sleeps after 15 min idle (cold-start ≈ 10 s) |
| AI | **Groq** (Llama 3.3 70B Versatile) | 30 req/min, fast enough for this use case |
| Orchestrator | **Zapier** Catch Hook → Gmail/Trello/Sheets/Discord | 100 tasks/mo on free plan |
| Scheduler | **GitHub Actions** cron | 2000 min/mo (we use ~1 min/day) |
| Storage | JSON files on Render disk | Ephemeral but plenty for activity log |
| Webhooks | **GitHub** native webhooks | Unlimited |

No Docker, no Kubernetes, no Redis, no Postgres, no paid APIs. Everything
is replaceable: swap Groq for OpenAI, Render for Fly.io, Zapier for n8n —
the pieces are loosely coupled by HTTP.

---

## 4. Repository structure

```
proitbridge-ai-automation/
├── README.md                       Deploy buttons + quick-start
├── DEPLOYMENT.md                   7-step live demo walkthrough
├── PROJECT_REPORT.md               This document
├── render.yaml                     Render Blueprint (root → backend)
├── .github/workflows/
│   └── daily-summary.yml           Cron: 09:00 IST → /api/cron/daily-summary
│
├── backend/                        FastAPI service
│   ├── main.py                     App entry, CORS, route registration
│   ├── config.py                   Env loader
│   ├── requirements.txt
│   ├── routes/
│   │   ├── webhook.py              POST /api/github (raw GH) + /api/github-webhook
│   │   ├── analyze.py              POST /api/analyze (raw Groq)
│   │   ├── dashboard.py            GET  /api/dashboard
│   │   ├── logs.py                 GET/DELETE /api/logs
│   │   ├── rules.py                CRUD /api/rules
│   │   ├── simulate.py             POST /api/simulate (5 scenarios)
│   │   ├── summaries.py            POST /api/daily-summary + cron variant
│   │   └── _helpers.py             process_event() — the pipeline
│   ├── services/
│   │   ├── groq_service.py         Groq AI call + heuristic fallback
│   │   ├── zapier_service.py       Webhook fan-out + rule evaluation
│   │   ├── summary_service.py      Daily standup roll-up
│   │   └── storage.py              JSON store (activities, rules, summaries)
│   ├── models/schemas.py           Pydantic models
│   └── data/
│       ├── sample_data.py          16 realistic engineering events
│       ├── activities.json         (gitignored, runtime)
│       ├── rules.json              (gitignored, runtime; seeded on first run)
│       └── summaries.json          (gitignored, runtime)
│
└── frontend/                       Next.js 14 app router
    ├── app/
    │   ├── layout.tsx              Root layout + Topbar/Sidebar shell
    │   ├── page.tsx                Dashboard (hero + 7 alternating sections)
    │   ├── workflows/page.tsx      React Flow diagram
    │   ├── rules/page.tsx          Automation rules CRUD
    │   ├── summaries/page.tsx      Daily standup history + cron docs
    │   └── timeline/page.tsx       Activity feed (filterable)
    ├── components/
    │   ├── shell/                  Sidebar · Topbar · AppShell
    │   ├── dashboard/              SimulationPanel · RiskTrendChart · …
    │   ├── workflows/              WorkflowFlow (React Flow nodes)
    │   ├── rules/                  RuleForm · RuleList
    │   ├── summaries/              SummaryCard · HealthBadge
    │   ├── timeline/               TimelineEntry
    │   └── ui/                     RiskBadge · StatCard · Section · …
    ├── lib/                        api · types · utils
    ├── public/proitbridge-logo.png
    └── tailwind.config.ts          Navy/blue/cyan palette tokens
```

---

## 5. End-to-end flow (the bit that matters)

### Event-driven mode

```
[Developer]                 [GitHub]              [Render]                 [Groq]                    [Zapier]              [Gmail/Trello/Sheets]
    │                          │                     │                       │                          │                            │
    │  git push                │                     │                       │                          │                            │
    │ ───────────────────────▶ │                     │                       │                          │                            │
    │                          │  webhook POST       │                       │                          │                            │
    │                          │ ──────────────────▶ │                       │                          │                            │
    │                          │  /api/github        │                       │                          │                            │
    │                          │                     │  verify HMAC          │                          │                            │
    │                          │                     │  extract commit       │                          │                            │
    │                          │                     │                       │                          │                            │
    │                          │                     │  POST chat completion │                          │                            │
    │                          │                     │ ────────────────────▶ │                          │                            │
    │                          │                     │                       │  Llama 3.3 70B           │                            │
    │                          │                     │ ◀──────────────────── │  returns JSON            │                            │
    │                          │                     │  {risk, blockers,     │                          │                            │
    │                          │                     │   recommended_actions}│                          │                            │
    │                          │                     │                       │                          │                            │
    │                          │                     │  load rules from JSON │                          │                            │
    │                          │                     │  evaluate rules       │                          │                            │
    │                          │                     │                       │                          │                            │
    │                          │                     │  IF rule matches:     │                          │                            │
    │                          │                     │  POST to Zapier ───────────────────────────────▶ │                            │
    │                          │                     │  with full payload    │                          │  Catch Hook                │
    │                          │                     │                       │                          │  Filter (kind?)            │
    │                          │                     │  log to activities.json                          │  Action: Gmail             │
    │                          │                     │                       │                          │ ─────────────────────────▶ │
    │                          │                     │                       │                          │                            │  📬 Email to manager
    │                          │                     │                       │                          │  Action: Trello card       │
    │                          │                     │                       │                          │ ─────────────────────────▶ │  ✅ QA card
    │                          │                     │                       │                          │                            │
    │                          │                     │                       │                          │                            │
    │  refresh dashboard       │                     │                       │                          │                            │
    │ ───────────────────────────────────────────────│                       │                          │                            │
    │                          │                     │  return cached stats  │                          │                            │
    │ ◀─────────────────────────────────────────────│                       │                          │                            │
```

**Latency budget:** p95 ≈ 1.4 s end-to-end (Render cold start adds ~10 s).

### Scheduled mode (daily standup)

```
[GitHub Actions cron]                   [Render]                          [Groq]                     [Zapier]
        │                                   │                                │                          │
        │  03:30 UTC daily                  │                                │                          │
        │  curl POST /api/cron/daily-summary│                                │                          │
        │  X-Cron-Secret: <secret>          │                                │                          │
        │ ─────────────────────────────────▶│                                │                          │
        │                                   │  verify secret                 │                          │
        │                                   │  load last 24h activities      │                          │
        │                                   │  POST rollup prompt to Groq    │                          │
        │                                   │ ──────────────────────────────▶│                          │
        │                                   │                                │  returns headline +      │
        │                                   │ ◀──────────────────────────────│  health + risks + …      │
        │                                   │                                                           │
        │                                   │  store summary                                            │
        │                                   │  POST to Zapier ────────────────────────────────────────▶ │
        │                                   │                                                           │  Action: Gmail
        │                                   │                                                           │  📬 Standup digest
```

---

## 6. Three automation modes built into the platform

| Mode | What triggers it | Use case |
| --- | --- | --- |
| **Live GitHub webhook** | Real `git push` / PR / deployment_status on the connected repo | Production flow — every real action gets analyzed |
| **Simulation** | Click a button on the dashboard | Live demos when no real repo is available; tests the AI + Zapier pipeline without waiting for real events |
| **Scheduled cron** | GitHub Actions fires daily at 09:00 IST | Daily standup digest for the engineering manager |

---

## 7. How the Automation Rules section works

The Rules page is the **policy layer** that decides which AI-analyzed
events should fire Zapier.

### Rule schema

Each rule has:

| Field | Example | What it does |
| --- | --- | --- |
| `name` | "Escalate High-Risk Deployments" | Human label |
| `condition` | "If deployment risk is HIGH, notify DevOps lead" | Free-text description (for humans only) |
| `risk_filter` | `HIGH` / `MEDIUM` / `LOW` / null | Restrict by risk level (null = any) |
| `event_filter` | `commit` / `pull_request` / `deployment` / `incident` / `approval` / null | Restrict by event type (null = any) |
| `actions` | `["notify_devops","create_trello_task","log_sheet"]` | Tags passed to Zapier so it knows which downstream apps to hit |
| `enabled` | `true` / `false` | Pause without deleting |

### Evaluation logic (when an event arrives)

```
for each enabled rule:
    if rule.risk_filter is set AND ≠ event.risk_level:  skip
    if rule.event_filter is set AND ≠ event.event_type: skip
    → rule matches

if ANY rules exist in the system:
    Zapier fires ONLY when at least one rule matched
else:
    fall back to default policy (HIGH/MEDIUM → fire, LOW → skip)
```

The matched rules' IDs, names, and aggregated actions are included in the
Zapier payload as `matched_rule_ids`, `matched_rule_names`, and
`rule_actions` — so the Zap can branch (e.g. Filter on
`notify_devops in rule_actions`).

### Three rules ship pre-seeded on first run

1. **Escalate High-Risk Deployments** — HIGH + deployment → notify_devops, create_trello_task, log_sheet
2. **Track PR Approvals** — any risk + pull_request → gmail_reminder, log_sheet
3. **Incident Auto-Response** — HIGH + incident → notify_oncall, create_trello_task, discord_alert

Create / pause / delete your own from the **Automation Rules** page in
the UI.

---

## 8. Sample data — what's in it and why

`backend/data/sample_data.py` ships 16 hand-crafted engineering events:

| Type | Count | Examples |
| --- | --- | --- |
| Commits | 5 | "Modified payment database schema", "Fixed authentication timeout bug" |
| Pull requests | 3 | "PR #52: Modified payment database schema — pending review" |
| Deployments | 3 | "Database migration timeout detected" |
| Incidents | 3 | "Production chatbot returning invalid responses" |
| Approvals | 2 | "Release v3.2.0 awaiting engineering manager approval" |

These power:
- The dashboard's **Simulation Mode** buttons (5 scenario shortcuts + random)
- The "Seed Demo" button (one-shot bulk-fill of an empty system)

Once a real GitHub webhook is attached, the simulator is optional but
remains useful for live demos.

---

## 9. Roadmap — what to add next

### Near-term (1–2 days each)

| Item | Why |
| --- | --- |
| **SQLite or Postgres adapter** | Render disk is ephemeral on free tier; logs reset on redeploy |
| **Slack OAuth integration** (bypass Zapier) | Faster, fewer moving parts than Zapier free plan's 100-task limit |
| **Per-repo configuration** | Right now rules apply globally; allow rules scoped to a repo |
| **Risk model training feedback loop** | "Was this risk score right?" 👍/👎 button → fine-tune prompt |
| **Multiple Zapier destinations** | Different webhooks for events vs. summaries vs. incidents |

### Mid-term (1 week each)

| Item | Why |
| --- | --- |
| **JIRA / Linear integration** | Most teams track work there, not Trello |
| **Auto-generated weekly retro** | Same rollup pattern, longer window |
| **Multi-tenancy** | Open it up as a product, not just an internal tool |
| **Per-user notification preferences** | Reviewer X wants Slack DM, manager Y wants email digest |
| **Webhook signature rotation** | Currently static — should rotate periodically |

### Long-term

| Item | Why |
| --- | --- |
| **Predictive risk modeling** | Use historical activity log to learn what _actually_ caused incidents, not just what looks risky |
| **Self-healing automations** | If staging deploy fails, auto-rollback to last known good |
| **Embedded code review** | AI suggests improvements on each PR, not just risk scoring |

---

## 10. What's deployed right now (status snapshot)

| Component | URL | Status |
| --- | --- | --- |
| GitHub repo | https://github.com/Madhavan1009/proitbridge-ai-automation | ✅ Public |
| Frontend | https://proitbridge-ai-automation.vercel.app | ✅ Live |
| Backend | https://proitbridge-backend.onrender.com | ✅ Live |
| GitHub webhook → backend | repo Settings → Webhooks (hook id 628567695) | ✅ Verified (HTTP 200) |
| Render env vars | GROQ_API_KEY, ZAPIER_WEBHOOK_URL, CRON_SECRET, GITHUB_WEBHOOK_SECRET, FRONTEND_URL | ✅ Set |
| Zapier Catch Hook | (Madhavan's Zap) | ✅ Receiving |
| Zapier Gmail action | proitbridge.manager@gmail.com | ✅ Sending |
| GitHub Actions cron | `.github/workflows/daily-summary.yml` | ⚠️ File needs to be added via GitHub web UI (workflow scope) |
| Trello / Sheets / Discord actions | Zapier Action steps | 🚧 Optional — add when needed |

---

## 11. One-line summary

> **ProITBridge is a free-tier AI orchestration layer that listens to your
> engineering events, scores their operational risk with an LLM, and
> drives Zapier-powered alerts so manual ops disappears from the
> engineering manager's daily todo list.**

— *Strive For Better Future.*
