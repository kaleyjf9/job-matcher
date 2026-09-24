"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
          <MailIcon />
        </div>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Click it to activate your account.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <Link href="/" className="text-sm font-semibold tracking-tight text-muted">
          Job Matcher
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Upload your resume and get matched to jobs daily.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputStyles}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputStyles}
            placeholder="At least 6 characters"
          />
        </Field>
        {errorMessage && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-1 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {status === "loading" ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Log in
        </Link>
      </p>
    </main>
  );
}

const inputStyles =
  "rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/40 focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
