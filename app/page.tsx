import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-semibold">Job Matcher</h1>
      <p className="text-lg text-gray-600">
        Upload your resume once. Every day, we scan fresh job postings and
        show you the ones you&apos;re actually qualified for — filtered by
        keywords like defense tech, cyber, intern, or remote.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-black px-5 py-2.5 text-white"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2.5"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
