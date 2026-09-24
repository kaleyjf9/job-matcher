import { decodeHtmlEntities } from "../decode-html-entities";
import type { RawJob, SearchParams } from "../types";

type RemoteOkResult = {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  location?: string;
  url?: string;
  description?: string;
  tags?: string[];
  date?: string;
};

/**
 * RemoteOK has a public, unauthenticated JSON feed of remote jobs.
 * https://remoteok.com/api
 */
export async function searchRemoteOk(params: SearchParams): Promise<RawJob[]> {
  const res = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "job-matcher (personal use)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as RemoteOkResult[];
  // The API returns a legal notice as the first array element; skip non-job rows.
  const jobs = data.filter((row) => row.position && row.id);

  // No pre-filtering here: RemoteOK's whole feed is a few hundred jobs at
  // most, so it's cheap to hand everything to the central resume/keyword
  // scorer in matcher.ts rather than risk a strict substring filter zeroing
  // out results before scoring even runs.
  void params;

  return jobs.map((job) => ({
    source: "remoteok" as const,
    externalId: job.id!,
    title: decodeHtmlEntities(job.position!),
    company: job.company ? decodeHtmlEntities(job.company) : null,
    location: job.location ? decodeHtmlEntities(job.location).replace(/,\s*$/, "") : "Remote",
    remote: true,
    url: job.url ?? `https://remoteok.com/remote-jobs/${job.slug ?? job.id}`,
    description: job.description ? decodeHtmlEntities(job.description) : "",
    postedAt: job.date ?? null,
  }));
}
