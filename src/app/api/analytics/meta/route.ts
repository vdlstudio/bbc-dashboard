import { NextResponse } from "next/server";

const META_TOKEN = process.env.META_ACCESS_TOKEN ??
  "EAAUoHs4mZAHEBRT7WKhmWjP0Yagu1mObSVfIEY8ZAoDu2dcy0WhpEGYkuGOlpcHiFlhgPVntxJhcc7YCZBsxJwfKd3s8mnI0sueLXJcI561bwEZB88dxR1UdG6VuHzLV91HMmkXn4FGKcAI3Ug6T7m5C5n8m2xi1dpsVq6EIgGikigwaHOupXIH32kQSaRZBNkmcrQDHZC8xvEAhC2Tift7MmpxSpPeXcP39Rka3r5N0lKOePqrGZC5VHnmjNWIi1iaVZAhYwijZAjPRsPlWEKg8Hqi01QZDZD";

const GRAPH = "https://graph.facebook.com/v19.0";

async function gql<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", META_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Meta API error ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

interface PageData {
  id: string;
  name: string;
  fan_count: number;
  followers_count: number;
  instagram_business_account?: { id: string };
}

interface InsightValue {
  value: number;
  end_time: string;
}

interface InsightEntry {
  name: string;
  period: string;
  values: InsightValue[];
}

interface InsightsData {
  data: InsightEntry[];
}

interface IGData {
  id: string;
  username?: string;
  followers_count: number;
  media_count: number;
}

interface IGInsights {
  data: Array<{ name: string; period: string; values: Array<{ value: number; end_time: string }> }>;
}

export async function GET() {
  try {
    // ── Step 1: Get all pages managed by this token ──────────────────────────
    const accountsRes = await gql<{ data: Array<{ id: string; name: string; access_token: string }> }>(
      "/me/accounts",
      { fields: "id,name,access_token" }
    );

    if (!accountsRes.data?.length) {
      return NextResponse.json({ error: "No pages found for this token" }, { status: 404 });
    }

    // Find Bali Business Club page (first match, or first page)
    const bbcPage = accountsRes.data.find(p =>
      p.name.toLowerCase().includes("bali") || p.name.toLowerCase().includes("bbc")
    ) ?? accountsRes.data[0];

    // ── Step 2: Get page details + IG account ────────────────────────────────
    const pageData = await gql<PageData>(
      `/${bbcPage.id}`,
      {
        fields: "id,name,fan_count,followers_count,instagram_business_account",
        access_token: bbcPage.access_token,
      }
    );

    // ── Step 3: Get Facebook page insights (last 30 days) ────────────────────
    let fbReach = 0, fbImpressions = 0, fbEngaged = 0;
    try {
      const fbInsights = await gql<InsightsData>(
        `/${bbcPage.id}/insights`,
        {
          metric: "page_impressions,page_reach,page_post_engagements",
          period: "month",
          access_token: bbcPage.access_token,
        }
      );
      for (const entry of fbInsights.data ?? []) {
        const lastVal = entry.values?.[entry.values.length - 1]?.value ?? 0;
        if (entry.name === "page_reach") fbReach = lastVal;
        if (entry.name === "page_impressions") fbImpressions = lastVal;
        if (entry.name === "page_post_engagements") fbEngaged = lastVal;
      }
    } catch {
      // Insights may need extra permissions — degrade gracefully
    }

    // ── Step 4: Get Instagram data ───────────────────────────────────────────
    let igFollowers = 0, igMediaCount = 0, igReach = 0, igImpressions = 0;
    let igUsername = "";
    const igId = pageData.instagram_business_account?.id;

    if (igId) {
      try {
        const igData = await gql<IGData>(
          `/${igId}`,
          { fields: "id,username,followers_count,media_count", access_token: bbcPage.access_token }
        );
        igFollowers = igData.followers_count ?? 0;
        igMediaCount = igData.media_count ?? 0;
        igUsername = igData.username ?? "";

        const igInsights = await gql<IGInsights>(
          `/${igId}/insights`,
          {
            metric: "impressions,reach",
            period: "month",
            access_token: bbcPage.access_token,
          }
        );
        for (const entry of igInsights.data ?? []) {
          const lastVal = entry.values?.[entry.values.length - 1]?.value ?? 0;
          if (entry.name === "reach") igReach = lastVal;
          if (entry.name === "impressions") igImpressions = lastVal;
        }
      } catch {
        // IG insights optional
      }
    }

    return NextResponse.json({
      facebook: {
        pageId: bbcPage.id,
        pageName: pageData.name,
        fanCount: pageData.fan_count ?? 0,
        followersCount: pageData.followers_count ?? 0,
        reach: fbReach,
        impressions: fbImpressions,
        postEngagements: fbEngaged,
      },
      instagram: {
        igId,
        username: igUsername,
        followersCount: igFollowers,
        mediaCount: igMediaCount,
        reach: igReach,
        impressions: igImpressions,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Meta API error:", err);
    return NextResponse.json(
      { error: "Meta API failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
