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
 */
export async function searchAdzuna(params: SearchParams): Promise<RawJob[]> {
  if (!APP_ID || !APP_KEY) return [];

  const terms = [params.query, ...params.keywords].filter(Boolean).join(" ");
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
  if (!res.ok) return [];

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
