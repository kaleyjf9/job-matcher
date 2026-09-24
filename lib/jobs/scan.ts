import { createAdminClient } from "@/lib/supabase/admin";
import { extractResumeKeywords } from "@/lib/resume/extract-keywords";
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

async function fetchJobsForProfile(profile: Profile): Promise<ReturnType<typeof scoreAndRankJobs>> {
  const resumeText = profile.resume_text ?? "";
  const userKeywords = profile.keywords ?? [];

  // Resume skills/experience always drive matching, regardless of whether
  // the user typed anything into the keywords box.
  const resumeKeywords = extractResumeKeywords(resumeText, 15);

  const params = {
    query: resumeKeywords.slice(0, 8).join(" "),
    // Sent to job APIs that do their own text search (Adzuna/USAJobs) — a
    // broader combined set gives those a wider net to search against.
    keywords: [...new Set([...resumeKeywords, ...userKeywords])],
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

  return scoreAndRankJobs(allJobs, resumeKeywords, userKeywords, params.remoteOnly);
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

    // Replace this user's list each run rather than accumulating forever —
    // a posting that no longer clears the score threshold (or that scored
    // well under stale matching logic from a previous deploy) shouldn't
    // linger on the dashboard indefinitely.
    const { error: deleteError } = await admin
      .from("job_matches")
      .delete()
      .eq("user_id", profile.id);
    if (deleteError) throw deleteError;

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

    const { error: insertError, count } = await admin
      .from("job_matches")
      .insert(rows, { count: "exact" });

    if (insertError) throw insertError;
    jobsInserted += count ?? 0;
  }

  return { usersScanned, jobsInserted };
}
