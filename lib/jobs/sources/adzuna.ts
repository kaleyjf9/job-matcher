import type { RawJob, SearchParams } from "../types";

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

type AdzunaResult = {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url: string;
  description: string;
  created: string;
};

/**
 * Adzuna covers general + tech postings across many employers, including
 * defense contractors. Free tier: https://developer.adzuna.com
 *
 * Its `what_or` query is fragile in two ways, both confirmed by bisecting a
 * real failing query against the live API:
 *  1. A term containing parentheses combined with a slash (e.g. "Telephony
 *     Systems (Twilio / LeadConnector)") makes the *entire* combined query
 *     silently return zero results, not just that term.
 *  2. A query built from ~50 OR'd words (a dozen+ multi-word resume skill
 *     phrases) returns a 500 from Adzuna's own server.
 * Strip punctuation from each term and cap the total word count so one
 * oddly-punctuated or long resume doesn't take down every other term's
 * matches.
 */
function sanitizeForQuery(term: string): string {
  return term.replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();
}

const MAX_QUERY_WORDS = 15;

export async function searchAdzuna(params: SearchParams): Promise<RawJob[]> {
  if (!APP_ID || !APP_KEY) {
    console.error("[adzuna] missing credentials", {
      hasAppId: Boolean(APP_ID),
      hasAppKey: Boolean(APP_KEY),
    });
    return [];
  }

  const terms = [params.query, ...params.keywords]
    .filter(Boolean)
    .map(sanitizeForQuery)
    .filter(Boolean)
    .join(" ")
    .split(" ")
    .slice(0, MAX_QUERY_WORDS)
    .join(" ");
  const url = new URL("https://api.adzuna.com/v1/api/jobs/us/search/1");
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("results_per_page", "30");
  // `what_or` matches any of the given words (OR), unlike `what`, which
  // requires all of them (AND) — with a dozen multi-word resume skill
  // phrases combined, an AND match would reliably return zero results.
  url.searchParams.set("what_or", terms);
  url.searchParams.set("content-type", "application/json");
  if (params.remoteOnly) {
    url.searchParams.set("where", "remote");
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    console.error("[adzuna] request failed", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as { results?: AdzunaResult[] };

  return (data.results ?? []).map((job) => ({
    source: "adzuna" as const,
    externalId: job.id,
    title: job.title,
    company: job.company?.display_name ?? null,
    location: job.location?.display_name ?? null,
    remote: /remote/i.test(job.location?.display_name ?? "") || params.remoteOnly,
    url: job.redirect_url,
    description: job.description,
    postedAt: job.created ?? null,
  }));
}
