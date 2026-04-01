import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateStory,
  generateCarousel,
  generateReelScript,
  generateReport,
  generateIdeas,
} from "@/lib/ai";

// This endpoint is called by a cron job or a scheduled task at 8:30 AM daily.
// Protect it with a shared secret.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-schedule-secret");
  if (auth !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const topics = [
    "Bali real estate market",
    "Indonesia startup ecosystem",
    "Bali tourism recovery",
    "Southeast Asia investment trends",
    "Bali hospitality industry",
  ];

  let generated = 0;
  const errors: string[] = [];

  try {
    // Generate 1 story
    const story = await generateStory();
    await prisma.content.create({
      data: {
        type: "story",
        title: story.title,
        body: JSON.stringify(story),
        tags: JSON.stringify(story.tags),
        metadata: JSON.stringify({ backgroundTheme: story.backgroundTheme }),
      },
    });
    generated++;
  } catch (e) {
    errors.push(`story: ${e}`);
  }

  try {
    // Generate 1 carousel
    const carousel = await generateCarousel();
    await prisma.content.create({
      data: {
        type: "carousel",
        title: carousel.title,
        body: JSON.stringify(carousel),
        tags: JSON.stringify(carousel.tags),
      },
    });
    generated++;
  } catch (e) {
    errors.push(`carousel: ${e}`);
  }

  try {
    // Generate 1 reel script
    const reel = await generateReelScript();
    await prisma.content.create({
      data: {
        type: "reel",
        title: reel.title,
        body: JSON.stringify(reel),
        tags: JSON.stringify(reel.tags),
        metadata: JSON.stringify({ subtitle: reel.subtitle, duration: reel.duration }),
      },
    });
    generated++;
  } catch (e) {
    errors.push(`reel: ${e}`);
  }

  // Generate 5 reports
  for (const topic of topics) {
    try {
      const report = await generateReport(topic);
      await prisma.content.create({
        data: {
          type: "report",
          title: report.title,
          body: JSON.stringify(report),
          tags: JSON.stringify(report.tags),
        },
      });
      generated++;
    } catch (e) {
      errors.push(`report(${topic}): ${e}`);
    }
  }

  try {
    // Generate 3 ideas
    const ideas = await generateIdeas(3);
    await Promise.all(
      ideas.map((idea) =>
        prisma.idea.create({ data: { category: idea.category, title: idea.title, body: idea.body } })
      )
    );
    generated++;
  } catch (e) {
    errors.push(`ideas: ${e}`);
  }

  await prisma.scheduleLog.create({
    data: {
      status: errors.length === 0 ? "success" : "error",
      message: errors.length > 0 ? errors.join("; ") : `Generated ${generated} items`,
    },
  });

  return NextResponse.json({ generated, errors });
}

// GET returns last schedule logs
export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-schedule-secret");
  if (auth !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.scheduleLog.findMany({
    orderBy: { runAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ logs });
}
