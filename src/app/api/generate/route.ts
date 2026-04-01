import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  generateStory, generateCarousel, generateReelScript,
  generateReport, generateIdeas,
} from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check API key is configured
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here" || !apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Go to Settings and add your ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  const { type, topic, count } = await req.json();

  try {
    if (type === "story") {
      const data = await generateStory(topic);
      const content = await prisma.content.create({
        data: {
          type: "story",
          title: data.title,
          body: JSON.stringify(data),
          tags: JSON.stringify(data.tags),
          metadata: JSON.stringify({ backgroundTheme: data.backgroundTheme }),
        },
      });
      return NextResponse.json({ content: { ...content, isFavorite: false } });
    }

    if (type === "carousel") {
      const data = await generateCarousel(topic);
      const content = await prisma.content.create({
        data: {
          type: "carousel",
          title: data.title,
          body: JSON.stringify(data),
          tags: JSON.stringify(data.tags),
        },
      });
      return NextResponse.json({ content: { ...content, isFavorite: false } });
    }

    if (type === "reel") {
      const data = await generateReelScript(topic);
      const content = await prisma.content.create({
        data: {
          type: "reel",
          title: data.title,
          body: JSON.stringify(data),
          tags: JSON.stringify(data.tags),
          metadata: JSON.stringify({ subtitle: data.subtitle, duration: data.duration }),
        },
      });
      return NextResponse.json({ content: { ...content, isFavorite: false } });
    }

    if (type === "report") {
      const data = await generateReport(topic);
      const content = await prisma.content.create({
        data: {
          type: "report",
          title: data.title,
          body: JSON.stringify(data),
          tags: JSON.stringify(data.tags),
        },
      });
      return NextResponse.json({ content: { ...content, isFavorite: false } });
    }

    if (type === "ideas") {
      const ideas = await generateIdeas(count ?? 5);
      const created = await Promise.all(
        ideas.map((idea) =>
          prisma.idea.create({
            data: { category: idea.category, title: idea.title, body: idea.body },
          })
        )
      );
      return NextResponse.json({ ideas: created });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Generate error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("api_key")) {
      return NextResponse.json({ error: "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY." }, { status: 503 });
    }
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 });
  }
}
