"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <Link href="/" className="text-sm font-semibold tracking-tight text-muted">
          Job Matcher
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Welcome back</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/40"
            placeholder="••••••••"
          />
        </label>
        {errorMessage && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-brand hover:text-brand-hover">
          Sign up
        </Link>
      </p>
    </main>
  );
}
