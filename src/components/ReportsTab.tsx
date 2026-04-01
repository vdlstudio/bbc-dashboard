"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { BarChart2, Zap, FileText, Loader2 } from "lucide-react";

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
  summary: string;
  sections: ReportSection[];
  keyStats: KeyStat[];
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

export default function ReportsTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating5, setGenerating5] = useState(false);

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
  }

  async function generate5Reports() {
    setGenerating5(true);
    const topics = [
      "Bali real estate market 2026",
      "Indonesia startup and tech ecosystem",
      "Bali tourism and hospitality industry",
      "Southeast Asia investment landscape",
      "Bali villa rental market",
    ];
    for (const topic of topics) {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "report", topic }),
      });
      const data = await res.json();
      if (data.content) {
        setItems((prev) => [data.content, ...prev]);
      }
    }
    setGenerating5(false);
  }

  const selectedItem = selected ? items.find((i) => i.id === selected) : null;
  const selectedData = selectedItem ? (JSON.parse(selectedItem.body) as ReportData) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Reports</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Industry & business intelligence reports</p>
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
            placeholder="Industry (e.g. Bali villas)"
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
          <div className="lg:col-span-1 space-y-2">
            {items.map((item) => {
              const data = JSON.parse(item.body) as ReportData;
              const tags = JSON.parse(item.tags || "[]") as string[];
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
                  <p className="text-sm font-semibold text-white leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{data.title}</p>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{data.summary}</p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {tags.map((t) => <span key={t} className="badge-gold text-[9px]">{t}</span>)}
                    <span className="text-[9px] text-gray-600 ml-auto">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selectedData && selectedItem ? (
              <div className="card p-6 fade-in">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>{selectedData.title}</h3>
                  <ContentActions
                    contentId={selectedItem.id}
                    isFavorite={selectedItem.isFavorite}
                    onDelete={() => { setSelected(null); fetchItems(); }}
                    downloadData={`${selectedData.title}\n\nSUMMARY:\n${selectedData.summary}\n\n${selectedData.sections.map(s => `${s.heading}\n${s.content}`).join("\n\n")}\n\nKEY STATS:\n${selectedData.keyStats.map(s => `${s.label}: ${s.value}`).join("\n")}\n\nSource: ${selectedData.source}`}
                    downloadName={`bbc-report-${selectedItem.id}.txt`}
                  />
                </div>

                <div className="bg-[#ffd80110] border border-[#ffd80130] rounded-xl p-4 mb-4">
                  <p className="text-[#ffd801] text-xs font-bold mb-1 uppercase tracking-wider">Executive Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedData.summary}</p>
                </div>

                {selectedData.keyStats?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {selectedData.keyStats.map((stat, i) => (
                      <div key={i} className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] text-center">
                        <p className="text-[#ffd801] font-black text-xl" style={{ fontFamily: 'Oswald, sans-serif' }}>{stat.value}</p>
                        <p className="text-gray-400 text-[10px] mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {selectedData.sections?.map((section, i) => (
                    <div key={i}>
                      <h4 className="text-[#096cfe] text-xs font-bold uppercase tracking-wider mb-1">{section.heading}</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>

                <p className="text-gray-600 text-xs mt-4 pt-4 border-t border-[#2a2a2a]">{selectedData.source}</p>
              </div>
            ) : (
              <div className="card p-12 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Select a report to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
