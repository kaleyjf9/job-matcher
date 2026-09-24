import { createAdminClient } from "@/lib/supabase/admin";
import { searchAdzuna } from "./sources/adzuna";
import { searchRemoteOk } from "./sources/remoteok";
import { searchUsaJobs } from "./sources/usajobs";
import { scoreAndRankJobs } from "./matcher";
import type { RawJob } from "./types";

type Profile = {
  id: string;
  resume_text: string | null;
  keywords: string[];
  remote_only: boolean;
};

/** Builds a short search query from the most distinctive words in the resume. */
function queryFromResume(resumeText: string): string {
  const words = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w)
    .join(" ");
}

async function fetchJobsForProfile(profile: Profile): Promise<ReturnType<typeof scoreAndRankJobs>> {
  const resumeText = profile.resume_text ?? "";
  const query = queryFromResume(resumeText);
  const params = {
    query,
    keywords: profile.keywords ?? [],
    remoteOnly: profile.remote_only ?? false,
  };

  const results = await Promise.allSettled([
    searchAdzuna(params),
    searchRemoteOk(params),
    searchUsaJobs(params),
  ]);

  const allJobs: RawJob[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  return scoreAndRankJobs(allJobs, resumeText, params.keywords, params.remoteOnly);
}

/**
 * Runs the daily scan for every user who has a resume on file, scoring fresh
 * job postings against their resume/keywords and upserting the results.
 * Intended to be called once a day from the Vercel Cron route.
 */
export async function runDailyScan() {
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, resume_text, keywords, remote_only")
    .not("resume_text", "is", null);

  if (error) throw error;

  let usersScanned = 0;
  let jobsInserted = 0;

  for (const profile of profiles ?? []) {
    const scored = await fetchJobsForProfile(profile);
    usersScanned += 1;
    if (scored.length === 0) continue;

    const rows = scored.map((job) => ({
      user_id: profile.id,
      source: job.source,
      external_id: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
      url: job.url,
      description: job.description,
      score: job.score,
      matched_keywords: job.matchedKeywords,
      posted_at: job.postedAt,
    }));

    const { error: upsertError, count } = await admin
      .from("job_matches")
      .upsert(rows, { onConflict: "user_id,source,external_id", count: "exact" });

    if (upsertError) throw upsertError;
    jobsInserted += count ?? 0;
  }

  return { usersScanned, jobsInserted };
}
