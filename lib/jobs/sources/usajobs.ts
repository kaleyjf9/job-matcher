import type { RawJob, SearchParams } from "../types";

const API_KEY = process.env.USAJOBS_API_KEY;
const USER_AGENT = process.env.USAJOBS_USER_AGENT;

type UsaJobsResult = {
  MatchedObjectId: string;
  MatchedObjectDescriptor: {
    PositionTitle: string;
    OrganizationName?: string;
    PositionLocationDisplay?: string;
    PositionURI: string;
    UserArea?: { Details?: { JobSummary?: string } };
    PublicationStartDate?: string;
  };
};

async function searchOneTerm(term: string, remoteOnly: boolean): Promise<RawJob[]> {
  const url = new URL("https://data.usajobs.gov/api/search");
  url.searchParams.set("Keyword", term);
  url.searchParams.set("ResultsPerPage", "20");
  if (remoteOnly) {
    url.searchParams.set("RemoteIndicator", "true");
  }

  const res = await fetch(url.toString(), {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": USER_AGENT!,
      "Authorization-Key": API_KEY!,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    SearchResult?: { SearchResultItems?: UsaJobsResult[] };
  };

  return (data.SearchResult?.SearchResultItems ?? []).map((item) => {
    const d = item.MatchedObjectDescriptor;
    return {
      source: "usajobs" as const,
      externalId: item.MatchedObjectId,
      title: d.PositionTitle,
      company: d.OrganizationName ?? null,
      location: d.PositionLocationDisplay ?? null,
      remote: remoteOnly,
      url: d.PositionURI,
      description: d.UserArea?.Details?.JobSummary ?? "",
      postedAt: d.PublicationStartDate ?? null,
    };
  });
}

/**
 * USAJobs covers federal roles, including DoD/defense and cyber positions.
 * Free key: https://developer.usajobs.gov
 *
 * USAJobs' `Keyword` param matches literally/conjunctively — a query like
 * "GoHighLevel CRM Automation Microsoft Azure" (all your resume's skill
 * phrases joined together) reliably returns zero results, since no single
 * posting contains every one of those words. Instead, search each term on
 * its own (a handful, run in parallel) and merge/dedupe the results.
 */
export async function searchUsaJobs(params: SearchParams): Promise<RawJob[]> {
  if (!API_KEY || !USER_AGENT) return [];

  const terms = [...new Set([params.query, ...params.keywords])]
    .filter(Boolean)
    .slice(0, 6);
  if (terms.length === 0) return [];

  const results = await Promise.allSettled(
    terms.map((term) => searchOneTerm(term, params.remoteOnly))
  );

  const byId = new Map<string, RawJob>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const job of r.value) byId.set(job.externalId, job);
  }
  return [...byId.values()];
}
