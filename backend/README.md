# EngFlow AI — Backend

Lightweight FastAPI service that receives engineering events, asks Groq AI to
score operational risk, and orchestrates Zapier to fan-out alerts.

## Quick start

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate          # Windows PowerShell
# source .venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
cp .env.example .env              # then edit with your keys
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000` with interactive docs at
`http://localhost:8000/docs`.

## Environment variables

| Var | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq AI key — falls back to heuristic analyzer if missing |
| `GROQ_MODEL` | Defaults to `llama-3.3-70b-versatile` |
| `ZAPIER_WEBHOOK_URL` | Zapier `Catch Hook` URL — payload is logged locally if missing |
| `FRONTEND_URL` | CORS origin for the Next.js frontend |
| `APP_ENV` | `development` or `production` |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/github-webhook` | Ingest a GitHub-style event |
| POST | `/api/analyze` | Run Groq analysis (no logging / no Zapier) |
| GET  | `/api/dashboard` | Aggregated stats for the dashboard page |
| GET  | `/api/logs` | Activity feed (supports `risk` and `event_type` filters) |
| DELETE | `/api/logs` | Clear activity log |
| GET/POST | `/api/rules` | List or create automation rules |
| PUT/DELETE | `/api/rules/{id}` | Update or delete a rule |
| POST | `/api/simulate` | Run one of five built-in scenarios |
| POST | `/api/simulate/random` | Generate a random sample event |
| POST | `/api/simulate/seed` | One-shot seed for empty demos |

## Deploy to Render (free tier)

1. Push this repo to GitHub.
2. In Render → New → Web Service → connect the repo with root `backend/`.
3. Render detects `render.yaml` and provisions the free instance.
4. Set the `GROQ_API_KEY`, `ZAPIER_WEBHOOK_URL`, and `FRONTEND_URL` env vars
   in the Render dashboard.
5. The service starts with `uvicorn main:app --host 0.0.0.0 --port $PORT`.

> Note: Render free instances sleep after ~15 minutes of inactivity. The first
> request after sleep takes a few seconds to wake up.
