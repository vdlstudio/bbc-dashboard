"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { Layers, Clipboard, Check, ChevronDown, ChevronUp } from "lucide-react";

interface Slide {
  // new format
  stat?: string;
  label?: string;
  detail?: string;
  source?: string;
  // legacy format
  number?: string;
  heading?: string;
}

interface CarouselData {
  title: string;
  subtitle?: string;
  slides: Slide[];
  caption?: string;
  hashtags?: string[];
  // legacy
  coverText?: string;
  closingSlide?: string;
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

export default function CarouselTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content?type=carousel&limit=20");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function handleGenerated(item: unknown) {
    setItems((prev) => [item as ContentItem, ...prev]);
    setExpanded((item as ContentItem).id);
  }

  async function copyCaption(id: string, caption: string, hashtags: string[]) {
    const full = `${caption}\n\n${hashtags.join("\n")}`;
    await navigator.clipboard.writeText(full);
    setCopiedCaption(id);
    setTimeout(() => setCopiedCaption(null), 2500);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Carousel Posts</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Stat-per-slide carousels with Instagram caption</p>
        </div>
        <GenerateButton
          type="carousel"
          onGenerated={handleGenerated}
          label="Generate Carousel"
          placeholder="Topic (e.g. Bali hotel market Q1 2025)"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Layers size={48} className="mx-auto mb-3 opacity-30" />
          <p>No carousel posts yet. Generate your first one!</p>
        </div>
      )}

      <div className="space-y-5">
        {items.map((item) => {
          const data = JSON.parse(item.body) as CarouselData;
          const tags = JSON.parse(item.tags || "[]") as string[];
          const isExpanded = expanded === item.id;

          // Build download text
          const slideText = data.slides.map((s, i) =>
            `Slide ${i + 1}:\n${s.stat || ""} — ${s.label || s.heading || ""}\n${s.detail || ""}\n${s.source ? `Source: ${s.source}` : ""}`
          ).join("\n\n");
          const downloadText = `BBC CAROUSEL: ${data.title}\n${data.subtitle || ""}\n\n${slideText}${data.caption ? `\n\nCAPTION:\n${data.caption}` : ""}\n\n${data.hashtags?.join(" ") || ""}`;

          return (
            <div key={item.id} className="card overflow-hidden fade-in">

              {/* Header */}
              <div className="bg-gradient-to-r from-[#05429d]/30 to-[#096cfe]/10 border-b border-[#2a2a2a] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-white.svg" alt="BBC" className="h-7 w-auto mt-0.5 shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
                    <div>
                      <p className="text-[#ffd801] text-[10px] font-bold tracking-widest uppercase mb-0.5">
                        BBC Carousel · {data.slides.length} slides
                      </p>
                      <h3 className="font-black text-white text-base leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {data.title}
                      </h3>
                      {data.subtitle && (
                        <p className="text-[#096cfe] text-xs font-semibold mt-0.5">{data.subtitle}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {tags.map((t) => <span key={t} className="badge-gold text-[10px]">{t}</span>)}
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ContentActions
                      contentId={item.id}
                      isFavorite={item.isFavorite}
                      onDelete={fetchItems}
                      downloadData={downloadText}
                      downloadName={`bbc-carousel-${item.id}.txt`}
                    />
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="btn-outline text-xs flex items-center gap-1"
                    >
                      {isExpanded ? <><ChevronUp size={12} />Collapse</> : <><ChevronDown size={12} />View Full</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Slides Preview (always visible — compact) */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {(isExpanded ? data.slides : data.slides.slice(0, 4)).map((slide, i) => (
                    <div
                      key={i}
                      className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] flex flex-col gap-1"
                      style={{ borderTop: '2px solid #ffd801' }}
                    >
                      {slide.stat && (
                        <p className="text-[#ffd801] font-black leading-none" style={{ fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                          {slide.stat}
                        </p>
                      )}
                      <p className="text-white text-xs font-semibold leading-tight">
                        {slide.label || slide.heading}
                      </p>
                      {isExpanded && slide.detail && (
                        <p className="text-gray-400 text-[10px] leading-relaxed">{slide.detail}</p>
                      )}
                      {isExpanded && slide.source && (
                        <p className="text-gray-600 text-[9px] uppercase tracking-wide mt-auto pt-1">
                          {slide.source}
                        </p>
                      )}
                    </div>
                  ))}
                  {!isExpanded && data.slides.length > 4 && (
                    <div className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] flex items-center justify-center">
                      <span className="text-gray-500 text-xs">+{data.slides.length - 4} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption — expanded only */}
              {isExpanded && data.caption && (
                <div className="px-4 pb-4">
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#ffd801] text-xs font-bold uppercase tracking-wider">Instagram Caption</p>
                      <button
                        onClick={() => copyCaption(item.id, data.caption!, data.hashtags || [])}
                        className="text-xs text-gray-400 hover:text-[#ffd801] transition-colors flex items-center gap-1"
                      >
                        {copiedCaption === item.id
                          ? <><Check size={12} className="text-green-400" /> Copied!</>
                          : <><Clipboard size={12} /> Copy caption</>}
                      </button>
                    </div>
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                      {data.caption}
                    </pre>
                    {data.hashtags && data.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#222]">
                        {data.hashtags.map((h, i) => (
                          <span key={i} className="text-[#096cfe] text-[10px] font-medium">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legacy closing slide */}
              {isExpanded && !data.caption && data.closingSlide && (
                <div className="px-4 pb-4">
                  <div className="bg-[#ffd801]/10 border border-[#ffd801]/30 rounded-xl px-4 py-3">
                    <p className="text-[#ffd801] text-xs font-bold uppercase tracking-wider mb-1">Closing Slide</p>
                    <p className="text-gray-300 text-sm">{data.closingSlide}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
