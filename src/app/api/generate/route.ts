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
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-api-key-here") {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Go to Settings and add your ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  // Also allow ping check from Settings tab
  const body = await req.json();
  if (body.type === "ping") {
    return NextResponse.json({ ok: true, configured: true });
  }

  const { type, topic, count } = body;

  try {
    if (type === "story") {
      const storyCount = Math.min(Math.max(parseInt(count ?? "1") || 1, 1), 10);
      if (storyCount === 1) {
        const data = await generateStory(topic);
        const content = await prisma.content.create({
          data: {
            type: "story",
            title: data.headline,
            body: JSON.stringify(data),
            tags: JSON.stringify(data.tags),
            metadata: JSON.stringify({ category: data.category, source: data.source }),
          },
        });
        return NextResponse.json({ content: { ...content, isFavorite: false } });
      } else {
        // Batch generation — generate all in parallel
        const results = await Promise.allSettled(
          Array.from({ length: storyCount }, () => generateStory(topic))
        );
        const contents = [];
        for (const result of results) {
          if (result.status === "fulfilled") {
            const data = result.value;
            const content = await prisma.content.create({
              data: {
                type: "story",
                title: data.headline,
                body: JSON.stringify(data),
                tags: JSON.stringify(data.tags),
                metadata: JSON.stringify({ category: data.category, source: data.source }),
              },
            });
            contents.push({ ...content, isFavorite: false });
          }
        }
        return NextResponse.json({ contents });
      }
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
          metadata: JSON.stringify({ category: data.category, duration: data.duration }),
        },
      });
      return NextResponse.json({ content: { ...content, isFavorite: false } });
    }

    if (type === "report") {
      let data;
      let lastErr: unknown;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          data = await generateReport(topic);
          break;
        } catch (e) {
          lastErr = e;
          console.error(`Report generation attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (!data) throw lastErr;
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
    if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("api_key") || msg.includes("authentication")) {
      return NextResponse.json({ error: "Invalid Anthropic API key. Check your ANTHROPIC_API_KEY." }, { status: 503 });
    }
    if (msg.includes("JSON") || msg.includes("json") || msg.includes("Unexpected token") || msg.includes("SyntaxError")) {
      return NextResponse.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 });
  }
}
