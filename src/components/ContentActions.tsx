"use client";

import { useState } from "react";
import { Heart, Download, Trash2 } from "lucide-react";

interface Props {
  contentId: string;
  isFavorite: boolean;
  onFavoriteChange?: (isFav: boolean) => void;
  onDelete?: () => void;
  downloadData?: string;
  downloadName?: string;
}

export default function ContentActions({
  contentId,
  isFavorite: initialFav,
  onFavoriteChange,
  onDelete,
  downloadData,
  downloadName,
}: Props) {
  const [isFav, setIsFav] = useState(initialFav);
  const [loading, setLoading] = useState(false);

  async function toggleFavorite() {
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    });
    const data = await res.json();
    setIsFav(data.isFavorite);
    onFavoriteChange?.(data.isFavorite);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Remove this content?")) return;
    await fetch("/api/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contentId }),
    });
    onDelete?.();
  }

  function handleDownload() {
    if (!downloadData) return;
    const blob = new Blob([downloadData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName ?? "content.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleFavorite}
        disabled={loading}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
        className={`p-1.5 rounded-lg transition-colors ${
          isFav ? "text-red-400 bg-red-500/10" : "text-gray-500 hover:text-red-400 hover:bg-red-500/10"
        }`}
      >
        <Heart size={14} fill={isFav ? "currentColor" : "none"} />
      </button>
      {downloadData && (
        <button
          onClick={handleDownload}
          title="Download"
          className="p-1.5 rounded-lg text-gray-500 hover:text-[#ffd801] hover:bg-[#ffd80110] transition-colors"
        >
          <Download size={14} />
        </button>
      )}
      <button
        onClick={handleDelete}
        title="Delete"
        className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
