import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-semibold tracking-tight">Job Matcher</span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            Try it
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
        <p className="text-sm text-muted">A tool I built for myself, sharing it in case it&apos;s useful to you too.</p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          I got tired of checking USAJobs and RemoteOK every morning, so I made something to do it for me.
        </h1>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-muted">
          <p>
            I&apos;m a Marine Corps veteran job-hunting for federal, cyber, and
            automation roles. Every board has its own search, its own
            filters, and none of them tell you if you&apos;re actually a fit —
            you just have to read every posting yourself.
          </p>
          <p>
            So this pulls the skills straight off your resume, checks them
            against fresh postings from Adzuna, RemoteOK, and USAJobs every
            day, and only shows you the ones worth your time. No keywords to
            maintain, no AI subscription, nothing to configure — upload your
            resume once and it just runs.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
          >
            Upload your resume
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Already have an account →
          </Link>
        </div>

        <div className="mt-16 border-t border-border pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-subtle">
            How it actually works
          </p>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-subtle">Resume</dt>
              <dd className="text-muted">
                We read your Skills section directly — no manual tagging.
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-subtle">Keywords</dt>
              <dd className="text-muted">
                Optional. Add &quot;cyber,&quot; &quot;remote,&quot; whatever
                — or leave it blank.
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0 text-muted-subtle">Every day</dt>
              <dd className="text-muted">
                A scan runs, scores new postings, and updates your dashboard.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="px-6 py-6 text-xs text-muted-subtle sm:px-10">
        Built by Kaley. No data sold, no AI middleman — just keyword matching against public job APIs.
      </footer>
    </main>
  );
}
