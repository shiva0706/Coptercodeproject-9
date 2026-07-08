# Scripta — a DunSocial-style social media manager

A full-stack starter app: write one idea, get it turned into on-brand posts
for each platform, review/edit them, then schedule or publish. Built as two
pieces you run yourself:

- **backend/** — Node/Express API, SQLite database, JWT auth, AI post
  generation (via your own Groq API key), and a scheduler that
  auto-publishes posts when they're due.
- **frontend/** — React (Vite + Tailwind) app: sign up, set your brand
  voice, connect accounts, compose, and manage a dashboard of posts.

## What's real vs. simulated

| Feature | Status |
|---|---|
| Auth (register/login, JWT) | Real |
| Brand voice memory | Real |
| AI post generation | Real — calls the Groq API with your key |
| Scheduling logic | Real — a cron job checks every minute for due posts |
| Calendar view | Real — month view with reschedule/delete |
| Media upload + platform auto-crop | Real — images via sharp; video via ffmpeg (falls back to the original file if the ffmpeg binary isn't available) |
| Campaigns (group posts around a goal) | Real |
| AI image/video generation | Not built — needs a separate Grok (xAI) or similar key, distinct from Groq |
| Publishing to Instagram/TikTok/X/LinkedIn/Facebook/YouTube | **Simulated** |

Actually posting to each platform requires registering a developer app with
that platform and going through their OAuth + review process — that's
external to this codebase and only you can do it. Each platform's real API
call is stubbed with a `TODO` and a link to that platform's docs in
`backend/services/publishService.js`. Until you fill those in, "publishing"
just marks the post as published and logs what would have been sent.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- Set `JWT_SECRET` to any long random string.
- Set `GROQ_API_KEY` to your own key from https://console.groq.com/keys
  (required for the "Generate posts" feature — everything else works without it).

```bash
npm start
```

This starts the API on `http://localhost:4000` and creates `scripta.db`
(a SQLite file) in the `backend/` folder automatically on first run.

> Note: the backend uses Node's built-in `node:sqlite` module, which needs
> **Node.js 22.5 or newer**. Run `node -v` to check. If you're on an older
> Node, either upgrade or swap `db.js` to use the `better-sqlite3` package
> instead (same query API, just needs a native build step).

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). It proxies
`/api/*` requests to the backend on port 4000, so make sure the backend is
running first.

## Project structure

```
backend/
  server.js              entry point
  db.js                  SQLite schema + connection
  middleware/auth.js      JWT verification
  routes/
    auth.js               register / login
    brand.js              brand voice profile (tone, audience, rules, samples)
    accounts.js            connect/disconnect social accounts (mocked OAuth)
    posts.js               CRUD, AI generation, manual publish
  services/
    aiService.js           calls Groq API for post generation
    publishService.js      per-platform publish functions (stubbed, see TODOs)
  scheduler.js            cron job that auto-publishes due posts

frontend/
  src/
    api.js                fetch wrapper for the backend
    App.jsx                tab navigation shell
    pages/
      Auth.jsx             sign in / register
      Dashboard.jsx         list of posts with filters and actions
      Compose.jsx           idea -> AI-generated drafts -> save/schedule
      BrandVoice.jsx        edit tone/audience/rules/sample posts
      Accounts.jsx          connect/disconnect platforms
```

## Where to take it next

- **Real OAuth per platform**: replace the mock "connect" flow in
  `routes/accounts.js` with each platform's OAuth redirect, and store the
  returned access/refresh tokens (encrypted) instead of a plain handle.
- **Real publishing**: fill in the `TODO`s in `publishService.js` using the
  stored tokens.
- **Image/video support**: posts are currently text-only; add file upload
  and pass media URLs through to the platform APIs.
- **Team accounts**: the schema is single-user per account; add an
  `organizations` table and a join table if you want multiple people
  managing the same brand.
- **Production database**: SQLite is great for getting started; move to
  Postgres if you need concurrent writers or multiple server instances.
