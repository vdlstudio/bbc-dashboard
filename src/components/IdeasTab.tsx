"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import { Mic, Film, Lightbulb, ChevronUp, Sparkles, Plus, Loader2 } from "lucide-react";

interface Idea {
  id: string;
  category: string;
  title: string;
  body: string;
  votes: number;
  createdAt: string;
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  podcast: <Mic size={12} />,
  video: <Film size={12} />,
  general: <Lightbulb size={12} />,
};

const CAT_COLORS: Record<string, string> = {
  podcast: "badge-purple",
  video: "badge-green",
  general: "badge-gold",
};

export default function IdeasTab({ session: _session }: { session: Session }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [newIdea, setNewIdea] = useState({ category: "podcast", title: "", body: "" });
  const [generating, setGenerating] = useState(false);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const url = filter !== "all" ? `/api/ideas?category=${filter}` : "/api/ideas";
    const res = await fetch(url);
    const data = await res.json();
    setIdeas(data.ideas ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function vote(id: string) {
    const res = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
    const data = await res.json();
    setIdeas((prev) => prev.map((i) => (i.id === id ? data.idea : i)).sort((a, b) => b.votes - a.votes));
  }

  async function addIdea() {
    if (!newIdea.title.trim()) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIdea),
    });
    const data = await res.json();
    setIdeas((prev) => [data.idea, ...prev]);
    setNewIdea({ category: "podcast", title: "", body: "" });
    setShowNew(false);
  }

  async function generateAiIdeas() {
    setGenerating(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ideas", count: 5 }),
    });
    const data = await res.json();
    if (data.ideas) {
      setIdeas((prev) => [...data.ideas, ...prev]);
    }
    setGenerating(false);
  }

  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.category === filter);

  const filterTabs = [
    { id: "all", label: "All", icon: null },
    { id: "podcast", label: "Podcast", icon: <Mic size={11} /> },
    { id: "video", label: "Video", icon: <Film size={11} /> },
    { id: "general", label: "General", icon: <Lightbulb size={11} /> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#ffd801]" style={{ fontFamily: 'Oswald, sans-serif' }}>Ideas</h2>
          <p className="text-[#096cfe] text-sm mt-0.5">Podcast episodes, video concepts, BBC improvements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAiIdeas}
            disabled={generating}
            className="btn-outline text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 size={12} className="spin" />Generating…</>
            ) : <><Sparkles size={12} />AI Generate 5 Ideas</>}
          </button>
          <button onClick={() => setShowNew(!showNew)} className="btn-gold flex items-center gap-1.5">
            <Plus size={14} />Add Idea
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-[#1e1e1e]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium capitalize border-b-2 transition-colors ${
              filter === tab.id
                ? "border-[#ffd801] text-[#ffd801]"
                : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {showNew && (
        <div className="card p-4 mb-4 fade-in">
          <div className="grid grid-cols-1 gap-3 mb-3">
            <select
              value={newIdea.category}
              onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
              className="input"
            >
              <option value="podcast">Podcast Episode</option>
              <option value="video">Video Concept</option>
              <option value="general">General Idea</option>
            </select>
            <input
              value={newIdea.title}
              onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
              placeholder="Idea title *"
              className="input"
            />
            <textarea
              value={newIdea.body}
              onChange={(e) => setNewIdea({ ...newIdea, body: e.target.value })}
              placeholder="Description"
              className="input resize-none h-20"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addIdea} className="btn-gold">Add Idea</button>
            <button onClick={() => setShowNew(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <span className="inline-block w-8 h-8 border-2 border-[#ffd801] border-t-transparent rounded-full spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Lightbulb size={48} className="mx-auto mb-3 opacity-30" />
          <p>No ideas yet. Add or generate some!</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((idea) => (
          <div key={idea.id} className="card p-4 flex items-start gap-4 fade-in">
            <button
              onClick={() => vote(idea.id)}
              className="flex flex-col items-center gap-0.5 shrink-0 group"
            >
              <div className="w-9 h-9 rounded-xl border border-[#2a2a2a] group-hover:border-[#ffd801] bg-[#111] flex flex-col items-center justify-center transition-colors">
                <ChevronUp size={12} className="text-[#ffd801]" />
                <span className="text-sm font-bold text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>{idea.votes}</span>
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${CAT_COLORS[idea.category]} text-[10px] flex items-center gap-1`}>
                  {CAT_ICONS[idea.category]}{idea.category}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-white" style={{ fontFamily: 'Oswald, sans-serif' }}>{idea.title}</h3>
              {idea.body && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{idea.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
