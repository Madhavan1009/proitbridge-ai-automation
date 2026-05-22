# Deployment & Demo Guide

This document walks you from the freshly-pushed GitHub repo to a fully
running, end-to-end demo where **a real `git push` triggers Groq AI and
fires Zapier automations.**

Repo: **https://github.com/Madhavan1009/proitbridge-ai-automation**

---

## What you'll have when you're done

```
git push  ──▶  GitHub webhook  ──▶  Render (FastAPI)
                                          │
                                          ▼
                                    Groq AI (risk score)
                                          │
                                          ▼
                                    Zapier webhook
                                          │
                  ┌─────────┬─────────────┼─────────────┬─────────┐
                  ▼         ▼             ▼             ▼         ▼
                Gmail    Trello       Sheets        Discord     ...

                                                Daily 09:00 IST
                                        GitHub Actions cron job
                                                   │
                                                   ▼
                                 ProITBridge daily standup digest
                                                   │
                                                   ▼
                                        Zapier → Gmail / Slack
```

---

## Step 0 — Grab your API keys (5 minutes, all free)

### Groq AI

1. Go to <https://console.groq.com> → sign in (Google works).
2. **API Keys** → **Create API Key** → copy the `gsk_…` string.
3. Save it somewhere safe — you'll paste it into Render below.

### Zapier Catch Hook

1. Sign in to <https://zapier.com> (free plan is fine).
2. Click **Create Zap** → search trigger **"Webhooks by Zapier"** →
   **Catch Hook**.
3. Zapier shows a URL like
   `https://hooks.zapier.com/hooks/catch/12345678/abcd1234/` — **copy it.**
4. Click **Test trigger** but don't add Action steps yet — we'll do that
   after the first event arrives.

### Generate two random secrets

You need two random strings: one to lock down the cron endpoint, one for
the GitHub webhook signature. Anything random works — example commands:

```powershell
# In PowerShell:
[guid]::NewGuid().ToString("N")
[guid]::NewGuid().ToString("N")
```

Call them `CRON_SECRET` and `GITHUB_WEBHOOK_SECRET`.

---

## Step 1 — Deploy the backend to Render

1. Go to <https://render.com> → sign in with GitHub.
2. **New** → **Web Service** → **Connect a repository** → pick
   `Madhavan1009/proitbridge-ai-automation`.
3. Fill in:
   - **Name:** `proitbridge-backend` (anything works)
   - **Region:** closest to you (Singapore for India)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Python (auto-detected)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** **Free**
4. Click **Advanced** → **Add Environment Variable** → add these:

   | Key | Value |
   | --- | --- |
   | `GROQ_API_KEY` | `gsk_…` from Step 0 |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `ZAPIER_WEBHOOK_URL` | the Zapier Catch Hook URL from Step 0 |
   | `CRON_SECRET` | the first random secret |
   | `GITHUB_WEBHOOK_SECRET` | the second random secret |
   | `APP_ENV` | `production` |
   | `PYTHON_VERSION` | `3.11.9` |

   *Leave `FRONTEND_URL` for now — we'll set it after Vercel.*

5. Click **Create Web Service**. Render builds and deploys.
   Wait for the green "Live" indicator (~2–4 min).
6. Copy the service URL — it looks like
   `https://proitbridge-backend.onrender.com`. **Save it.**

7. Smoke test from your terminal:
   ```bash
   curl https://proitbridge-backend.onrender.com/api/health
   # → {"status":"healthy","env":"production"}
   ```

> Free Render instances sleep after ~15 min of inactivity. The first
> request after sleep takes ~10 s to wake up. This is normal.

---

## Step 2 — Deploy the frontend to Vercel

1. Go to <https://vercel.com> → sign in with GitHub.
2. **Add New** → **Project** → import
   `Madhavan1009/proitbridge-ai-automation`.
3. Configure:
   - **Framework Preset:** Next.js (auto)
   - **Root Directory:** `frontend`
4. **Environment Variables** → add:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_BASE_URL` | your Render URL from Step 1 |

5. Click **Deploy**. Wait ~1–2 min.
6. Vercel gives you a URL like
   `https://proitbridge-ai-automation.vercel.app`. **Open it — you should
   see the live ProITBridge dashboard.**

7. Go back to Render → your service → **Environment** → add:

   | Key | Value |
   | --- | --- |
   | `FRONTEND_URL` | your Vercel URL |

   Render will redeploy automatically (~1 min).

---

## Step 3 — Confirm everything is wired

In the Vercel dashboard:

1. The top-right status chips should now show **API · live**, **Groq · live**,
   **Zapier · live** (all green).
2. Scroll to the **Simulation Mode** panel → click **High-Risk PR**.
3. A few seconds later the Activity Feed shows the new event tagged
   `HIGH` and `Zapier`. Open your Zapier zap — the payload should be in
   the trigger's history.

You now have the full pipeline working. Time to wire up the **real GitHub
trigger** and the **daily standup cron**.

---

## Step 4 — Wire a real GitHub repo to fire the backend

You can either:

- **A.** Add the webhook to **this** repo (so commits to
  `proitbridge-ai-automation` itself fire events). Good for demoing.
- **B.** Add it to a separate "engineering" demo repo you own.

Steps are the same either way:

1. Go to the repo on GitHub → **Settings** → **Webhooks** → **Add webhook**.
2. Fill in:
   - **Payload URL:** `https://proitbridge-backend.onrender.com/api/github`
   - **Content type:** `application/json`
   - **Secret:** the same `GITHUB_WEBHOOK_SECRET` you set on Render
   - **SSL verification:** Enabled
   - **Which events?** Select **"Let me select individual events"** →
     check **Pushes**, **Pull requests**, **Deployment statuses**.
3. **Add webhook.**
4. GitHub immediately fires a `ping` event. Refresh the webhook page —
   you should see a green ✓ next to the most recent delivery.

### Demo it

Now run on your local machine, inside any folder that's a clone of the repo:

```bash
echo "// demo trigger" >> README.md
git add README.md
git commit -m "Modified payment database schema"
git push
```

Within ~5 seconds:

1. Your Render logs show: `GitHub event received: push (delivery=…)`
2. The **Activity Timeline** page on Vercel shows the new commit, tagged
   `HIGH` risk (because the message says "payment database schema").
3. Your Zapier trigger fires.

That's the **event-based automation** the demo is built around — every
real commit message gets analyzed and routed.

---

## Step 5 — Wire up the Daily Standup cron (GitHub Actions)

The repo has a workflow file you need to add to the live repo. Because
the initial push used an OAuth token without the `workflow` scope, the
file is currently only on your local machine. Easiest way to add it:

### Option A — Add it via the GitHub web UI (30 seconds)

1. Go to <https://github.com/Madhavan1009/proitbridge-ai-automation>.
2. Click **Add file** → **Create new file**.
3. Type the path:
   `.github/workflows/daily-summary.yml`
4. Paste the contents of your local
   `.github/workflows/daily-summary.yml` file (it's on disk after the
   initial commit even though it didn't get pushed).
5. Commit message: `Add daily summary GitHub Actions cron` → commit.

### Option B — Refresh your gh auth scope and push (terminal)

```bash
gh auth refresh -h github.com -s workflow
# (browser opens, complete the flow, then:)
cd F:/ProITBridge/AI_Automation_
git add .github/workflows/daily-summary.yml
git commit -m "Add daily summary GitHub Actions cron"
git push
```

### Then add the GitHub Actions secrets

1. On the repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**.
2. Add two secrets:

   | Name | Value |
   | --- | --- |
   | `BACKEND_URL` | your Render URL, no trailing slash |
   | `CRON_SECRET` | same value as on Render |

### Test the cron manually

1. On the repo → **Actions** tab → **Daily Engineering Summary** → **Run workflow**.
2. Within a few seconds the workflow turns green ✅.
3. On Vercel, go to **Daily Summaries** → you'll see a fresh standup
   digest at the top with `Latest` + `Sent to Zapier` chips.

From tomorrow at 09:00 IST, this runs automatically.

---

## Step 6 — Add Zapier actions (where the alerts actually go)

So far, Zapier is just **receiving** the payload. Now make it act on
that payload.

1. In your Zap (the one with the Catch Hook trigger) → **+** below
   the trigger → **Add an Action**.
2. Useful actions to add:

   | App | Action | Field mapping |
   | --- | --- | --- |
   | Gmail | **Send Email** | Subject: `[{{risk_level}}] {{title}}`<br>Body: `{{summary}}` + recommended_actions |
   | Trello | **Create Card** | Title: `{{title}}`<br>Description: `{{recommended_actions}}` |
   | Google Sheets | **Create Spreadsheet Row** | One column per field (timestamp, repo, risk, summary…) |
   | Discord | **Send Channel Message** | Channel: #engineering<br>Message: `🚨 {{risk_level}} — {{title}}` |
   | Slack | **Send Channel Message** | Same idea |

3. **Optional filter:** add a Zapier **Filter** step before the actions
   that says `risk_level` equals `HIGH` — so only critical events
   page you.

4. **Daily summary handling:** the cron payload has a different shape
   (`kind: "daily_summary"`, `headline`, `overall_health` instead of
   `risk_level`). Easiest approach is to create a *second* Zap with its
   own Catch Hook URL just for daily summaries and update
   `ZAPIER_WEBHOOK_URL` to a single Zap that uses a **Paths** branch on
   the `kind` field. (Paths is Zapier paid only — if you're staying on
   free, just send everything to one Zap and filter on `kind` in your
   Gmail subject.)

5. **Publish** your Zap.

---

## Step 7 — Final demo script (for showing it off)

Once everything above is connected, your live demo flows like this:

> **You:** "ProITBridge automates engineering operations end-to-end.
> I'll show you both modes."

**Event-driven demo (real GitHub commit):**

```bash
git commit --allow-empty -m "Modified payment database schema"
git push
```

> **You:** "Watch the dashboard." → Vercel page updates within seconds:
> Activity Timeline shows the new entry, marked HIGH risk. Zapier
> triggered email/Trello/Slack in real time.

**Simulation demo (no real repo needed, for live audiences):**

> **You:** "If you don't have a repo handy, the simulator does the same
> thing." → Click any of the 5 scenario buttons on the dashboard. Full
> AI + Zapier pipeline runs in under 2 seconds.

**Scheduled demo:**

> **You:** "And every morning at 9 AM, GitHub Actions fires the standup
> digest." → Open the Daily Summaries page → click **Run + Send to
> Zapier**. A fresh digest appears, marked `Sent to Zapier`.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Dashboard says "Backend unreachable" | Render service is asleep. Hit `https://<your>.onrender.com/api/health` once to wake it. |
| GitHub webhook shows red ✗ | Check the **Recent Deliveries** tab on the webhook page — usually a 401 (signature mismatch) → make sure `GITHUB_WEBHOOK_SECRET` matches between GitHub and Render. |
| Zapier shows no events | Did you click **Test trigger** in Zapier *after* setting `ZAPIER_WEBHOOK_URL`? The webhook only fires for `risk_level` HIGH/MEDIUM or events with recommended actions. |
| Groq returns garbage | Check that `GROQ_API_KEY` is valid — try a curl in [the Groq playground](https://console.groq.com). The system falls back to a heuristic if Groq fails. |
| Daily summary cron never runs | Check **Actions** tab on GitHub for failed runs. Most common cause: `BACKEND_URL` or `CRON_SECRET` not added as repository secrets. |
| CORS error in browser console | `FRONTEND_URL` not set on Render, or it's set to the wrong Vercel URL. |

---

## What "sample data" means in this project

The `backend/data/sample_data.py` file holds ~16 realistic engineering
events (commits, PRs, deployments, incidents, approvals) used by the
**Simulation Mode** buttons. They exist so you can demo the platform
without needing a real GitHub repo, Zapier zap, or production
infrastructure connected.

Once you wire up Step 4 (real GitHub webhook), the simulator becomes
optional — every real `git push` to your demo repo flows through the
exact same AI + Zapier pipeline. The sample data just lets you trigger
the same flow with one click for live audiences.
