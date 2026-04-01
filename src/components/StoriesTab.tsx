"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import GenerateButton from "./GenerateButton";
import ContentActions from "./ContentActions";
import { Smartphone } from "lucide-react";

interface StoryData {
  title: string;
  headline: string;
  body: string;
  callToAction: string;
  tags: string[];
  backgroundTheme: string;
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

const THEME_GRADIENTS: Record<string, string> = {
  tropical: "from-green-900 via-emerald-800 to-teal-900",
  urban: "from-gray-900 via-slate-800 to-zinc-900",
  finance: "from-yellow-900 via-amber-800 to-orange-900",
  luxury: "from-purple-900 via-violet-800 to-indigo-900",
  tech: "from-blue-900 via-cyan-800 to-sky-900",
  nature: "from-lime-900 via-green-800 to-emerald-900",
};

export default function StoriesTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content?type=story&limit=20");
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
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Stories</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">AI-generated social media stories in BBC format</p>
        </div>
        <GenerateButton
          type="story"
          onGenerated={handleGenerated}
          label="Generate Story"
          placeholder="Topic (e.g. Bali property 2026)"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Smartphone size={48} className="mx-auto mb-3 opacity-30" />
          <p>No stories yet. Generate your first one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const data = JSON.parse(item.body) as StoryData;
          const meta = JSON.parse(item.metadata || "{}");
          const gradient = THEME_GRADIENTS[meta.backgroundTheme ?? "finance"] ?? THEME_GRADIENTS.finance;
          const tags = JSON.parse(item.tags || "[]") as string[];
          const downloadText = `BBC STORY\n${data.title}\n\n${data.headline}\n\n${data.body}\n\n${data.callToAction}\n\nTags: ${tags.join(", ")}`;

          return (
            <div key={item.id} className={`rounded-2xl bg-gradient-to-br ${gradient} border border-[#ffd80130] overflow-hidden fade-in`}>
              <div className="p-5 pb-4 relative min-h-[220px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffd801] flex items-center justify-center text-black font-black text-xs">B</div>
                    <span className="text-[10px] font-bold text-[#ffd801] tracking-widest uppercase" style={{ fontFamily: 'Oswald, sans-serif' }}>Bali Business</span>
                  </div>
                  <ContentActions
                    contentId={item.id}
                    isFavorite={item.isFavorite}
                    onDelete={fetchItems}
                    downloadData={downloadText}
                    downloadName={`bbc-story-${item.id}.txt`}
                  />
                </div>
                <div className="mt-4">
                  <p className="text-[#ffd801] text-xs font-bold tracking-widest uppercase mb-2">{data.headline}</p>
                  <h3 className="text-2xl font-black text-white leading-tight mb-3" style={{ fontFamily: 'Oswald, sans-serif' }}>{data.title}</h3>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{data.body}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[#ffd801] text-xs font-semibold">{data.callToAction}</p>
                </div>
              </div>
              <div className="px-5 pb-4 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="badge-gold text-[10px]">{tag}</span>
                ))}
                <span className="text-[10px] text-gray-600 ml-auto">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
