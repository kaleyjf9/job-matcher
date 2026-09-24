export type RawJob = {
  source: "adzuna" | "remoteok" | "usajobs";
  externalId: string;
  title: string;
  company: string | null;
  location: string | null;
  remote: boolean;
  url: string;
  description: string;
  postedAt: string | null; // ISO date string, if the source provides one
};

export type ScoredJob = RawJob & {
  score: number; // 0-100
  matchedKeywords: string[];
};

export type SearchParams = {
  /** Free-text query terms, e.g. from the user's resume top skills. */
  query: string;
  /** User-entered tags like "defense tech", "cyber", "intern", "remote". */
  keywords: string[];
  remoteOnly: boolean;
};
