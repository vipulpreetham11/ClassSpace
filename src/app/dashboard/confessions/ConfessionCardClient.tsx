"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type ReactionType = "LAUGH" | "LOVE" | "FIRE";

interface ConfessionCardProps {
  id: string;
  content: string;
  createdAt: Date | string;
  reactions: { type: string, userId: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

export function ConfessionCardClient({ id, content, createdAt, reactions, isAdmin, currentUserId }: ConfessionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this confession permanently?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/confessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      setIsDeleting(false);
    }
  };

  const handleReact = async (type: ReactionType) => {
    try {
      const res = await fetch(`/api/confessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", type })
      });
      if (res.ok) router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
    }
  };

  const reactionCounts = {
    LAUGH: reactions.filter(r => r.type === "LAUGH").length,
    LOVE: reactions.filter(r => r.type === "LOVE").length,
    FIRE: reactions.filter(r => r.type === "FIRE").length,
  };

  const userReactions = new Set(reactions.filter(r => r.userId === currentUserId).map(r => r.type));

  const calculateDaysAgo = (dateInput: Date | string) => {
    const diff = new Date().getTime() - new Date(dateInput).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 relative group flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-xs font-semibold text-zinc-400">
          Anonymous
        </span>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
            title="Delete Confession"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-zinc-200 text-lg italic tracking-wide leading-relaxed font-serif whitespace-pre-wrap">{content}</p>

      <div className="mt-8 flex items-center justify-between border-t border-zinc-700/50 pt-4">
        <span className="text-xs text-zinc-500">{calculateDaysAgo(createdAt)}</span>
        
        <div className="flex items-center gap-2">
          <ReactionButton emoji="😂" count={reactionCounts.LAUGH} isActive={userReactions.has("LAUGH")} onClick={() => handleReact("LAUGH")} />
          <ReactionButton emoji="❤️" count={reactionCounts.LOVE} isActive={userReactions.has("LOVE")} onClick={() => handleReact("LOVE")} />
          <ReactionButton emoji="🔥" count={reactionCounts.FIRE} isActive={userReactions.has("FIRE")} onClick={() => handleReact("FIRE")} />
        </div>
      </div>
    </div>
  );
}

function ReactionButton({ emoji, count, isActive, onClick }: { emoji: string, count: number, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        isActive 
          ? "bg-violet-600/20 border border-violet-500/30 text-violet-400" 
          : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800"
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
