import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SOURCE_LABELS: Record<string, string> = {
  adzuna: "Adzuna",
  remoteok: "RemoteOK",
  usajobs: "USAJobs",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_text, keywords")
    .eq("id", user!.id)
    .single();

  if (!profile?.resume_text) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
          <UploadIcon />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Welcome!</h1>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Upload your resume to start getting daily job matches — no
            keywords required, we&apos;ll pull your skills automatically.
          </p>
        </div>
        <Link
          href="/dashboard/profile"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
        >
          Upload resume
        </Link>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("job_matches")
    .select("*")
    .order("score", { ascending: false })
    .order("found_at", { ascending: false })
    .limit(50);

  const lastScan = matches?.[0]?.found_at
    ? new Date(matches[0].found_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your matches</h1>
          <p className="mt-1 text-sm text-muted">
            {matches?.length ?? 0} job{matches?.length === 1 ? "" : "s"} ranked against your resume
          </p>
        </div>
        {lastScan && (
          <span className="text-xs text-muted-subtle">Last scan · {lastScan}</span>
        )}
      </div>

      {(!matches || matches.length === 0) && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted">
            No matches yet — the daily scan runs once a day.
            <br />
            Check back tomorrow, or widen your keywords to see more.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {matches?.map((job) => (
          <li
            key={job.id}
            className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium leading-snug decoration-brand/40 underline-offset-2 group-hover:text-brand group-hover:underline"
                >
                  {job.title}
                </a>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {job.company ?? "Unknown company"}
                  {job.location ? ` · ${job.location}` : ""}
                  {job.remote ? " · Remote" : ""}
                </p>
              </div>
              <ScoreBadge score={job.score} />
            </div>

            {job.matched_keywords?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.matched_keywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-soft-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-subtle">
              {SOURCE_LABELS[job.source] ?? job.source}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 60
      ? "bg-success-soft text-success-soft-foreground"
      : score >= 30
        ? "bg-brand-soft text-brand-soft-foreground"
        : "bg-background text-muted border border-border";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${tone}`}
    >
      {score}% match
    </span>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 16V4M12 4 7 9M12 4l5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
