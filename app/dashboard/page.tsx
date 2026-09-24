import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Welcome!</h1>
        <p className="text-gray-600">
          Upload your resume to start getting daily job matches.
        </p>
        <Link
          href="/dashboard/profile"
          className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white"
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
    ? new Date(matches[0].found_at).toLocaleString()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your matches</h1>
        {lastScan && (
          <span className="text-sm text-gray-500">Last scan: {lastScan}</span>
        )}
      </div>

      {(!matches || matches.length === 0) && (
        <p className="text-gray-600">
          No matches yet — the daily scan runs once a day. Check back tomorrow,
          or adjust your keywords to widen the search.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {matches?.map((job) => (
          <li key={job.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {job.title}
                </a>
                <p className="text-sm text-gray-600">
                  {job.company ?? "Unknown company"}
                  {job.location ? ` — ${job.location}` : ""}
                  {job.remote ? " — Remote" : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                {job.score}% match
              </span>
            </div>
            {job.matched_keywords?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {job.matched_keywords.map((kw: string) => (
                  <span
                    key={kw}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
              {job.source}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
