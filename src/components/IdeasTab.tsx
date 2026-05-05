"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "@/lib/auth";
import { Mic, Film, Lightbulb, Sparkles, Plus, Loader2, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";

interface Idea {
  id: string;
  category: string;
  title: string;
  body: string;
  votes: number;
  dislikes: number;
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
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const url = filter !== "all" ? `/api/ideas?category=${filter}` : "/api/ideas";
    const res = await fetch(url);
    const data = await res.json();
    // Ensure dislikes field exists (for older records)
    const ideas = (data.ideas ?? []).map((i: Idea) => ({ ...i, dislikes: i.dislikes ?? 0 }));
    setIdeas(ideas);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function like(id: string) {
    if (votingId) return;
    setVotingId(id + "_like");
    try {
      const res = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
      const data = await res.json();
      if (data.idea) {
        setIdeas((prev) =>
          prev.map((i) => i.id === id ? { ...i, votes: data.idea.votes ?? i.votes + 1, dislikes: data.idea.dislikes ?? i.dislikes } : i)
            .sort((a, b) => (b.votes - b.dislikes) - (a.votes - a.dislikes))
        );
      }
    } finally {
      setVotingId(null);
    }
  }

  async function dislike(id: string) {
    if (votingId) return;
    setVotingId(id + "_dislike");
    try {
      const res = await fetch(`/api/ideas/${id}/dislike`, { method: "POST" });
      const data = await res.json();
      if (data.idea) {
        setIdeas((prev) =>
          prev.map((i) => i.id === id ? { ...i, dislikes: data.idea.dislikes ?? i.dislikes + 1, votes: data.idea.votes ?? i.votes } : i)
            .sort((a, b) => (b.votes - b.dislikes) - (a.votes - a.dislikes))
        );
      }
    } finally {
      setVotingId(null);
    }
  }

  async function deleteIdea(id: string) {
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  }

  async function addIdea() {
    if (!newIdea.title.trim()) return;
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIdea),
    });
    const data = await res.json();
    setIdeas((prev) => [{ ...data.idea, dislikes: 0 }, ...prev]);
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
      setIdeas((prev) => [...data.ideas.map((i: Idea) => ({ ...i, dislikes: 0 })), ...prev]);
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
        {filtered.map((idea) => {
          const score = idea.votes - idea.dislikes;
          const isLiking = votingId === idea.id + "_like";
          const isDisliking = votingId === idea.id + "_dislike";

          return (
            <div key={idea.id} className="card p-4 flex items-start gap-4 fade-in">
              {/* Like / Dislike column */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                {/* Score */}
                <div
                  className={`text-sm font-black w-9 text-center ${
                    score > 0 ? "text-[#ffd801]" : score < 0 ? "text-red-400" : "text-gray-500"
                  }`}
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                >
                  {score > 0 ? `+${score}` : score}
                </div>

                {/* Thumbs Up */}
                <button
                  onClick={() => like(idea.id)}
                  disabled={!!votingId}
                  title="Like"
                  className={`w-9 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    isLiking
                      ? "border-[#ffd801] bg-[#ffd801]/20 text-[#ffd801]"
                      : "border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-[#ffd801] hover:text-[#ffd801]"
                  } disabled:opacity-40`}
                >
                  <ThumbsUp size={13} />
                </button>

                {/* Thumbs Down */}
                <button
                  onClick={() => dislike(idea.id)}
                  disabled={!!votingId}
                  title="Dislike"
                  className={`w-9 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    isDisliking
                      ? "border-red-500 bg-red-500/20 text-red-400"
                      : "border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-red-500 hover:text-red-400"
                  } disabled:opacity-40`}
                >
                  <ThumbsDown size={13} />
                </button>

                {/* Counts */}
                <div className="text-[9px] text-gray-600 text-center leading-tight">
                  <div className="text-green-500/70">{idea.votes}</div>
                  <div className="text-red-500/70">{idea.dislikes}</div>
                </div>
              </div>

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

              <button
                onClick={() => deleteIdea(idea.id)}
                className="shrink-0 text-gray-600 hover:text-red-400 transition-colors p-1"
                title="Delete idea"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
