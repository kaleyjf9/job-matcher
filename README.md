# Job Matcher

**Live: [jobs.emeraldstrategic.dev](https://jobs.emeraldstrategic.dev)**

I got tired of checking USAJobs and RemoteOK every morning, so I built
something to do it for me.

I'm a Marine Corps veteran job-hunting for federal, cyber, and automation
roles. Every job board has its own search, its own filters, and none of them
tell you if you're actually a fit — you just have to read every posting
yourself. So this pulls the skills straight off your resume, checks them
against fresh postings from three job sources every day, and only shows you
the ones worth your time.

No keywords to maintain, no AI subscription, nothing to configure — upload
your resume once and it just runs.

## What it does

- **Resume-driven matching, no setup required.** Parses your resume's
  Skills/Certifications section directly (PDF or plain text) and uses that
  to score postings — works with zero configuration, though you can add
  keywords like "defense tech" or "remote" to steer it further.
- **Daily automated scan.** A Vercel Cron job runs once a day, pulling fresh
  postings from [Adzuna](https://developer.adzuna.com),
  [RemoteOK](https://remoteok.com/api), and
  [USAJobs](https://developer.usajobs.gov) and re-scoring them against every
  signed-up user's resume.
- **Multi-user from the ground up.** Auth, per-user resume storage, and
  row-level-security-isolated data via Supabase — anyone can sign up and get
  their own daily matches.
- **Free to run.** Matching is word-boundary keyword scoring, not an LLM
  call — no per-user, per-scan API cost.

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind
- **Supabase** — Postgres, auth, and resume file storage
- **Vercel** — hosting + Cron for the daily scan
- Job sources: **Adzuna**, **RemoteOK**, **USAJobs** (all free tiers)

## How matching works

`lib/resume/extract-keywords.ts` pulls real skill phrases out of a resume's
Skills/Certifications section (rejoining PDF line-wraps first, so "API" on
one line and "Integrations" on the next become one phrase instead of two
meaningless fragments). Those phrases become the primary signal.

`lib/jobs/matcher.ts` then scores each posting: how many of the resume's own
skill phrases appear in the posting (word-boundary matching — a short
acronym like "GHL" won't falsely match inside "highly"), plus any keywords
the user typed in, plus a remote-fit bonus. No AI call, no per-job cost.

Both external search APIs turned out to have sharp edges that only showed up
against real data — USAJobs' and Adzuna's default query params `AND` every
search term together, so a query built from a dozen resume skill phrases
reliably returned zero results; Adzuna's `what_or` also silently zeroes out
an entire query if one term has mismatched punctuation. Both are worked
around in `lib/jobs/sources/`.

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
  resume/extract-keywords.ts     — pulls skill phrases out of resume text
  resume/parse.ts                — PDF/text extraction
supabase/migrations/            — SQL schema (profiles, job_matches, storage)
proxy.ts                        — auth-gate for /dashboard (Next 16's
                                   renamed middleware.ts)
```

## Running your own copy

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
   project settings.
4. Deploy. `vercel.json` already configures the daily cron
   (`0 13 * * *` = 1pm UTC — adjust to taste) to hit `/api/cron/daily-scan`.
5. Point your domain at the Vercel project from Vercel's Domains settings.
