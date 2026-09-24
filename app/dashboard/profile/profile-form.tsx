"use client";

import { useState } from "react";
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
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Resume (PDF or .txt)</label>
        {hasResume && !file && (
          <p className="text-sm text-gray-500">
            A resume is on file. Upload a new one to replace it.
          </p>
        )}
        <input
          type="file"
          accept="application/pdf,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Keywords (comma-separated — e.g. defense tech, cyber, intern)
        </label>
        <input
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="defense tech, cyber, intern, remote"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={remoteOnly}
          onChange={(e) => setRemoteOnly(e.target.checked)}
        />
        Remote roles only
      </label>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {status === "saved" && (
        <p className="text-sm text-green-600">Saved — your next daily scan will use this.</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
