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

/**
 * USAJobs covers federal roles, including DoD/defense and cyber positions.
 * Free key: https://developer.usajobs.gov
 */
export async function searchUsaJobs(params: SearchParams): Promise<RawJob[]> {
  if (!API_KEY || !USER_AGENT) return [];

  const keywords = [params.query, ...params.keywords].filter(Boolean).join(" ");
  const url = new URL("https://data.usajobs.gov/api/search");
  url.searchParams.set("Keyword", keywords);
  url.searchParams.set("ResultsPerPage", "30");
  if (params.remoteOnly) {
    url.searchParams.set("RemoteIndicator", "true");
  }

  const res = await fetch(url.toString(), {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": USER_AGENT,
      "Authorization-Key": API_KEY,
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
      remote: params.remoteOnly,
      url: d.PositionURI,
      description: d.UserArea?.Details?.JobSummary ?? "",
      postedAt: d.PublicationStartDate ?? null,
    };
  });
}
