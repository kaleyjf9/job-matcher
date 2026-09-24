import Link from "next/link";

const steps = [
  {
    title: "Upload your resume",
    body: "PDF or plain text. We pull real skills straight from your Skills section — no manual tagging required.",
  },
  {
    title: "Add keywords, optionally",
    body: "Nudge results toward what you care about — defense tech, cyber, intern, remote — or leave it blank and let your resume drive it.",
  },
  {
    title: "Check back daily",
    body: "Every day we scan fresh postings from Adzuna, RemoteOK, and USAJobs and rank what's actually relevant to you.",
  },
];

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
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center sm:px-10">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-soft-foreground">
          Free job sources · no AI cost to run
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Stop scrolling job boards. Let your resume do it for you.
        </h1>
        <p className="max-w-lg text-lg text-muted text-balance">
          Upload your resume once. Every day, we scan fresh postings and show
          you the ones you&apos;re actually qualified for.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-card"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 pb-20 sm:grid-cols-3 sm:px-10">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-lg border border-border bg-card p-5 text-left"
          >
            <span className="text-xs font-semibold text-brand">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
