"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import ContentActions from "./ContentActions";
import { Smartphone, Layers, Film, BarChart2, Heart, ClipboardList, Check } from "lucide-react";

interface ContentItem {
  id: string;
  type: string;
  title: string;
  body: string;
  tags: string;
  createdAt: string;
  isFavorite: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  story: <Smartphone size={20} />,
  carousel: <Layers size={20} />,
  reel: <Film size={20} />,
  report: <BarChart2 size={20} />,
};

const TYPE_COLORS: Record<string, string> = {
  story: "badge-purple",
  carousel: "badge-blue",
  reel: "badge-green",
  report: "badge-gold",
};

export default function FavoritesTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedTask, setAddedTask] = useState<string | null>(null);

  async function addToTaskBoard(item: ContentItem) {
    const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `[${typeLabel}] ${item.title}`,
        description: `Content to publish — ${typeLabel} generated on ${new Date(item.createdAt).toLocaleDateString()}`,
        priority: "medium",
        status: "todo",
      }),
    });
    setAddedTask(item.id);
    setTimeout(() => setAddedTask(null), 2500);
  }

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/favorites");
    const data = await res.json();
    setItems(data.favorites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Favorites</h2>
        <p className="text-[#096cfe] text-sm mt-0.5">Content you&apos;ve saved for reference</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Heart size={48} className="mx-auto mb-3 opacity-30" />
          <p>No favorites yet. Heart content across other tabs to save it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const body = JSON.parse(item.body);
          const tags = JSON.parse(item.tags || "[]") as string[];
          const icon = TYPE_ICONS[item.type] ?? <BarChart2 size={20} />;
          const badgeClass = TYPE_COLORS[item.type] ?? "badge-gold";

          let preview = "";
          if (item.type === "story") preview = body.headline ?? "";
          else if (item.type === "carousel") preview = `${body.slides?.length ?? 0} slides`;
          else if (item.type === "reel") preview = body.subtitle ?? "";
          else if (item.type === "report") preview = body.summary ?? "";

          return (
            <div key={item.id} className="card p-4 flex items-start justify-between gap-4 fade-in">
              <div className="flex items-start gap-3">
                <span className="text-[#ffd801] mt-0.5">{icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${badgeClass} text-[10px] capitalize`}>{item.type}</span>
                    <span className="text-[10px] text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>{item.title}</h3>
                  {preview && <p className="text-gray-400 text-xs mt-0.5">{preview}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((t) => <span key={t} className="badge-gold text-[10px]">{t}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => addToTaskBoard(item)}
                  className="btn-outline text-xs flex items-center gap-1.5"
                  title="Add to Task Board"
                >
                  {addedTask === item.id
                    ? <><Check size={11} className="text-green-400" />Added!</>
                    : <><ClipboardList size={11} />Add to Tasks</>}
                </button>
                <ContentActions
                  contentId={item.id}
                  isFavorite={true}
                  onFavoriteChange={(isFav) => {
                    if (!isFav) setItems((prev) => prev.filter((i) => i.id !== item.id));
                  }}
                  onDelete={fetchItems}
                  downloadData={item.body}
                  downloadName={`bbc-${item.type}-${item.id}.txt`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
