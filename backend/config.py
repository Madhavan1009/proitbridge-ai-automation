"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    ZAPIER_WEBHOOK_URL: str = os.getenv("ZAPIER_WEBHOOK_URL", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    APP_ENV: str = os.getenv("APP_ENV", "development")

    DATA_DIR: Path = BASE_DIR / "data"
    ACTIVITIES_FILE: Path = DATA_DIR / "activities.json"
    RULES_FILE: Path = DATA_DIR / "rules.json"
    SUMMARIES_FILE: Path = DATA_DIR / "summaries.json"

    # Optional shared secret to authorize the scheduled cron endpoint.
    # If unset, the endpoint is open (handy for first-time setup).
    CRON_SECRET: str = os.getenv("CRON_SECRET", "")

    # GitHub webhook signing secret. When set, /api/github verifies the
    # X-Hub-Signature-256 header on every request. Leave blank to accept
    # any request (only do this for local testing).
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET", "")

    @property
    def has_groq(self) -> bool:
        return bool(self.GROQ_API_KEY)

    @property
    def has_zapier(self) -> bool:
        return bool(self.ZAPIER_WEBHOOK_URL)


settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
