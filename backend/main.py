"""EngFlow AI — FastAPI backend entry point.

A lightweight orchestration layer that:
  1. Receives engineering events (GitHub webhooks, simulated events, manual posts)
  2. Asks Groq AI to assess deployment / operational risk
  3. Forwards the structured result to Zapier for downstream automations
  4. Stores a local activity log for the dashboard
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import analyze, dashboard, logs, rules, simulate, summaries, webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="EngFlow AI",
    description="AI-powered engineering workflow automation backend.",
    version="1.0.0",
)

_allowed_origins = list({
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https?://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "EngFlow AI",
        "status": "online",
        "version": "1.0.0",
        "integrations": {
            "groq": settings.has_groq,
            "zapier": settings.has_zapier,
        },
        "endpoints": [
            "POST /api/github            (raw GitHub webhook)",
            "POST /api/github-webhook    (normalized payload)",
            "POST /api/analyze",
            "GET  /api/dashboard",
            "GET  /api/logs",
            "GET/POST/PUT/DELETE /api/rules",
            "POST /api/simulate",
            "POST /api/daily-summary",
            "POST /api/cron/daily-summary",
            "GET  /api/summaries",
        ],
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "env": settings.APP_ENV}


app.include_router(webhook.router, prefix="/api", tags=["webhook"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(logs.router, prefix="/api", tags=["logs"])
app.include_router(rules.router, prefix="/api", tags=["rules"])
app.include_router(simulate.router, prefix="/api", tags=["simulate"])
app.include_router(summaries.router, prefix="/api", tags=["summaries"])
