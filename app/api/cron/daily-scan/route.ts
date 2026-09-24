import { NextRequest, NextResponse } from "next/server";
import { runDailyScan } from "@/lib/jobs/scan";

export const maxDuration = 300; // allow up to 5 minutes for a full scan

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyScan();
  return NextResponse.json({ ok: true, ...result });
}
