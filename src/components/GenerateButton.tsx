"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, X } from "lucide-react";

interface Props {
  type: string;
  onGenerated: (item: unknown) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function GenerateButton({ type, onGenerated, label, placeholder, className }: Props) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic: topic.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed");
      }
      const result = data.content ?? data.ideas ?? data;
      onGenerated(result);
      setTopic("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("API key") || msg.includes("auth") || msg.includes("401")) {
        setError("API key not configured. Add ANTHROPIC_API_KEY to your environment.");
      } else if (msg.includes("JSON")) {
        setError("AI returned unexpected format. Try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
          placeholder={placeholder ?? "Topic (optional)…"}
          className="input flex-1 min-w-0"
          disabled={loading}
        />
        <button
          onClick={generate}
          disabled={loading}
          className="btn-gold shrink-0 disabled:opacity-60 flex items-center gap-2 py-2.5 px-5"
        >
          {loading ? (
            <><Loader2 size={14} className="spin" />Generating…</>
          ) : (
            <><Sparkles size={14} />{label ?? "Generate"}</>
          )}
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="shrink-0 hover:text-red-300">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
