"use client";

import { useState, useEffect } from "react";
import { MemeCardClient } from "./MemeCardClient";
import { Loader2 } from "lucide-react";

type ReactionType = "LIKE" | "LOVE" | "FIRE" | "LAUGH";

type Meme = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
  reactions: { type: ReactionType; userId: string }[];
  user: { name: string | null };
};

interface MemesPageClientProps {
  initialMemes: Meme[];
  totalMemes: number;
  isAdmin: boolean;
  currentUserId: string;
}

export function MemesPageClient({
  initialMemes,
  totalMemes,
  isAdmin,
  currentUserId
}: MemesPageClientProps) {
  const [memes, setMemes] = useState(initialMemes);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(totalMemes > initialMemes.length);

  // Auto-load remaining memes in background
  useEffect(() => {
    if (hasMore && memes.length < totalMemes) {
      const loadRemainingMemes = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/memes?skip=${memes.length}`);
          if (response.ok) {
            const remainingMemes = await response.json();
            setMemes(prev => [...prev, ...remainingMemes]);
            setHasMore(remainingMemes.length === 20); // If we got less than 20, we're done
          }
        } catch (error) {
          console.error('Failed to load more memes:', error);
        } finally {
          setLoading(false);
        }
      };

      // Load remaining memes after a short delay
      const timer = setTimeout(loadRemainingMemes, 1000);
      return () => clearTimeout(timer);
    }
  }, [memes.length, totalMemes, hasMore]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme) => (
          <MemeCardClient
            key={meme.id}
            meme={meme}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span className="ml-2 text-zinc-400">Loading more memes...</span>
        </div>
      )}
    </>
  );
}