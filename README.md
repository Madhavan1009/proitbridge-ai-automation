# ProITBridge — Engineering Workflow Automation

> *Strive For Better Future.*

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMadhavan1009%2Fproitbridge-ai-automation&root-directory=frontend&env=NEXT_PUBLIC_API_BASE_URL&envDescription=URL%20of%20your%20deployed%20FastAPI%20backend%20on%20Render&project-name=proitbridge-ai-automation&repository-name=proitbridge-ai-automation)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FMadhavan1009%2Fproitbridge-ai-automation)

**Live demo:** <https://proitbridge-ai-automation.vercel.app>
**Repo:** <https://github.com/Madhavan1009/proitbridge-ai-automation>
**Full setup guide:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

AI-powered engineering workflow automation platform. Ingests GitHub events,
deployment alerts, and incident reports → uses **Groq AI** to score
operational risk → orchestrates **Zapier** to fan out to Gmail, Trello,
Google Sheets, and Discord in real time.

Two complementary automation modes ship out of the box:

- **Event-driven** — every GitHub commit, PR, deployment alert, or
  incident is analyzed the instant it arrives and (if risky enough)
  fired into Zapier.
- **Scheduled** — once a day a cron job rolls up the last 24h of activity
  into a Groq-generated standup digest and delivers it via Zapier
  (Gmail / Slack / Sheets).

100% free-tier. No Docker, no Kubernetes, no microservices.

---

## Architecture

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  GitHub / Sim    │──▶│   FastAPI        │──▶│   Groq AI         │
│  (webhook /      │    │   (Render free)  │    │   Llama 3.3 70B  │
│   simulation)    │    └────────┬─────────┘    └─────────┬────────┘
└──────────────────┘             │                        │
                                  ▼                        ▼
                          ┌────────────┐          ┌─────────────────┐
                          │  Activity  │          │ Risk · Blockers │
                          │  log JSON  │          │ Recommended     │
                          └────────────┘          │ Actions (JSON)  │
                                                   └────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌────────────────┐
                                                   │  Zapier hook   │
                                                   └────────┬───────┘
                                                            │
                  ┌─────────────┬────────────────┬─────────┴──────┐
                  ▼             ▼                ▼                ▼
              ┌───────┐    ┌────────┐      ┌──────────┐     ┌──────────┐
              │ Gmail │    │ Trello │      │  Sheets  │     │ Discord  │
              └───────┘    └────────┘      └──────────┘     └──────────┘

                          ┌──────────────────┐
                          │   Next.js UI     │
                          │   (Vercel free)  │
                          └──────────────────┘
```

---

## Repository layout

```
AI_Automation_/
├── backend/                FastAPI service (deploy to Render)
│   ├── main.py             App entry, CORS, route registration
│   ├── config.py           Env loading
│   ├── render.yaml         One-click Render deploy config
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/             Pydantic schemas
│   ├── routes/             webhook / analyze / dashboard / logs / rules / simulate
│   ├── services/           groq · zapier · storage
│   └── data/               Sample data + activity log JSON
└── frontend/               Next.js 14 (deploy to Vercel)
    ├── app/                Dashboard · Workflows · Rules · Timeline
    ├── components/         Shell · UI · Dashboard widgets · Workflows · Rules · Timeline
    ├── lib/                api client · types · utils
    ├── public/             ProITBridge logo
    └── tailwind.config.ts  Navy/blue/cyan palette tokens
```

---

## Tech stack

| Layer | Tool | Free tier? |
| --- | --- | --- |
| Frontend | Next.js 14 + React 18 | ✅ Vercel |
| Styling | Tailwind CSS · Framer Motion · Recharts · React Flow | ✅ |
| Backend | FastAPI · Uvicorn | ✅ Render |
| AI | Groq · Llama 3.3 70B | ✅ console.groq.com |
| Orchestration | Zapier "Catch Hook" | ✅ Zapier free plan |
| Storage | JSON files (`activities.json`, `rules.json`) | ✅ |
| Optional | Gmail · Trello · Google Sheets · Discord | ✅ via Zapier |

---

## Run locally

### 1. Backend (port 8000)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env       # then edit .env with your keys
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the interactive Swagger UI.

> The platform works **without** Groq or Zapier configured — the backend
> falls back to a heuristic analyzer and logs Zapier payloads locally.

### 2. Frontend (port 3000)

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. Use the **Simulation Mode** panel on the
dashboard to fire test events through the pipeline.

---

## Environment variables

### Backend (`backend/.env`)

| Var | Purpose | Required |
| --- | --- | --- |
| `GROQ_API_KEY` | Groq API key | Optional (heuristic fallback) |
| `GROQ_MODEL` | Defaults to `llama-3.3-70b-versatile` | No |
| `ZAPIER_WEBHOOK_URL` | Zapier Catch Hook URL | Optional (logs locally) |
| `FRONTEND_URL` | CORS origin (your Vercel URL) | No |
| `APP_ENV` | `development` / `production` | No |

### Frontend (`frontend/.env.local`)

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL (`http://localhost:8000` locally, Render URL in prod) |

---

## Deployment

### Backend → Render (free tier, one-click)

Click the **Deploy to Render** button at the top of this README, OR:

1. In Render → **New** → **Blueprint** → connect the repo.
2. Render auto-detects [`render.yaml`](./render.yaml) at the root and
   provisions a `proitbridge-backend` service from the `backend/` directory.
3. After provisioning, set these env vars in the Render dashboard:
   - `GROQ_API_KEY` — from <https://console.groq.com>
   - `ZAPIER_WEBHOOK_URL` — from your Zapier Catch Hook
   - `CRON_SECRET` — any random string
   - `GITHUB_WEBHOOK_SECRET` — any random string
   - `FRONTEND_URL` — your Vercel URL once deployed
4. Render restarts. Service is live at `https://proitbridge-backend.onrender.com`.

> Free Render instances sleep after ~15 min of inactivity. The first
> request after sleep takes ~10 s to wake up — normal.

### Frontend → Vercel (free tier)

1. In Vercel → **Add New** → **Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework is auto-detected as Next.js. Build command and output dir are
   left as defaults.
4. Add the env var:
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com`
5. Deploy. Vercel gives you a `*.vercel.app` URL — go back to Render and
   set `FRONTEND_URL` to that URL so CORS works.

> The backend already allows any `*.vercel.app` origin out of the box.

---

## Scheduled automation — Daily Engineering Standup

A GitHub Actions workflow (`.github/workflows/daily-summary.yml`) fires once
a day and calls `POST /api/cron/daily-summary` on the deployed backend. The
backend asks Groq to roll up the last 24h of activity into a structured
standup digest, then sends it to Zapier so it can land in Gmail / Slack /
Sheets exactly like the event-driven flows.

### One-time setup

1. **Set `CRON_SECRET` on Render** — any random string, e.g.
   `openssl rand -hex 32`. This locks down the cron endpoint.
2. **Add the same secret + your backend URL as GitHub Actions secrets**:
   - `BACKEND_URL` → your Render URL (e.g. `https://proitbridge.onrender.com`)
   - `CRON_SECRET` → the value you set on Render
3. **Adjust the cron schedule** in
   [`.github/workflows/daily-summary.yml`](.github/workflows/daily-summary.yml)
   if you want a different time. The default is **03:30 UTC ≈ 09:00 IST**.

You can also trigger the job manually from the GitHub Actions tab, or from
the **Daily Summaries** page in the UI (`Run + Send to Zapier`).

### Why GitHub Actions (and not Render cron)?

Render's cron jobs require a paid plan. GitHub Actions includes scheduled
workflows on its free tier, so the stack stays $0.

---

## Configuring Zapier (5 minutes)

1. Create a free Zapier account.
2. Create a new Zap → Trigger: **Webhooks by Zapier** → **Catch Hook**.
3. Copy the webhook URL Zapier provides and set it as `ZAPIER_WEBHOOK_URL`
   in Render.
4. Click **Test trigger**, then fire a simulation from the dashboard. Your
   payload will appear in Zapier.
5. Add Action steps to fan out to:
   - **Gmail** → send alerts using `{{risk_level}}`, `{{summary}}`, etc.
   - **Trello** → create card using `{{title}}` + `{{recommended_actions}}`.
   - **Google Sheets** → append row for an audit log.
   - **Discord** / **Slack** → post incident message.

The exact JSON contract the backend sends is documented on the **Workflows**
page in the UI.

---

## Sample / simulation data

The dashboard has five built-in scenarios that demonstrate the full pipeline
without any real integration:

- **Deployment Failure** — staging deploy + migration timeout (HIGH risk)
- **High-Risk PR** — PR touching payment schema (HIGH risk)
- **Production Incident** — live service returning invalid responses (HIGH risk)
- **Pending Approval** — release awaiting manager sign-off (MEDIUM risk)
- **Routine Commit** — docs / typo update (LOW risk)

Plus a **Random** button (one random event from the sample pool) and a
**Seed Demo** button (one-shot seed of 8 events for empty-state demos).

Sample data lives in `backend/data/sample_data.py` — extend it freely.

---

## API reference

All endpoints are prefixed with `/api`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/github-webhook` | Ingest a GitHub-style event |
| POST | `/api/analyze` | Run Groq analysis without logging |
| GET  | `/api/dashboard` | Aggregated stats |
| GET  | `/api/logs` | Activity feed (`risk` + `event_type` filters) |
| DELETE | `/api/logs` | Clear activity log |
| GET/POST | `/api/rules` | List or create automation rules |
| PUT/DELETE | `/api/rules/{id}` | Update or delete a rule |
| POST | `/api/simulate` | One of five scenarios |
| POST | `/api/simulate/random` | Random sample event |
| POST | `/api/simulate/seed` | Seed activity log (one-shot) |
| POST | `/api/daily-summary` | Manually generate today's standup digest |
| POST | `/api/cron/daily-summary` | Cron-friendly trigger (requires `X-Cron-Secret` header) |
| GET  | `/api/summaries` | History of past summaries |
| GET  | `/api/summaries/latest` | Most recent summary |
| DELETE | `/api/summaries` | Clear summary history |

Open `http://localhost:8000/docs` for live Swagger UI.

---

## License & credits

Built by **ProITBridge** — *Strive For Better Future.*

Powered by Groq · Zapier · FastAPI · Next.js · Vercel · Render · Tailwind.
