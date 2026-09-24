"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Reads an API error message defensively — the response may not be JSON
 * (e.g. a framework-level 500 page) if the route handler crashed. */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function ProfileForm({
  initialKeywords,
  initialRemoteOnly,
  hasResume,
}: {
  initialKeywords: string[];
  initialRemoteOnly: boolean;
  hasResume: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [keywordsInput, setKeywordsInput] = useState(initialKeywords.join(", "));
  const [remoteOnly, setRemoteOnly] = useState(initialRemoteOnly);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    try {
      if (file) {
        const formData = new FormData();
        formData.append("resume", file);
        const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(await readErrorMessage(res, "Upload failed"));
      }

      const keywords = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, remoteOnly }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to save keywords"));

      setStatus("saved");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Resume</label>
        <label
          htmlFor="resume-upload"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand-soft/40"
        >
          <FileIcon />
          <span className="text-sm">
            {file ? (
              <span className="font-medium">{file.name}</span>
            ) : hasResume ? (
              <>
                <span className="font-medium text-foreground">A resume is on file.</span>{" "}
                <span className="text-muted">Click to replace it.</span>
              </>
            ) : (
              <>
                <span className="font-medium text-brand">Click to upload</span>{" "}
                <span className="text-muted">a PDF or .txt resume</span>
              </>
            )}
          </span>
          <input
            ref={fileInputRef}
            id="resume-upload"
            type="file"
            accept="application/pdf,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Keywords <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="defense tech, cyber, intern, remote"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
        <p className="text-xs text-muted">
          Comma-separated. Leave blank and we&apos;ll match on your resume&apos;s skills alone.
        </p>
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => setRemoteOnly(e.target.checked)}
          className="size-4 rounded border-border accent-[var(--brand)]"
        />
        Remote roles only
      </label>

      {errorMessage && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
          {errorMessage}
        </p>
      )}
      {status === "saved" && (
        <p className="rounded-md bg-success-soft px-3 py-2 text-sm text-success-soft-foreground">
          Saved — your next daily scan will use this.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-fit rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function FileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="text-muted"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
