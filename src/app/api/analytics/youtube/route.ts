import { NextResponse } from "next/server";

const YT_API_KEY = process.env.YOUTUBE_API_KEY ?? "AIzaSyDhTOnQCpQXfYPsff1KUmM2zkjPx2gOkFo";

export async function GET() {
  try {
    // Step 1: Search for Bali Business Club channel
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Bali+Business+Club&type=channel&maxResults=3&key=${YT_API_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items?.length) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Pick the most relevant result (first one)
    const channelItem = searchData.items[0];
    const channelId = channelItem.id?.channelId || channelItem.snippet?.channelId;

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID not found" }, { status: 404 });
    }

    // Step 2: Get channel statistics
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${YT_API_KEY}`
    );
    const statsData = await statsRes.json();

    if (!statsData.items?.length) {
      return NextResponse.json({ error: "Channel stats not found" }, { status: 404 });
    }

    const channel = statsData.items[0];
    const stats = channel.statistics;

    // Step 3: Get recent videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=6&type=video&key=${YT_API_KEY}`
    );
    const videosData = await videosRes.json();

    // Step 4: Get video stats for recent videos
    const videoIds = videosData.items?.map((v: { id: { videoId: string } }) => v.id?.videoId).filter(Boolean).join(",");
    let videoStats: Record<string, { viewCount: string; likeCount: string }> = {};

    if (videoIds) {
      const vStatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YT_API_KEY}`
      );
      const vStatsData = await vStatsRes.json();
      if (vStatsData.items) {
        for (const v of vStatsData.items) {
          videoStats[v.id] = v.statistics;
        }
      }
    }

    return NextResponse.json({
      channelId,
      channelTitle: channel.snippet?.title ?? "Bali Business Club",
      channelDescription: channel.snippet?.description ?? "",
      channelThumbnail: channel.snippet?.thumbnails?.default?.url ?? "",
      subscriberCount: parseInt(stats?.subscriberCount ?? "0"),
      viewCount: parseInt(stats?.viewCount ?? "0"),
      videoCount: parseInt(stats?.videoCount ?? "0"),
      recentVideos: (videosData.items ?? []).map((v: {
        id: { videoId: string };
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: { medium: { url: string } };
          description: string;
        };
      }) => ({
        id: v.id?.videoId,
        title: v.snippet?.title,
        publishedAt: v.snippet?.publishedAt,
        thumbnail: v.snippet?.thumbnails?.medium?.url,
        description: v.snippet?.description,
        viewCount: parseInt(videoStats[v.id?.videoId]?.viewCount ?? "0"),
        likeCount: parseInt(videoStats[v.id?.videoId]?.likeCount ?? "0"),
      })),
    });
  } catch (err) {
    console.error("YouTube API error:", err);
    return NextResponse.json(
      { error: "YouTube API failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
