const GENERIC_STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "are", "our", "this", "that",
  "from", "have", "has", "was", "were", "will", "would", "should", "could",
  "their", "them", "they", "these", "those", "into", "onto", "over", "under",
  "about", "across", "after", "before", "between", "during", "through",
  "including", "such", "each", "also", "than", "then", "when", "where",
  "which", "while", "responsible", "responsibilities", "experience",
  "including", "using", "used", "use", "ensure", "ensured", "provide",
  "provided", "including", "within", "various", "including", "including",
]);

// Section headers whose content is the highest-signal source of real skills
// and job-title terms — resumes are structured this way on purpose.
const SKILL_SECTION_HEADERS =
  /^(technical skills|core competencies|skills|certifications|qualifications|areas of expertise|proficiencies|competencies)\s*:?$/i;

// A line is treated as a new section boundary once we're inside a skills
// section, so we stop collecting once the resume moves on to e.g. "EXPERIENCE".
const ANY_SECTION_HEADER = /^[A-Z][A-Z\s&/]{3,40}$/;

/**
 * Pulls out the most likely skill/role terms from raw resume text, without
 * any AI call: prioritizes explicit "Skills"/"Certifications" sections (if
 * present), then falls back to frequency-weighted meaningful words from the
 * whole document. Used both as the search query sent to job APIs and as the
 * term set scored against each posting.
 */
export function extractResumeKeywords(resumeText: string, limit = 12): string[] {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim());

  // Collect the skills section as one continuous string first — PDF text
  // extraction wraps long comma-separated lists across lines (e.g. "API" on
  // one line, "Integrations" on the next), so splitting line-by-line would
  // shred "API Integrations" into two meaningless single-word fragments.
  const sectionLines: string[] = [];
  let inSkillsSection = false;

  for (const line of lines) {
    if (!line) continue;

    if (SKILL_SECTION_HEADERS.test(line)) {
      inSkillsSection = true;
      continue;
    }
    if (inSkillsSection && ANY_SECTION_HEADER.test(line) && !SKILL_SECTION_HEADERS.test(line)) {
      inSkillsSection = false;
      continue;
    }
    if (inSkillsSection) sectionLines.push(line);
  }

  const GENERIC_FRAGMENT_WORDS = new Set([
    "development", "compliance", "integrations", "reporting", "management",
    "leadership", "administration", "troubleshooting", "operations",
    "improvement", "operational", "systems", "technical", "software",
    "platforms",
  ]);

  const sectionBlob = sectionLines.join(" ");
  const sectionTerms = new Set(
    sectionBlob
      .split(/[,•|·]/)
      .map((s) => s.replace(/^[a-z\s&]+:\s*/i, "").trim()) // drop inline sub-labels like "Technical Skills:"
      .filter((item) => item.length >= 3 && item.length <= 45)
      // Joining wrapped lines above reconnects most split phrases (e.g.
      // "API" + "Integrations" -> "API Integrations"), but a few single
      // words still land alone at a join point with no comma to anchor
      // them (e.g. "Systems Administration Management" splits oddly) —
      // drop only the specific generic leftovers, not real single-word
      // product names like "Zapier" or "Salesforce".
      .filter((item) => !GENERIC_FRAGMENT_WORDS.has(item.toLowerCase()))
  );

  if (sectionTerms.size >= 5) {
    return [...sectionTerms].slice(0, limit);
  }

  // Fallback: frequency-weighted single words across the whole resume,
  // filtered to a broader stopword list so common resume boilerplate
  // ("responsible", "experience") doesn't dominate.
  const words = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !GENERIC_STOPWORDS.has(w));

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
