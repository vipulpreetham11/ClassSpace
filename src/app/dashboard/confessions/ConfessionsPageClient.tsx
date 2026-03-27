"use client";

import { useState, useEffect } from "react";
import { ConfessionCardClient } from "./ConfessionCardClient";
import { Loader2 } from "lucide-react";

type ReactionType = "LIKE" | "LOVE" | "FIRE" | "LAUGH";

type Confession = {
  id: string;
  content: string;
  createdAt: Date;
  reactions: { type: ReactionType; userId: string }[];
};

interface ConfessionsPageClientProps {
  initialConfessions: Confession[];
  totalConfessions: number;
  isAdmin: boolean;
  currentUserId: string;
}

export function ConfessionsPageClient({
  initialConfessions,
  totalConfessions,
  isAdmin,
  currentUserId
}: ConfessionsPageClientProps) {
  const [confessions, setConfessions] = useState(initialConfessions);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(totalConfessions > initialConfessions.length);

  // Auto-load remaining confessions in background
  useEffect(() => {
    if (hasMore && confessions.length < totalConfessions) {
      const loadRemainingConfessions = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/confessions?skip=${confessions.length}`);
          if (response.ok) {
            const remainingConfessions = await response.json();
            setConfessions(prev => [...prev, ...remainingConfessions]);
            setHasMore(remainingConfessions.length === 20); // If we got less than 20, we're done
          }
        } catch (error) {
          console.error('Failed to load more confessions:', error);
        } finally {
          setLoading(false);
        }
      };

      // Load remaining confessions after a short delay
      const timer = setTimeout(loadRemainingConfessions, 1000);
      return () => clearTimeout(timer);
    }
  }, [confessions.length, totalConfessions, hasMore]);

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {confessions.map((conf) => (
          <ConfessionCardClient
            key={conf.id}
            id={conf.id}
            content={conf.content}
            createdAt={conf.createdAt}
            reactions={conf.reactions.map((r) => ({ type: r.type, userId: r.userId }))}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span className="ml-2 text-zinc-400">Loading more confessions...</span>
        </div>
      )}
    </>
  );
}