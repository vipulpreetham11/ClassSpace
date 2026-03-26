"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

interface PendingConfessionProps {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { name: string | null; email: string | null } | null;
}

export function PendingConfessionClient({ id, content, createdAt, user }: PendingConfessionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/confessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      alert("Failed to perform action");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-zinc-800 border border-zinc-700 rounded-xl">
      <div className="flex-1 min-w-0 space-y-3">
        <p className="text-zinc-200 italic font-serif leading-relaxed line-clamp-3">&quot;{content}&quot;</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 font-mono">
          <span>Submitted: {formatDate(createdAt)}</span>
          <span>•</span>
          <span className="text-violet-400">Identity: {user?.name || "Unknown"} ({user?.email || "No Email"})</span>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
        <button
          onClick={() => handleAction("approve")}
          disabled={isLoading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-500 font-medium rounded-lg transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          onClick={() => handleAction("reject")}
          disabled={isLoading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg transition-all disabled:opacity-50"
        >
          <X className="w-4 h-4" /> Reject
        </button>
      </div>
    </div>
  );
}
