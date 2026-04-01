"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { Layers } from "lucide-react";

interface Slide {
  stat: string;
  label: string;
  detail: string;
}

interface CarouselData {
  title: string;
  slides: Slide[];
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
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Carousel Posts</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Stats-driven carousel posts for social media</p>
        </div>
        <GenerateButton
          type="carousel"
          onGenerated={handleGenerated}
          label="Generate Carousel"
          placeholder="Topic (e.g. Indonesia economy)"
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

      <div className="space-y-4">
        {items.map((item) => {
          const data = JSON.parse(item.body) as CarouselData;
          const tags = JSON.parse(item.tags || "[]") as string[];
          const isExpanded = expanded === item.id;
          const downloadText = `BBC CAROUSEL: ${data.title}\n\n${data.slides.map((s, i) => `Slide ${i + 1}\n${s.stat} — ${s.label}\n${s.detail}`).join("\n\n")}\n\nTags: ${tags.join(", ")}`;

          return (
            <div key={item.id} className="card overflow-hidden fade-in">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ffd801] flex items-center justify-center text-black font-black text-xs shrink-0">B</div>
                  <div>
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Oswald, sans-serif' }}>{data.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tags.map((t) => <span key={t} className="badge-gold text-[10px]">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ContentActions
                    contentId={item.id}
                    isFavorite={item.isFavorite}
                    onDelete={fetchItems}
                    downloadData={downloadText}
                    downloadName={`bbc-carousel-${item.id}.txt`}
                  />
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    className="btn-outline text-xs"
                  >
                    {isExpanded ? "Collapse" : "View Slides"}
                  </button>
                </div>
              </div>

              <div className={`px-4 ${isExpanded ? "pb-4" : "pb-3"}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {(isExpanded ? data.slides : data.slides.slice(0, 3)).map((slide, i) => (
                    <div key={i} className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a]">
                      <p className="text-[#ffd801] font-black text-lg leading-tight" style={{ fontFamily: 'Oswald, sans-serif' }}>{slide.stat}</p>
                      <p className="text-white text-xs font-semibold mt-1">{slide.label}</p>
                      {isExpanded && <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">{slide.detail}</p>}
                    </div>
                  ))}
                  {!isExpanded && data.slides.length > 3 && (
                    <div className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] flex items-center justify-center">
                      <span className="text-gray-500 text-xs">+{data.slides.length - 3} more</span>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2">
                    <div className="w-6 h-6 rounded bg-[#ffd801] flex items-center justify-center text-black font-black text-[10px] shrink-0">B</div>
                    <p className="text-[#ffd801] text-xs font-semibold">Follow us for more insights →</p>
                  </div>
                )}
              </div>

              <div className="px-4 pb-3 text-[10px] text-gray-600">
                {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
