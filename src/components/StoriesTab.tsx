"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import ContentActions from "./ContentActions";
import { Smartphone, Loader2, ChevronDown, ExternalLink } from "lucide-react";

const CANVA_TEMPLATE_URL = "https://canva.link/kab5agzit79nx49";

interface StoryData {
  category?: string;
  headline?: string;
  body: string;
  source?: string;
  title?: string;
  hook?: string;
  callToAction?: string;
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

const BG_THEMES = [
  "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
  "bg-gradient-to-b from-[#0d0d0d] via-[#1a1a1a] to-[#111827]",
  "bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364]",
  "bg-gradient-to-b from-[#1a1a1a] via-[#2d1b00] to-[#1a1a1a]",
  "bg-gradient-to-b from-[#0d1117] via-[#161b22] to-[#21262d]",
];

export default function StoriesTab({ session: _session }: { session: Session }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(1);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/content?type=story&limit=20");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "story", topic: topic.trim() || undefined, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      if (count === 1 && data.content) {
        setItems((prev) => [{ ...data.content, isFavorite: false }, ...prev]);
      } else if (data.contents) {
        setItems((prev) => [...data.contents, ...prev]);
      }
      setTopic("");
      setShowTopicInput(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Stories</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Breaking BBC-style news cards · last 48h</p>
        </div>

        {/* Generate controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Canva Design button */}
          <a
            href={CANVA_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-colors"
          >
            <ExternalLink size={12} />
            Design in Canva
          </a>
          {/* Count selector */}
          <div className="relative">
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="appearance-none bg-[#111] border border-[#2a2a2a] text-white text-xs rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-[#ffd801] cursor-pointer"
              disabled={generating}
            >
              {[1, 2, 3, 5, 10].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "story" : "stories"}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* Topic input toggle */}
          <button
            onClick={() => setShowTopicInput(!showTopicInput)}
            disabled={generating}
            className="btn-outline text-xs"
          >
            {showTopicInput ? "No topic" : "Set topic"}
          </button>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-gold flex items-center gap-1.5 text-sm disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 size={13} className="spin" />Generating{count > 1 ? ` ${count}…` : "…"}</>
            ) : (
              <>Generate {count > 1 ? `${count} Stories` : "Story"}</>
            )}
          </button>
        </div>
      </div>

      {/* Topic input */}
      {showTopicInput && (
        <div className="mb-4 fade-in">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
            placeholder="Topic (e.g. Bali property boom 2026, Canggu land prices)"
            className="input w-full max-w-lg"
            disabled={generating}
          />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

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

      {/* Grid — 9:16 portrait ratio cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, idx) => {
          const data = JSON.parse(item.body) as StoryData;
          const meta = JSON.parse(item.metadata || "{}");
          const tags = JSON.parse(item.tags || "[]") as string[];

          const category = data.category || meta.category || "NEWS";
          const headline = data.headline || data.hook || data.title || item.title;
          const body = data.body;
          const source = data.source || meta.source || "";
          const bg = BG_THEMES[idx % BG_THEMES.length];

          // Format the creation date as "48h" indicator
          const createdAt = new Date(item.createdAt);
          const hoursAgo = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
          const timeLabel = hoursAgo < 1 ? "Just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : createdAt.toLocaleDateString();

          const downloadText = `BBC STORY — ${category}\n${headline}\n\n${body}\n\nSource: ${source}\n\nTags: ${tags.join(", ")}`;

          return (
            <div
              key={item.id}
              className={`relative rounded-2xl overflow-hidden fade-in ${bg} flex flex-col`}
              style={{ aspectRatio: "9/16", maxHeight: "620px" }}
            >
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />

              {/* Actions top right */}
              <div className="absolute top-3 right-3 z-10">
                <ContentActions
                  contentId={item.id}
                  isFavorite={item.isFavorite}
                  onDelete={fetchItems}
                  downloadData={downloadText}
                  downloadName={`bbc-story-${item.id}.txt`}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-6 text-center gap-4">

                {/* NEWS Badge */}
                <div
                  className="px-6 py-2 font-black text-white text-xl tracking-widest"
                  style={{
                    fontFamily: 'Oswald, sans-serif',
                    background: '#096cfe',
                    letterSpacing: '0.15em',
                  }}
                >
                  {category}
                </div>

                {/* Headline */}
                <h2
                  className="text-[#ffd801] font-black leading-tight text-center uppercase"
                  style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: 'clamp(1.05rem, 3.2vw, 1.5rem)',
                    lineHeight: 1.15,
                  }}
                >
                  {headline}
                </h2>

                {/* Body */}
                <p
                  className="text-white/90 font-medium text-center leading-snug"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 'clamp(0.72rem, 2.2vw, 0.9rem)',
                    lineHeight: 1.5,
                  }}
                >
                  {body}
                </p>

                {/* Source */}
                {source && (
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-[#ffd801]/50" />
                    <p
                      className="text-[#ffd801]/80 text-[10px] font-bold tracking-widest uppercase"
                      style={{ fontFamily: 'Oswald, sans-serif' }}
                    >
                      {source}
                    </p>
                    <div className="h-px w-8 bg-[#ffd801]/50" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="relative z-10 flex items-center justify-between pb-4 pt-3 px-5 border-t border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-white.svg"
                  alt="Bali Business Club"
                  className="h-6 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                <span className="text-white/40 text-[9px] font-medium tracking-wide" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  {timeLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
