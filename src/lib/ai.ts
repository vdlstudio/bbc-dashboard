import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return new Anthropic({ apiKey });
}

const BBC_BRAND = `You are the content team for Bali Business Club (BBC) — a premium investment and business community based in Bali, Indonesia.

BBC's audience: High-net-worth investors, entrepreneurs, expats, and business owners interested in Bali property, Indonesian business, villa ROI, and SE Asia investment.

BBC Content Voice: Short. Punchy. Data-driven. No fluff. Real numbers. Authoritative but conversational. Always educational and slightly provocative.

Key BBC Topics: Bali real estate & villa investment, land prices (Kedungu, Canggu, Uluwatu, Seminyak), ROI (8-14% typical), leasehold vs freehold, Indonesia's economy, tourism numbers, digital nomads, infrastructure growth, investment comparisons (Bali vs Dubai, Bali vs Thailand).`;

// Strip markdown code fences if present and parse JSON safely
function parseJSON<T>(text: string): T {
  // Remove markdown fences
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // Try to extract JSON object or array if there's surrounding text
  const objMatch = cleaned.match(/(\{[\s\S]*\})/);
  const arrMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (objMatch || arrMatch) {
    const candidate = (objMatch?.[1] ?? arrMatch?.[1]) as string;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // fall through to try cleaned directly
    }
  }

  return JSON.parse(cleaned) as T;
}

// ─── INSTAGRAM STORY ────────────────────────────────────────────────────────

export async function generateStory(topic?: string): Promise<{
  category: string;
  headline: string;
  body: string;
  source: string;
  tags: string[];
}> {
  const client = getClient();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const prompt = topic
    ? `Create a BBC Instagram Story breaking news card about: ${topic}. Frame this as if it is breaking news from the past 48 hours (as of ${dateStr}).`
    : `Create a BBC Instagram Story breaking news card about a recent Bali or Indonesia business/investment/news development. Frame this as if it is breaking news from the past 48 hours (as of ${dateStr}).`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

${prompt}

BBC Instagram Stories look like breaking news graphics. Rules:
- Category badge is ALWAYS "NEWS" — never change this
- A bold yellow HEADLINE (1-2 lines, ALL CAPS, punchy and specific — the breaking hook)
- A white BODY TEXT (MAXIMUM 20 words — one sharp sentence with one key stat. Very short to fit on card.)
- A source attribution (e.g. "THE BALI SUN", "COLLIERS INTERNATIONAL", "BPS INDONESIA", "BANK INDONESIA", "ANTARA", "REUTERS")

This is BREAKING NEWS from the last 48 hours. Make it feel urgent and timely. Use 2025-2026 data.
Topics: Bali property prices, villa ROI, tourism arrivals, land prices (Canggu, Kedungu, Uluwatu), Indonesia economy, new developments, regulations, infrastructure.

Example headlines: "BALI VILLA YIELDS DOUBLED LONDON RETURNS IN 2025", "INDONESIA GDP GREW 5.11% IN 2025", "CANGGU LAND PRICES UP 40% IN 3 YEARS"
Example bodies (very short!): "Short-term villa yields hit 14% net ROI — double the global average." | "1.67M tourists landed in Q1 2025, up 12% year-on-year."

Return ONLY valid JSON (no markdown, no code fences):
{
  "category": "NEWS",
  "headline": "BOLD PUNCHY HEADLINE IN CAPS (max 10 words)",
  "body": "ONE short sentence, max 20 words, one key stat.",
  "source": "SOURCE NAME IN CAPS",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

// ─── CAROUSEL POST ───────────────────────────────────────────────────────────

export async function generateCarousel(topic?: string): Promise<{
  title: string;
  subtitle: string;
  slides: Array<{ stat: string; label: string; detail: string; source: string; sourceUrl?: string }>;
  caption: string;
  hashtags: string[];
  tags: string[];
}> {
  const client = getClient();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const prompt = topic
    ? `Create a BBC Instagram carousel post about: ${topic}`
    : `Create a BBC Instagram carousel post about recent Bali hotel, property, or Indonesia economy data.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      } as { type: "web_search_20250305"; name: "web_search" },
    ],
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Today's date: ${dateStr}

${prompt}

IMPORTANT: Use the web_search tool to find the MOST RECENT 2025-2026 statistics before generating the carousel. Search for current Bali property prices, tourism arrivals, villa ROI data, BPS Indonesia reports, Colliers International Bali reports, etc. Only use data from 2025 or 2026 articles — verify dates before including any stat.

BBC Carousel posts follow a STRICT format — each slide features ONE key statistic.

SLIDE FORMAT (5-6 slides):
- stat: The big number/percentage (e.g. "63.4%", "$139.4", "58,822", "$676M")
- label: Short description of what the stat means (e.g. "Average occupancy rate in Q1 2026")
- detail: One sentence adding context (e.g. "A 3.6% increase from Q1 2025 (61.2%)")
- source: Source name (e.g. "Colliers International", "BPS Indonesia")
- sourceUrl: URL of the article where this stat was found (must be a real, working URL)

CAPTION FORMAT: Write an engaging Instagram caption with:
- Emoji-rich title line
- "SWIPE to see..." opener
- 3-4 sentences of context explaining why this matters
- Engagement question at the end
- Line breaks between sections

HASHTAGS: 8-12 relevant hashtags

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "Carousel topic title (e.g. \"Bali's Hotel Trends\")",
  "subtitle": "Subtitle (e.g. \"Luxury on the Rise\")",
  "slides": [
    {
      "stat": "63.4%",
      "label": "Average occupancy rate in Q1 2026",
      "detail": "A 3.6% increase from Q1 2025 (61.2%)",
      "source": "Colliers International",
      "sourceUrl": "https://www.colliers.com/en-id/research/bali-hotel-market-report-2026"
    }
  ],
  "caption": "Full Instagram caption text with line breaks",
  "hashtags": ["#Bali", "#Investment"],
  "tags": ["tag1", "tag2"]
}`,
      },
    ],
  });

  // Handle multi-block response (web search + text blocks)
  const textBlock = msg.content.filter(b => b.type === "text").at(-1);
  const text = textBlock ? (textBlock as { type: "text"; text: string }).text : "";
  return parseJSON(text);
}

// ─── REELS SCRIPT ────────────────────────────────────────────────────────────

export async function generateReelScript(topic?: string): Promise<{
  title: string;
  category: string;
  hookQuestion: string;
  script: string;
  keyFacts: Array<{ bold: string; detail: string }>;
  closingQuestion: string;
  cta: string;
  duration: string;
  sourceLabel: string;
  sourceUrl: string;
  tags: string[];
}> {
  const client = getClient();
  const prompt = topic
    ? `Create a BBC Reels script about: ${topic}`
    : `Create a BBC Instagram/TikTok Reels script about a trending Bali business or investment topic.`;

  const now2 = new Date();
  const dateStr2 = now2.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      } as { type: "web_search_20250305"; name: "web_search" },
    ],
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Today's date: ${dateStr2}

${prompt}

IMPORTANT: Use web_search to find ONE recent 2025-2026 article or report that contains real statistics for this topic. Use it to ground your reel in actual current data.

BBC Reels are short educational news-style videos for 2026. All data and references MUST be current 2025-2026 figures. Format exactly like this:

[CATEGORY LINE]: "BBC REELS NEWS:" or "BBC REELS PROPERTY:" etc.
[BOLD HOOK]: A shocking question or statement in bold
[2-3 KEY FACTS]: Each with a bold stat/number + 1-2 sentences of context
[ENGAGEMENT QUESTION]: "What do you think — [question]?"
[CALL TO ACTION]: "Let us know in the comments below." or "Follow for daily Bali insights."

The script should feel like a news anchor presenting surprising facts.

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "3-5 word bold thumbnail title",
  "category": "Category like 'BBC REELS NEWS' or 'BBC REELS PROPERTY' or 'BBC REELS INVESTMENT'",
  "hookQuestion": "The opening bold hook question (e.g. 'Is Bali running out of long-term rentals?')",
  "keyFacts": [
    { "bold": "Key bold stat (e.g. '33,000 Airbnb listings')", "detail": "1-2 sentences of context with the stat explained" },
    { "bold": "...", "detail": "..." },
    { "bold": "...", "detail": "..." }
  ],
  "closingQuestion": "Audience engagement question (e.g. 'What do you think — is Bali heading toward a rental crisis?')",
  "cta": "Call to action (e.g. 'Let us know in the comments below.')",
  "script": "Full readable script combining all elements, ready to be read on camera. Use natural spoken language.",
  "duration": "30s or 45s or 60s",
  "sourceLabel": "Primary source name (e.g. 'BPS Indonesia', 'Colliers International', 'Airbnb Newsroom')",
  "sourceUrl": "REAL URL to a 2025 or 2026 article/report that supports the key facts in this reel (must be a real, working URL)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
    ],
  });

  // Handle multi-block response (web search tool + text)
  const reelTextBlock = msg.content.filter(b => b.type === "text").at(-1);
  const reelText = reelTextBlock ? (reelTextBlock as { type: "text"; text: string }).text : "";
  return parseJSON(reelText);
}

// ─── BLOG POST / REPORT ──────────────────────────────────────────────────────

export async function generateReport(industry?: string): Promise<{
  title: string;
  metaDescription: string;
  summary: string;
  sections: Array<{ heading: string; content: string }>;
  keyStats: Array<{ label: string; value: string }>;
  conclusion: string;
  source: string;
  tags: string[];
}> {
  const client = getClient();
  const topic = industry ?? "Bali real estate and investment market";

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Create a detailed blog post / intelligence report on: ${topic}

This will be formatted as a professional BBC blog post with an HTML export option. The current year is 2026. ALL data, statistics, and references MUST be from 2025 or 2026. Do not use data from 2024 or earlier. Write as if reporting on current 2026 market conditions.

CRITICAL FORMATTING RULES:
- Return ONLY a raw JSON object — nothing else
- Do NOT use markdown, code fences, backticks, or any text outside the JSON
- Do NOT write \`\`\`json or \`\`\` anywhere
- Start your response with { and end with }
- Keep section content to 2-3 sentences max to stay within limits
- All string values must use escaped quotes (\") if they contain quotes

{
  "title": "Compelling SEO-friendly title (8-12 words)",
  "metaDescription": "SEO meta description under 160 chars",
  "summary": "2-3 sentence executive summary that hooks the reader with a key stat",
  "sections": [
    { "heading": "Section heading (3-5 words)", "content": "2-3 sentences with specific data and numbers" },
    { "heading": "Section heading", "content": "2-3 sentences" },
    { "heading": "Section heading", "content": "2-3 sentences" },
    { "heading": "Section heading", "content": "2-3 sentences" }
  ],
  "keyStats": [
    { "label": "Metric name", "value": "Number/percentage" },
    { "label": "Metric name", "value": "Number/percentage" },
    { "label": "Metric name", "value": "Number/percentage" },
    { "label": "Metric name", "value": "Number/percentage" }
  ],
  "conclusion": "2-3 sentence forward-looking conclusion with a call to action",
  "source": "BPS Indonesia, Colliers International, Bank Indonesia, STR Global (2026)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

// ─── IDEAS ───────────────────────────────────────────────────────────────────

export async function generateIdeas(count = 5): Promise<
  Array<{
    category: string;
    title: string;
    body: string;
  }>
> {
  const client = getClient();
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Generate ${count} fresh content and community ideas for Bali Business Club. Think creatively about what would engage BBC's audience of investors and entrepreneurs in Bali.

Mix of categories:
- "podcast": Interview topics, solo episodes, panel ideas (e.g. "Bali vs Dubai: Which Market Wins in 2026?")
- "video": Reel concepts, YouTube ideas, documentary-style (e.g. "We visited 5 Kedungu villas — here's the ROI truth")
- "general": Community events, newsletter topics, social campaigns, product ideas

Return ONLY a valid JSON array (no markdown, no code fences):
[
  { "category": "podcast", "title": "Specific compelling title", "body": "2-3 sentence description of the concept and why it would resonate with BBC's audience" }
]

Category must be one of: podcast, video, general`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}
