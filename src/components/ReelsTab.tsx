"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { Film, ChevronDown, ChevronUp, Clipboard, Check } from "lucide-react";

interface KeyFact {
  bold: string;
  detail: string;
}

interface ReelData {
  title: string;
  category?: string;
  hookQuestion?: string;
  keyFacts?: KeyFact[];
  closingQuestion?: string;
  cta?: string;
  script: string;
  duration: string;
  // legacy
  subtitle?: string;
  hooks?: string[];
  tags: string[];
}

interface ContentItem {
  id: string;
  title: string;
  body: string;
  tags: string;
  metadata: string;
  createdAt: string;
  isFavorite: boolean;
}

export default function ReelsTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openScript, setOpenScript] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content?type=reel&limit=20");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function handleGenerated(item: unknown) {
    setItems((prev) => [item as ContentItem, ...prev]);
  }

  async function copyScript(id: string, script: string) {
    await navigator.clipboard.writeText(script);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const REEL_GRADIENTS = [
    "from-orange-500/20 to-red-500/10",
    "from-purple-500/20 to-blue-500/10",
    "from-emerald-500/20 to-teal-500/10",
    "from-yellow-500/20 to-orange-500/10",
    "from-pink-500/20 to-rose-500/10",
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Reels Scripts</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Short-form video scripts — click to expand the full script</p>
        </div>
        <GenerateButton
          type="reel"
          onGenerated={handleGenerated}
          label="Generate Script"
          placeholder="Topic (e.g. Bali rental crisis 2026)"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Film size={48} className="mx-auto mb-3 opacity-30" />
          <p>No reels scripts yet. Generate your first one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const data = JSON.parse(item.body) as ReelData;
          const tags = JSON.parse(item.tags || "[]") as string[];
          const meta = JSON.parse(item.metadata || "{}");
          const isOpen = openScript === item.id;
          const grad = REEL_GRADIENTS[idx % REEL_GRADIENTS.length];
          const category = data.category || meta.category || "BBC REELS";
          const duration = data.duration || meta.duration || "60s";

          const scriptText = [
            category + ":",
            "",
            data.hookQuestion ? data.hookQuestion : "",
            "",
            ...(data.keyFacts?.flatMap(f => [`[${f.bold}]`, f.detail, ""]) ?? []),
            data.closingQuestion || "",
            data.cta || "",
            "",
            "FULL SCRIPT:",
            data.script,
          ].join("\n");

          const downloadText = `BBC REEL SCRIPT\n${data.title}\nCategory: ${category}\nDuration: ${duration}\n\n${scriptText}\n\nTags: ${tags.join(", ")}`;

          return (
            <div key={item.id} className="card overflow-hidden fade-in">
              <button
                onClick={() => setOpenScript(isOpen ? null : item.id)}
                className={`w-full bg-gradient-to-br ${grad} p-6 text-left hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[#ffd801] text-[10px] font-bold tracking-widest uppercase mb-1" style={{ fontFamily: 'Oswald, sans-serif' }}>
                      {category} · {duration}
                    </p>
                    <h3 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{data.title}</h3>
                    {data.hookQuestion && (
                      <p className="text-gray-300 text-sm font-medium mt-2 italic">&quot;{data.hookQuestion}&quot;</p>
                    )}
                    {data.subtitle && !data.hookQuestion && (
                      <p className="text-gray-300 text-sm font-medium mt-1">{data.subtitle}</p>
                    )}
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="p-4 border-t border-[#2a2a2a]">
                  {/* Key Facts — new format */}
                  {data.keyFacts && data.keyFacts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[#ffd801] text-xs font-bold mb-2 uppercase tracking-wider">Key Facts</p>
                      <div className="space-y-2">
                        {data.keyFacts.map((f, i) => (
                          <div key={i} className="bg-[#111] rounded-lg px-3 py-2 border border-[#2a2a2a]">
                            <p className="text-[#ffd801] text-xs font-bold">{f.bold}</p>
                            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{f.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy hooks format */}
                  {data.hooks && data.hooks.length > 0 && !data.keyFacts && (
                    <div className="mb-4">
                      <p className="text-[#ffd801] text-xs font-bold mb-2 uppercase tracking-wider">Hook Options</p>
                      <div className="space-y-1">
                        {data.hooks.map((h, i) => (
                          <p key={i} className="text-gray-300 text-xs bg-[#111] rounded px-3 py-2 border border-[#2a2a2a]">{h}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engagement question */}
                  {data.closingQuestion && (
                    <div className="mb-4 bg-[#096cfe]/10 border border-[#096cfe]/30 rounded-lg px-3 py-2">
                      <p className="text-[#096cfe] text-xs font-bold mb-0.5">Engagement Question</p>
                      <p className="text-gray-300 text-xs">{data.closingQuestion}</p>
                    </div>
                  )}

                  {/* CTA */}
                  {data.cta && (
                    <div className="mb-4 bg-[#ffd801]/10 border border-[#ffd801]/30 rounded-lg px-3 py-2">
                      <p className="text-[#ffd801] text-xs font-bold mb-0.5">CTA</p>
                      <p className="text-gray-300 text-xs">{data.cta}</p>
                    </div>
                  )}

                  {/* Full script */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#ffd801] text-xs font-bold uppercase tracking-wider">Full Script</p>
                    <button
                      onClick={() => copyScript(item.id, data.script)}
                      className="text-xs text-gray-400 hover:text-[#ffd801] transition-colors flex items-center gap-1"
                    >
                      {copied === item.id ? <><Check size={12} /> Copied!</> : <><Clipboard size={12} /> Copy script</>}
                    </button>
                  </div>
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed bg-[#111] rounded-lg p-4 border border-[#2a2a2a] font-mono max-h-64 overflow-y-auto">
                    {data.script}
                  </pre>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => <span key={t} className="badge-gold text-[10px]">{t}</span>)}
                </div>
                <ContentActions
                  contentId={item.id}
                  isFavorite={item.isFavorite}
                  onDelete={fetchItems}
                  downloadData={downloadText}
                  downloadName={`bbc-reel-${item.id}.txt`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
