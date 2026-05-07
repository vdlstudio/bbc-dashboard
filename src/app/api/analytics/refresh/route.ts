import { NextRequest, NextResponse } from "next/server";

// This endpoint is called by Vercel Cron daily.
// It triggers all analytics data sources to refresh their cache.
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent abuse
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "bbc-cron-2026";

  // Allow either the cron secret or internal calls (from same origin)
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    req.headers.get("x-vercel-cron") === "1";

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ??
    `https://${req.headers.get("host")}`;

  const results: Record<string, string> = {};

  // Refresh YouTube data
  try {
    const ytRes = await fetch(`${baseUrl}/api/analytics/youtube`, {
      next: { revalidate: 0 },
      headers: { "Cache-Control": "no-cache" },
    });
    results.youtube = ytRes.ok ? "ok" : `error ${ytRes.status}`;
  } catch (e) {
    results.youtube = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Refresh Meta data
  try {
    const metaRes = await fetch(`${baseUrl}/api/analytics/meta`, {
      next: { revalidate: 0 },
      headers: { "Cache-Control": "no-cache" },
    });
    results.meta = metaRes.ok ? "ok" : `error ${metaRes.status}`;
  } catch (e) {
    results.meta = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Refresh Google Sheets data
  try {
    const sheetsRes = await fetch(`${baseUrl}/api/analytics/sheets`, {
      next: { revalidate: 0 },
      headers: { "Cache-Control": "no-cache" },
    });
    results.sheets = sheetsRes.ok ? "ok" : `error ${sheetsRes.status}`;
  } catch (e) {
    results.sheets = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    message: "Analytics refresh complete",
    results,
    refreshedAt: new Date().toISOString(),
  });
}
