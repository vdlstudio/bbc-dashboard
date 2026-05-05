import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateStory,
  generateCarousel,
  generateReelScript,
  generateReport,
  generateIdeas,
} from "@/lib/ai";

const DEFAULT_COUNTS = {
  stories: 1,
  carousels: 1,
  reels: 1,
  reports: 5,
  ideas: 3,
};

const REPORT_TOPICS = [
  "Bali real estate market",
  "Indonesia startup ecosystem",
  "Bali tourism recovery",
  "Southeast Asia investment trends",
  "Bali hospitality industry",
  "Canggu and Seminyak land prices",
  "Bali villa ROI analysis 2026",
  "Indonesia GDP and economic outlook",
  "Bali digital nomad market",
  "Uluwatu luxury property market",
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-schedule-secret");
  if (auth !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse optional counts from body
  let counts = { ...DEFAULT_COUNTS };
  try {
    const body = await req.json();
    if (body.counts) {
      counts = { ...DEFAULT_COUNTS, ...body.counts };
    }
  } catch { /* no body or invalid JSON */ }

  let generated = 0;
  const errors: string[] = [];

  // ── Stories ──────────────────────────────────────────────────────────────
  for (let i = 0; i < counts.stories; i++) {
    try {
      const story = await generateStory();
      await prisma.content.create({
        data: {
          type: "story",
          title: story.headline,
          body: JSON.stringify(story),
          tags: JSON.stringify(story.tags),
          metadata: JSON.stringify({ category: story.category, source: story.source }),
        },
      });
      generated++;
    } catch (e) {
      errors.push(`story[${i}]: ${e}`);
    }
  }

  // ── Carousels ─────────────────────────────────────────────────────────────
  for (let i = 0; i < counts.carousels; i++) {
    try {
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
      errors.push(`carousel[${i}]: ${e}`);
    }
  }

  // ── Reels ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < counts.reels; i++) {
    try {
      const reel = await generateReelScript();
      await prisma.content.create({
        data: {
          type: "reel",
          title: reel.title,
          body: JSON.stringify(reel),
          tags: JSON.stringify(reel.tags),
          metadata: JSON.stringify({ category: reel.category, duration: reel.duration }),
        },
      });
      generated++;
    } catch (e) {
      errors.push(`reel[${i}]: ${e}`);
    }
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  for (let i = 0; i < counts.reports; i++) {
    const topic = REPORT_TOPICS[i % REPORT_TOPICS.length];
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
      errors.push(`report[${i}](${topic}): ${e}`);
    }
  }

  // ── Ideas ─────────────────────────────────────────────────────────────────
  if (counts.ideas > 0) {
    try {
      const ideas = await generateIdeas(counts.ideas);
      await Promise.all(
        ideas.map((idea) =>
          prisma.idea.create({ data: { category: idea.category, title: idea.title, body: idea.body } })
        )
      );
      generated++;
    } catch (e) {
      errors.push(`ideas: ${e}`);
    }
  }

  await prisma.scheduleLog.create({
    data: {
      status: errors.length === 0 ? "success" : "error",
      message: errors.length > 0 ? errors.join("; ") : `Generated ${generated} items`,
    },
  });

  return NextResponse.json({ generated, errors, counts });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-schedule-secret");
  if (auth !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const logs = await prisma.scheduleLog.findMany({ orderBy: { runAt: "desc" }, take: 10 });
  return NextResponse.json({ logs });
}
