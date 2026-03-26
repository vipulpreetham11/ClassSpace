"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ReactionType } from "@prisma/client"
import { formatDate } from "@/lib/formatDate";

interface ReactionSummary {
  type: ReactionType
  userId: string
}

interface MemeCardMeme {
  id: string
  imageUrl: string
  caption: string | null
  createdAt: Date | string
  reactions: ReactionSummary[]
}

interface MemeCardClientProps {
  meme: MemeCardMeme
  isAdmin: boolean
  currentUserId: string
}

export function MemeCardClient({ meme, isAdmin, currentUserId }: MemeCardClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this meme?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/memes/${meme.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const handleReact = async (type: ReactionType) => {
    try {
      const res = await fetch(`/api/memes/${meme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "react", type })
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const reactionCounts = {
    LAUGH: meme.reactions.filter((r) => r.type === "LAUGH").length,
    LOVE: meme.reactions.filter((r) => r.type === "LOVE").length,
    FIRE: meme.reactions.filter((r) => r.type === "FIRE").length,
  };

  const userReactions = new Set(
    meme.reactions
      .filter((r) => r.userId === currentUserId)
      .map((r) => r.type),
  );

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-sm relative group flex flex-col">
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100 z-10"
          title="Delete Meme"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      <div className="w-full bg-zinc-900 border-b border-zinc-700">
        <img 
          src={meme.imageUrl} 
          alt={meme.caption || "Meme"} 
          className="w-full max-h-64 object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        {meme.caption && (
          <p className="text-zinc-200 font-medium text-lg leading-snug mb-4">{meme.caption}</p>
        )}
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-zinc-500 font-medium">
            {formatDate(meme.createdAt)}
          </span>
          
          <div className="flex items-center gap-2">
            <ReactionButton emoji="😂" count={reactionCounts.LAUGH} isActive={userReactions.has("LAUGH")} onClick={() => handleReact("LAUGH")} />
            <ReactionButton emoji="❤️" count={reactionCounts.LOVE} isActive={userReactions.has("LOVE")} onClick={() => handleReact("LOVE")} />
            <ReactionButton emoji="🔥" count={reactionCounts.FIRE} isActive={userReactions.has("FIRE")} onClick={() => handleReact("FIRE")} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReactionButtonProps {
  emoji: string
  count: number
  isActive: boolean
  onClick: () => void
}

function ReactionButton({ emoji, count, isActive, onClick }: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-110 ${
        isActive
          ? "bg-zinc-700 border border-violet-600/60 text-violet-400 hover:bg-violet-600/20"
          : "bg-zinc-700 border border-zinc-600 text-zinc-300 hover:bg-violet-600/20"
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
