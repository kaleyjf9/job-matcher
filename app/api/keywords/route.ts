import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as {
    keywords?: string[];
    remoteOnly?: boolean;
  };

  const keywords = (body.keywords ?? [])
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 20);

  const { error } = await supabase
    .from("profiles")
    .update({
      keywords,
      remote_only: Boolean(body.remoteOnly),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
