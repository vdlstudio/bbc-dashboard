import { NextResponse } from "next/server";

// The sheet is published as CSV (transposed: months = columns, metrics = rows)
const SHEETS_BASE =
  process.env.GOOGLE_SHEETS_URL?.replace("pubhtml", "pub?output=csv") ??
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTAUpZZ666dAjFLNQYuCuemAMMFkOk1guhKCF_SqObDBPVT0OR-slJQmhNHuW5DEdFyemJhJ9M38NV9/pub?output=csv";

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
  liReactions: number;
  liNewFollowers: number;
  ytSubs: number;
  ytViews: number;
  ytWatchHours: number;
  ytNewSubs: number;
}

function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

/** Minimal RFC 4180 CSV parser */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === "," && !inQ) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    if (cells.some(c => c.length > 0)) result.push(cells);
  }
  return result;
}

/** "October 2024" → "Oct'24" */
function shortMonth(full: string): string {
  const m = full.trim().match(/^(\w+)\s+(\d{4})$/);
  if (!m) return full.trim();
  return `${m[1].slice(0, 3)}'${m[2].slice(2)}`;
}

const MONTH_RE = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i;

export async function GET() {
  try {
    const res = await fetch(SHEETS_BASE, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
      next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    const csv = await res.text();
    const rows = parseCSV(csv);

    if (rows.length < 2) throw new Error("Empty CSV");

    // ── Find header row (row 0) — columns are month names ──────────────────
    const header = rows[0];
    const monthCols: { idx: number; label: string }[] = [];
    for (let i = 1; i < header.length; i++) {
      if (MONTH_RE.test(header[i])) {
        monthCols.push({ idx: i, label: shortMonth(header[i]) });
      }
    }
    if (monthCols.length === 0) throw new Error("No month columns found in header");

    // ── Find platform section boundaries ────────────────────────────────────
    const sectionStart: Record<string, number> = {};
    rows.forEach((row, i) => {
      const lc = row[0]?.toLowerCase().trim() ?? "";
      if (lc === "facebook" || lc.startsWith("facebook"))    sectionStart.fb = i;
      else if (lc === "instagram" || lc.startsWith("instagram")) sectionStart.ig = i;
      else if (lc === "linkedin"  || lc.startsWith("linkedin"))  sectionStart.li = i;
      else if (lc === "youtube"   || lc.startsWith("youtube"))   sectionStart.yt = i;
    });

    const sectionEnd = (key: string): number => {
      const order = ["fb", "ig", "li", "yt"];
      const pos = order.indexOf(key);
      for (let i = pos + 1; i < order.length; i++) {
        if (sectionStart[order[i]] != null) return sectionStart[order[i]];
      }
      return rows.length;
    };

    function section(key: string): string[][] {
      return rows.slice((sectionStart[key] ?? 0) + 1, sectionEnd(key));
    }

    function findRow(rows: string[][], ...keywords: string[]): string[] | null {
      const lc = keywords.map(k => k.toLowerCase());
      return rows.find(r => lc.every(k => r[0]?.toLowerCase().includes(k))) ?? null;
    }

    const fb  = section("fb");
    const ig  = section("ig");
    const li  = section("li");
    const yt  = section("yt");

    const fbReach    = findRow(fb, "reach");
    const fbInter    = findRow(fb, "interaction");
    const fbNewFol   = findRow(fb, "new follow");
    const fbTotal    = findRow(fb, "total");

    const igViews    = findRow(ig, "view");
    const igNewFol   = findRow(ig, "new follow");
    const igTotal    = findRow(ig, "total");

    const liImpr     = findRow(li, "impression");
    const liReact    = findRow(li, "reaction");
    const liNewFol   = findRow(li, "new follow");
    const liTotal    = findRow(li, "total");

    const ytViews    = findRow(yt, "view");
    const ytWatch    = findRow(yt, "watch");
    const ytNewSubs  = findRow(yt, "new subscriber");
    const ytTotal    = findRow(yt, "total subscriber");

    // ── Build one SheetRow per month column ─────────────────────────────────
    const parsed: SheetRow[] = monthCols
      .map(({ idx, label }) => ({
        month:          label,
        fbFollowers:    parseNum(fbTotal?.[idx]),
        fbViews:        parseNum(fbReach?.[idx]),
        fbInteractions: parseNum(fbInter?.[idx]),
        fbNewFollowers: parseNum(fbNewFol?.[idx]),
        igFollowers:    parseNum(igTotal?.[idx]),
        igViews:        parseNum(igViews?.[idx]),
        igNewFollowers: parseNum(igNewFol?.[idx]),
        liFollowers:    parseNum(liTotal?.[idx]),
        liImpressions:  parseNum(liImpr?.[idx]),
        liReactions:    parseNum(liReact?.[idx]),
        liNewFollowers: parseNum(liNewFol?.[idx]),
        ytSubs:         parseNum(ytTotal?.[idx]),
        ytViews:        parseNum(ytViews?.[idx]),
        ytWatchHours:   parseNum(ytWatch?.[idx]),
        ytNewSubs:      parseNum(ytNewSubs?.[idx]),
      }))
      // Drop months where every value is zero (future/empty months)
      .filter(r =>
        r.fbFollowers > 0 || r.igFollowers > 0 || r.ytSubs > 0 || r.liFollowers > 0
      );

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
