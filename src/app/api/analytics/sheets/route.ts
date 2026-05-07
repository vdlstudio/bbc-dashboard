import { NextResponse } from "next/server";

const SHEETS_URL =
  process.env.GOOGLE_SHEETS_URL ??
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAUpZZ666dAjFLNQYuCuemAMMFkOk1guhKCF_SqObDBPVT0OR-slJQmhNHuW5DEdFyemJhJ9M38NV9/pubhtml";

interface SheetRow {
  month: string;
  fbFollowers: number;
  fbViews: number;
  fbInteractions: number;
  fbNewFollowers: number;
  igFollowers: number;
  igViews: number;
  igNewFollowers: number;
  liFollowers: number;
  liImpressions: number;
  liNewFollowers: number;
  ytSubs: number;
  ytViews: number;
  ytWatchHours: number;
  ytNewSubs: number;
}

function parseNum(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

function extractTableRows(html: string): string[][] {
  const rows: string[][] = [];
  // Match all <tr> elements
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells: string[] = [];
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      // Strip HTML tags from cell content
      const cellText = tdMatch[1].replace(/<[^>]+>/g, "").trim();
      cells.push(cellText);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export async function GET() {
  try {
    const res = await fetch(SHEETS_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Google Sheets fetch failed: ${res.status}`);
    }

    const html = await res.text();

    // The first sheet/table = BBC tab
    // Find the first <table> element
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) {
      throw new Error("No table found in Google Sheets HTML");
    }

    const tableHtml = tableMatch[0];
    const allRows = extractTableRows(tableHtml);

    // Filter out header rows and empty rows; find data rows that start with a month name
    const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const dataRows = allRows.filter(row => row.length >= 5 && monthPattern.test(row[0]));

    const parsed: SheetRow[] = dataRows.map(row => ({
      month:           row[0] ?? "",
      fbFollowers:     parseNum(row[1]),
      fbViews:         parseNum(row[2]),
      fbInteractions:  parseNum(row[3]),
      fbNewFollowers:  parseNum(row[4]),
      igFollowers:     parseNum(row[5]),
      igViews:         parseNum(row[6]),
      igNewFollowers:  parseNum(row[7]),
      liFollowers:     parseNum(row[8]),
      liImpressions:   parseNum(row[9]),
      liNewFollowers:  parseNum(row[10]),
      ytSubs:          parseNum(row[11]),
      ytViews:         parseNum(row[12]),
      ytWatchHours:    parseNum(row[13]),
      ytNewSubs:       parseNum(row[14]),
    }));

    // Return latest row + full history
    const latest = parsed[parsed.length - 1] ?? null;

    return NextResponse.json({
      rows: parsed,
      latest,
      rowCount: parsed.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Google Sheets error:", err);
    return NextResponse.json(
      { error: "Google Sheets fetch failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
