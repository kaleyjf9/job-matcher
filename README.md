# Job Matcher

Upload your resume once. Every day, the app scans fresh job postings from
Adzuna, RemoteOK, and USAJobs and shows you the ones you're actually
qualified for — filtered by your own keywords (e.g. "defense tech", "cyber",
"intern", "remote").

Matching is keyword/overlap based (title, description, and your resume text
against each posting) — no AI API key required and no per-job cost.

## Stack

- **Next.js 16** (App Router) + Tailwind
- **Supabase** — auth, Postgres, and resume file storage
- **Vercel Cron** — triggers the daily scan
- Job sources: **Adzuna**, **RemoteOK**, **USAJobs** (all free tiers)

## One-time setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the two files in `supabase/migrations/` in order
   (`0001_init.sql`, then `0002_profile_trigger.sql`).
3. In **Project Settings → API**, copy the Project URL, `anon` public key,
   and `service_role` secret key into your `.env.local` (see below).
4. In **Authentication → URL Configuration**, add your local and deployed
   URLs (e.g. `http://localhost:3000/auth/callback` and
   `https://yourdomain.com/auth/callback`) as redirect URLs.

### 2. Job source API keys (all free)

- **Adzuna**: register at [developer.adzuna.com](https://developer.adzuna.com)
  for an `app_id` and `app_key`.
- **USAJobs**: register at [developer.usajobs.gov](https://developer.usajobs.gov)
  for an API key. It also requires a `User-Agent` header set to your email.
- **RemoteOK**: no key needed, it's a public feed.

### 3. Environment variables

```bash
cp .env.example .env.local
# then fill in the values
```

`CRON_SECRET` can be any random string — generate one with
`openssl rand -hex 32`. Vercel automatically sends it as a Bearer token to
the cron route when the env var is named exactly `CRON_SECRET`.

### 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, sign up, upload a resume (PDF or .txt), and
add some keywords on the "Resume & keywords" page.

To test the daily scan manually without waiting for the cron schedule:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily-scan
```

## Deploying

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add all the same environment variables from `.env.local` in the Vercel
   project settings (set `NEXT_PUBLIC_APP_URL` to your real domain).
4. Deploy. `vercel.json` already configures the daily cron
   (`0 13 * * *` = 1pm UTC — adjust to taste) to hit `/api/cron/daily-scan`.
5. Point your domain at the Vercel project from Vercel's Domains settings.

## How matching works

`lib/jobs/matcher.ts` extracts meaningful words from the resume and from each
job's title/description, scores by vocabulary overlap (60%), how many of the
user's own keywords appear in the posting (30%), and remote fit (10%). Jobs
below a 35% score are dropped. This is intentionally simple and free to run;
swapping in an LLM-based scorer later (see `lib/jobs/scan.ts`) is a
contained change if you want higher-quality ranking down the line.

## Project structure

```
app/
  (auth)/login, (auth)/signup   — auth pages
  dashboard/                    — matches list + resume/keywords form
  api/cron/daily-scan/          — cron-triggered scan endpoint
  api/resume/upload/            — resume upload + parsing
  api/keywords/                 — keyword/remote-only preferences
  auth/callback/                — Supabase email-confirmation redirect
lib/
  supabase/                     — browser/server/admin Supabase clients
  jobs/sources/                 — one file per job API
  jobs/matcher.ts                — scoring logic
  jobs/scan.ts                   — orchestrates the daily scan for all users
  resume/parse.ts                — PDF/text extraction
supabase/migrations/            — SQL schema (profiles, job_matches, storage)
proxy.ts                        — auth-gate for /dashboard (Next 16's
                                   renamed middleware.ts)
```
