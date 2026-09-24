import type { RawJob, ScoredJob } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "a", "an", "to",
  "of", "in", "on", "or", "is", "as", "at", "by", "be", "we", "will", "this",
  "that", "from", "have", "has", "it", "job", "role", "team", "work",
]);

/** Pulls out meaningful words, ignoring short/common ones, for overlap scoring. */
function extractTerms(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Scores a job 0-100 against a resume's text and the user's chosen keywords.
 * Not AI-based: it's a weighted overlap between resume vocabulary and the
 * job's title/description, with a bonus for hitting the user's own keywords
 * and for remote postings when the user asked for remote-only.
 */
export function scoreJob(
  job: RawJob,
  resumeText: string,
  keywords: string[],
  remoteOnly: boolean
): ScoredJob {
  const resumeTerms = extractTerms(resumeText);
  const jobTerms = extractTerms(`${job.title} ${job.description}`);

  let overlap = 0;
  for (const term of jobTerms) {
    if (resumeTerms.has(term)) overlap += 1;
  }
  const overlapScore = jobTerms.size > 0 ? overlap / jobTerms.size : 0;

  const matchedKeywords = keywords.filter((kw) => {
    const needle = kw.toLowerCase().trim();
    if (!needle) return false;
    return `${job.title} ${job.description}`.toLowerCase().includes(needle);
  });
  const keywordScore =
    keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  const remoteBonus = remoteOnly && job.remote ? 1 : remoteOnly ? 0 : 0.5;

  // Weighted blend: resume fit matters most, then requested keywords, then remote fit.
  const score = overlapScore * 60 + keywordScore * 30 + remoteBonus * 10;

  return {
    ...job,
    score: Math.round(Math.min(100, score)),
    matchedKeywords,
  };
}

export function scoreAndRankJobs(
  jobs: RawJob[],
  resumeText: string,
  keywords: string[],
  remoteOnly: boolean,
  minScore = 35
): ScoredJob[] {
  return jobs
    .map((job) => scoreJob(job, resumeText, keywords, remoteOnly))
    .filter((job) => job.score >= minScore)
    .sort((a, b) => b.score - a.score);
}
