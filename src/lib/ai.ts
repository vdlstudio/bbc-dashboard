import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BBC_BRAND = `Bali Business Club (BBC) is a premium Bali-based business community focused on investment, property, entrepreneurship, and the Bali/Indonesia business ecosystem. Tone: authoritative, sophisticated, data-driven, inspiring. Target: entrepreneurs, investors, expats in Bali and SE Asia.`;

// Strip markdown code fences if present and parse JSON safely
function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function generateStory(topic?: string): Promise<{
  title: string;
  headline: string;
  body: string;
  callToAction: string;
  tags: string[];
  backgroundTheme: string;
}> {
  const prompt = topic
    ? `Create a BBC social media story about: ${topic}`
    : `Create a compelling BBC social media story about a current business/investment topic relevant to Bali or Indonesia.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

${prompt}

Return ONLY valid JSON (no markdown, no code fences) matching this exact schema:
{
  "title": "2-4 word bold headline (ALL CAPS)",
  "headline": "One punchy sentence hook (max 15 words)",
  "body": "2-3 sentences of insight/data. Be specific with real numbers if possible.",
  "callToAction": "Short CTA like 'Follow for daily insights →'",
  "tags": ["tag1", "tag2", "tag3"],
  "backgroundTheme": "one of: tropical | urban | finance | luxury | tech | nature"
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

export async function generateCarousel(topic?: string): Promise<{
  title: string;
  slides: Array<{ stat: string; label: string; detail: string }>;
  tags: string[];
}> {
  const prompt = topic
    ? `Create a BBC carousel post about stats/data on: ${topic}`
    : `Create a BBC carousel post with interesting stats about Bali business, property, investment, or Indonesia economy.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

${prompt}

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "Carousel title (e.g. 'BALI PROPERTY 2026: KEY NUMBERS')",
  "slides": [
    { "stat": "big number like $2.4B", "label": "short label", "detail": "1 sentence context" },
    { "stat": "...", "label": "...", "detail": "..." },
    { "stat": "...", "label": "...", "detail": "..." },
    { "stat": "...", "label": "...", "detail": "..." },
    { "stat": "...", "label": "...", "detail": "..." }
  ],
  "tags": ["tag1", "tag2"]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

export async function generateReelScript(topic?: string): Promise<{
  title: string;
  subtitle: string;
  script: string;
  duration: string;
  hooks: string[];
  tags: string[];
}> {
  const prompt = topic
    ? `Create a BBC Reels script about: ${topic}`
    : `Create a BBC Instagram/TikTok Reels script about a trending Bali business or investment topic.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

${prompt}

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "2-word bold title for the thumbnail",
  "subtitle": "3-4 word subtitle for thumbnail",
  "script": "Full spoken script (60-90 seconds). Use [PAUSE], [B-ROLL: description] markers. Make it engaging and educational.",
  "duration": "60s",
  "hooks": ["hook option 1", "hook option 2"],
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

export async function generateReport(industry?: string): Promise<{
  title: string;
  summary: string;
  sections: Array<{ heading: string; content: string }>;
  keyStats: Array<{ label: string; value: string }>;
  source: string;
  tags: string[];
}> {
  const topic = industry ?? "Bali real estate and investment market";

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1600,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Create a concise industry report on: ${topic}

IMPORTANT: Keep each section content under 60 words. Be specific with real numbers (2025-2026 data).

Return ONLY valid JSON (no markdown, no code fences). Keep all string values SHORT:
{
  "title": "Report title (max 8 words)",
  "summary": "2 sentence executive summary (max 40 words total)",
  "sections": [
    { "heading": "Market Overview", "content": "2-3 sentences max, include 1-2 key stats" },
    { "heading": "Key Trends", "content": "2-3 sentences max, include 1-2 key stats" },
    { "heading": "Investment Outlook", "content": "2-3 sentences max, include 1-2 key stats" }
  ],
  "keyStats": [
    { "label": "metric name", "value": "number/value" },
    { "label": "metric name", "value": "number/value" },
    { "label": "metric name", "value": "number/value" }
  ],
  "source": "BPS Indonesia, Colliers, Bank Indonesia (2025)",
  "tags": ["tag1", "tag2", "tag3"]
}`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}

export async function generateIdeas(count = 5): Promise<
  Array<{
    category: string;
    title: string;
    body: string;
  }>
> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `${BBC_BRAND}

Generate ${count} creative ideas to improve Bali Business Club content and community. Mix of:
- Podcast episode ideas (new topics not yet covered)
- Video/reel concepts
- General community/platform ideas

Return ONLY a valid JSON array (no markdown, no code fences):
[
  { "category": "podcast", "title": "Idea title", "body": "2-3 sentence description" }
]

Category must be one of: podcast, video, general`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return parseJSON(text);
}
