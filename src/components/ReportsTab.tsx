"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { BarChart2, Zap, FileText, Loader2, Code, Printer, Share2, Check, Heart, Clock } from "lucide-react";

interface ReportSection {
  heading: string;
  content: string;
}

interface KeyStat {
  label: string;
  value: string;
}

interface ReportData {
  title: string;
  metaDescription?: string;
  summary: string;
  sections: ReportSection[];
  keyStats: KeyStat[];
  conclusion?: string;
  source: string;
  tags: string[];
}

interface ContentItem {
  id: string;
  title: string;
  body: string;
  tags: string;
  createdAt: string;
  isFavorite: boolean;
}

// ─── BBC Article HTML Template ───────────────────────────────────────────────
function generateReportHTML(data: ReportData, date: string, generatedAt: string): string {
  const stats = data.keyStats?.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join("") ?? "";

  const sections = data.sections?.map((s, i) => `
    <div class="section">
      <div class="section-number">${String(i + 1).padStart(2, "0")}</div>
      <div class="section-body">
        <h2>${s.heading}</h2>
        <p>${s.content}</p>
      </div>
    </div>`).join("") ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${data.metaDescription ?? data.summary}">
  <title>${data.title} — Bali Business Club</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.7;
      font-size: 16px;
    }

    /* ─── Masthead ─── */
    .masthead {
      background: #000000;
      padding: 0;
      margin-bottom: 0;
    }
    .masthead-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 48px;
      border-bottom: 3px solid #ffd801;
    }
    .brand-name {
      font-family: 'Oswald', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: #ffd801;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      color: #096cfe;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .masthead-meta {
      text-align: right;
    }
    .masthead-meta .section-label {
      font-family: 'Oswald', sans-serif;
      font-size: 11px;
      color: #ffd801;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
    .masthead-meta .pub-date {
      font-size: 11px;
      color: #888;
      margin-top: 3px;
    }

    /* ─── Hero ─── */
    .hero {
      background: linear-gradient(135deg, #05429d 0%, #000000 60%);
      padding: 52px 48px 44px;
    }
    .hero-category {
      display: inline-block;
      background: #ffd801;
      color: #000;
      font-family: 'Oswald', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 5px 14px;
      margin-bottom: 20px;
    }
    .hero h1 {
      font-family: 'Oswald', sans-serif;
      font-size: 40px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.1;
      letter-spacing: 0.01em;
      max-width: 760px;
      margin-bottom: 16px;
    }
    .hero-summary {
      font-size: 17px;
      color: rgba(255,255,255,0.75);
      font-weight: 300;
      max-width: 640px;
      line-height: 1.65;
    }
    .hero-divider {
      height: 1px;
      background: rgba(255,216,1,0.3);
      margin: 28px 0 0;
    }

    /* ─── Container ─── */
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 0 48px 64px;
    }

    /* ─── Stats ─── */
    .stats-section {
      padding: 36px 0;
      border-bottom: 1px solid #e8e8e8;
    }
    .stats-label {
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: #096cfe;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }
    .stat-card {
      background: #000;
      border-radius: 8px;
      padding: 22px 18px;
      text-align: center;
      border-top: 3px solid #ffd801;
    }
    .stat-value {
      font-family: 'Oswald', sans-serif;
      font-size: 30px;
      font-weight: 700;
      color: #ffd801;
      line-height: 1;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      line-height: 1.4;
    }

    /* ─── Sections ─── */
    .sections-header {
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: #096cfe;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      padding: 32px 0 20px;
    }
    .section {
      display: flex;
      gap: 24px;
      padding: 28px 0;
      border-bottom: 1px solid #ebebeb;
    }
    .section:last-child { border-bottom: none; }
    .section-number {
      font-family: 'Oswald', sans-serif;
      font-size: 48px;
      font-weight: 700;
      color: #f0f0f0;
      line-height: 1;
      min-width: 52px;
      padding-top: 2px;
    }
    .section-body { flex: 1; }
    .section h2 {
      font-family: 'Oswald', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #05429d;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
    }
    .section p {
      font-size: 15px;
      color: #3a3a3a;
      line-height: 1.8;
      font-weight: 400;
    }

    /* ─── Conclusion ─── */
    .conclusion {
      background: #000;
      color: #fff;
      padding: 36px 40px;
      border-radius: 10px;
      margin: 36px 0 32px;
      border-left: 4px solid #ffd801;
    }
    .conclusion-label {
      font-family: 'Oswald', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.25em;
      color: #ffd801;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .conclusion p {
      font-size: 15px;
      color: #cccccc;
      line-height: 1.8;
    }

    /* ─── Footer ─── */
    .article-footer {
      border-top: 2px solid #000;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
    }
    .footer-source {
      font-size: 11px;
      color: #999;
      line-height: 1.6;
      max-width: 520px;
    }
    .footer-source strong { color: #555; }
    .footer-brand {
      font-family: 'Oswald', sans-serif;
      font-size: 13px;
      color: #000;
      font-weight: 600;
      text-align: right;
      white-space: nowrap;
    }
    .footer-brand .domain { color: #096cfe; font-size: 11px; }
    .generated-at {
      width: 100%;
      font-size: 10px;
      color: #ccc;
      padding-top: 10px;
      border-top: 1px solid #eee;
      margin-top: 10px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .masthead, .hero, .stat-card, .conclusion { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <!-- Masthead -->
  <div class="masthead">
    <div class="masthead-top">
      <div>
        <div class="brand-name">Bali Business Club</div>
        <div class="brand-sub">Market Intelligence Report</div>
      </div>
      <div class="masthead-meta">
        <div class="section-label">Intelligence Report</div>
        <div class="pub-date">${date}</div>
      </div>
    </div>
  </div>

  <!-- Hero -->
  <div class="hero">
    <div class="hero-category">BBC Intelligence</div>
    <h1>${data.title}</h1>
    <p class="hero-summary">${data.summary}</p>
    <div class="hero-divider"></div>
  </div>

  <div class="container">
    <!-- Key Stats -->
    ${stats ? `
    <div class="stats-section">
      <div class="stats-label">Key Data Points</div>
      <div class="stats-grid">${stats}</div>
    </div>` : ""}

    <!-- Sections -->
    ${sections ? `
    <div class="sections-header">In-Depth Analysis</div>
    ${sections}` : ""}

    <!-- Conclusion -->
    ${data.conclusion ? `
    <div class="conclusion">
      <div class="conclusion-label">Strategic Conclusion</div>
      <p>${data.conclusion}</p>
    </div>` : ""}

    <!-- Footer -->
    <div class="article-footer">
      <div class="footer-source">
        <strong>Sources:</strong> ${data.source}
        <div class="generated-at">Generated: ${generatedAt} · Bali Business Club Marketing Intelligence</div>
      </div>
      <div class="footer-brand">
        BALI BUSINESS CLUB
        <div class="domain">balibusinessclub.com</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function downloadHTML(data: ReportData, date: string, generatedAt: string, id: string) {
  const html = generateReportHTML(data, date, generatedAt);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bbc-report-${id}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildLinkedInText(data: ReportData, date: string): string {
  const statsLine = data.keyStats?.map(s => `📊 ${s.value} — ${s.label}`).join("\n") ?? "";
  const sectionsText = data.sections?.map(s => `🔹 ${s.heading}\n${s.content}`).join("\n\n") ?? "";
  return [
    `${data.title}`, ``,
    data.summary, ``,
    statsLine ? `Key Numbers:\n${statsLine}` : "",
    ``, sectionsText,
    data.conclusion ? `\n${data.conclusion}` : "",
    ``, `📅 ${date} | Bali Business Club`,
    `#BaliInvestment #BaliRealEstate #Indonesia #SEAsia #InvestInBali`,
  ].filter(Boolean).join("\n");
}

function printReport(data: ReportData, date: string, generatedAt: string) {
  const html = generateReportHTML(data, date, generatedAt);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

function formatGeneratedAt(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function ReportsTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating5, setGenerating5] = useState(false);
  const [linkedInCopied, setLinkedInCopied] = useState(false);

  async function copyLinkedIn(data: ReportData, date: string) {
    await navigator.clipboard.writeText(buildLinkedInText(data, date));
    setLinkedInCopied(true);
    setTimeout(() => setLinkedInCopied(false), 2500);
  }

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content?type=report&limit=50");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function handleGenerated(item: unknown) {
    setItems((prev) => [item as ContentItem, ...prev]);
    setSelected((item as ContentItem).id);
  }

  async function generate5Reports() {
    setGenerating5(true);
    const topics = [
      "Bali real estate market 2026",
      "Indonesia startup and tech ecosystem",
      "Bali tourism and hospitality industry",
      "Southeast Asia investment landscape",
      "Bali villa rental market ROI analysis",
    ];
    for (const topic of topics) {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "report", topic }),
      });
      const data = await res.json();
      if (data.content) {
        setItems((prev) => [{ ...data.content }, ...prev]);
      }
    }
    setGenerating5(false);
  }

  const selectedItem = selected ? items.find((i) => i.id === selected) : null;
  const selectedData = selectedItem ? (JSON.parse(selectedItem.body) as ReportData) : null;
  const selectedDate = selectedItem
    ? new Date(selectedItem.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
    : "";
  const selectedGeneratedAt = selectedItem ? formatGeneratedAt(selectedItem.createdAt) : "";

  const plainTextDownload = selectedData && selectedItem
    ? `BBC REPORT: ${selectedData.title}\nDate: ${selectedDate}\nGenerated: ${selectedGeneratedAt}\n\nSUMMARY:\n${selectedData.summary}\n\n${selectedData.sections.map(s => `${s.heading}\n${s.content}`).join("\n\n")}${selectedData.conclusion ? `\n\nCONCLUSION:\n${selectedData.conclusion}` : ""}\n\nKEY STATS:\n${selectedData.keyStats.map(s => `${s.label}: ${s.value}`).join("\n")}\n\nSource: ${selectedData.source}`
    : "";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Reports & Blog Posts</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">AI-generated reports — download as HTML or PDF</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={generate5Reports}
            disabled={generating5}
            className="btn-outline text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {generating5 ? (
              <><Loader2 size={12} className="spin" />Generating 5…</>
            ) : <><Zap size={12} />Generate 5 Reports</>}
          </button>
          <GenerateButton
            type="report"
            onGenerated={handleGenerated}
            label="Generate Report"
            placeholder="Topic (e.g. Bali villa ROI 2026)"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No reports yet. Generate your first one!</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Report List */}
          <div className="lg:col-span-1 space-y-2">
            {items.map((item) => {
              const data = JSON.parse(item.body) as ReportData;
              const tags = JSON.parse(item.tags || "[]") as string[];
              const genAt = formatGeneratedAt(item.createdAt);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item.id === selected ? null : item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selected === item.id
                      ? "border-[#ffd801] bg-[#ffd80110]"
                      : "border-[#2a2a2a] bg-[#0d0d0d] hover:border-[#ffd80150]"
                  }`}
                >
                  {/* Title row with favorite indicator */}
                  <div className="flex items-start gap-2">
                    {item.isFavorite && (
                      <Heart size={11} className="text-red-400 shrink-0 mt-0.5" fill="currentColor" />
                    )}
                    <p className="text-sm font-semibold text-white leading-tight flex-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {data.title}
                    </p>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{data.summary}</p>
                  {/* Generated timestamp */}
                  <div className="flex items-center gap-1 mt-2 text-gray-600">
                    <Clock size={9} />
                    <span className="text-[9px]">{genAt}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {tags.map((t) => <span key={t} className="badge-gold text-[9px]">{t}</span>)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Report Detail */}
          <div className="lg:col-span-2">
            {selectedData && selectedItem ? (
              <div className="card p-6 fade-in">
                {/* Report Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedData.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-gray-600">
                      <Clock size={10} />
                      <span className="text-[10px]">Generated {selectedGeneratedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => downloadHTML(selectedData, selectedDate, selectedGeneratedAt, selectedItem.id)}
                      className="btn-outline text-xs flex items-center gap-1.5"
                      title="Download as HTML"
                    >
                      <Code size={11} />HTML
                    </button>
                    <button
                      onClick={() => printReport(selectedData, selectedDate, selectedGeneratedAt)}
                      className="btn-outline text-xs flex items-center gap-1.5"
                      title="Print or Save as PDF"
                    >
                      <Printer size={11} />PDF
                    </button>
                    <button
                      onClick={() => copyLinkedIn(selectedData, selectedDate)}
                      className="btn-outline text-xs flex items-center gap-1.5"
                      title="Copy formatted LinkedIn article"
                    >
                      {linkedInCopied
                        ? <><Check size={11} className="text-green-400" />Copied!</>
                        : <><Share2 size={11} />LinkedIn</>}
                    </button>
                    <ContentActions
                      contentId={selectedItem.id}
                      isFavorite={selectedItem.isFavorite}
                      onFavoriteChange={(isFav) => {
                        setItems((prev) => prev.map((i) => i.id === selectedItem.id ? { ...i, isFavorite: isFav } : i));
                      }}
                      onDelete={() => { setSelected(null); fetchItems(); }}
                      downloadData={plainTextDownload}
                      downloadName={`bbc-report-${selectedItem.id}.txt`}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[#ffd80110] border border-[#ffd80130] rounded-xl p-4 mb-5">
                  <p className="text-[#ffd801] text-xs font-bold mb-1.5 uppercase tracking-wider">Executive Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedData.summary}</p>
                </div>

                {/* Key Stats */}
                {selectedData.keyStats?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                    {selectedData.keyStats.map((stat, i) => (
                      <div key={i} className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] text-center">
                        <p className="text-[#ffd801] font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{stat.value}</p>
                        <p className="text-gray-400 text-[10px] mt-1 leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sections */}
                <div className="space-y-4">
                  {selectedData.sections?.map((section, i) => (
                    <div key={i} className="pb-4 border-b border-[#1e1e1e] last:border-0">
                      <h4 className="text-[#096cfe] text-xs font-bold uppercase tracking-wider mb-2">{section.heading}</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>

                {selectedData.conclusion && (
                  <div className="mt-4 bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
                    <p className="text-[#ffd801] text-xs font-bold mb-1.5 uppercase tracking-wider">Conclusion</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedData.conclusion}</p>
                  </div>
                )}

                <p className="text-gray-600 text-xs mt-4 pt-4 border-t border-[#2a2a2a]">{selectedData.source}</p>
              </div>
            ) : (
              <div className="card p-12 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Select a report to read</p>
                  <p className="text-xs mt-1">Export as HTML or PDF</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
