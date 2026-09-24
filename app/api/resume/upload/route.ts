import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractResumeText } from "@/lib/resume/parse";

const ALLOWED_TYPES = new Set(["application/pdf", "text/plain"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only PDF or plain text resumes are supported" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (5MB max)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resumeText = await extractResumeText(buffer, file.type);

  if (resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: "Couldn't read enough text from that file — try a different export of your resume" },
      { status: 400 }
    );
  }

  const path = `${user.id}/resume-${Date.now()}.${file.type === "application/pdf" ? "pdf" : "txt"}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      resume_path: path,
      resume_text: resumeText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
