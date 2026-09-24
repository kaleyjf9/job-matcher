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

  const terms = [params.query, ...params.keywords]
    .filter(Boolean)
    .map((t) => t.toLowerCase());

  return jobs
    .filter((job) => {
      if (terms.length === 0) return true;
      const haystack = `${job.position} ${job.description ?? ""} ${(job.tags ?? []).join(" ")}`.toLowerCase();
      return terms.some((term) => haystack.includes(term));
    })
    .map((job) => ({
      source: "remoteok" as const,
      externalId: job.id!,
      title: job.position!,
      company: job.company ?? null,
      location: job.location ?? "Remote",
      remote: true,
      url: job.url ?? `https://remoteok.com/remote-jobs/${job.slug ?? job.id}`,
      description: job.description ?? "",
      postedAt: job.date ?? null,
    }));
}
