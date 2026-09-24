import type { RawJob, ScoredJob } from "./types";

/** Escapes a string for safe use inside a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True if `term` appears in `haystack` as a whole word/phrase — not as a
 * substring of some unrelated word. Plain `.includes()` would match "GHL"
 * inside "highly", which is exactly the kind of false positive that makes
 * keyword-based matching useless without this check.
 */
function containsTerm(haystack: string, term: string): boolean {
  const escaped = escapeRegex(term.trim());
  if (!escaped) return false;
  // \b doesn't work well around terms that start/end with non-word characters
  // (e.g. "A2P 10DLC" is fine, but "C++" or "Node.js" need a softer boundary),
  // so fall back to a non-word-or-string-edge boundary on both sides.
  const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
  return pattern.test(haystack);
}

/**
 * Scores a job 0-100 against the skills/terms pulled from a resume (see
 * lib/resume/extract-keywords.ts) and any topic keywords the user typed in
 * (e.g. "defense tech", "remote"). Not AI-based — pure keyword matching,
 * kept deliberately simple and free to run.
 *
 * Weighting: how much of the resume's own skill set the posting mentions
 * matters most (70%), explicit user keywords are a secondary signal (20%),
 * and remote fit is a small bonus (10%).
 */
export function scoreJob(
  job: RawJob,
  resumeKeywords: string[],
  userKeywords: string[],
  remoteOnly: boolean
): ScoredJob {
  const haystack = `${job.title} ${job.description}`;

  const matchedSkills = resumeKeywords.filter((k) => containsTerm(haystack, k));
  const skillScore =
    resumeKeywords.length > 0 ? matchedSkills.length / resumeKeywords.length : 0;

  const matchedUserKeywords = userKeywords.filter((k) => containsTerm(haystack, k));
  const keywordScore =
    userKeywords.length > 0 ? matchedUserKeywords.length / userKeywords.length : 0;

  const remoteBonus = remoteOnly ? (job.remote ? 1 : 0) : 0.5;

  // No free credit for an empty keywords box: when the user hasn't typed
  // any, the resume's own skills carry the full non-remote weight instead
  // of a flat score every posting would otherwise clear regardless of fit.
  const score =
    userKeywords.length > 0
      ? skillScore * 60 + keywordScore * 30 + remoteBonus * 10
      : skillScore * 90 + remoteBonus * 10;

  return {
    ...job,
    score: Math.round(Math.min(100, score)),
    matchedKeywords: [...new Set([...matchedSkills, ...matchedUserKeywords])],
  };
}

export function scoreAndRankJobs(
  jobs: RawJob[],
  resumeKeywords: string[],
  userKeywords: string[],
  remoteOnly: boolean,
  minScore = 8
): ScoredJob[] {
  return jobs
    .map((job) => scoreJob(job, resumeKeywords, userKeywords, remoteOnly))
    .filter((job) => job.score >= minScore)
    .sort((a, b) => b.score - a.score);
}
