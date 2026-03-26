"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import type { Role } from "@prisma/client"
import { formatDate } from "@/lib/formatDate";

interface PollOption {
  id: string
  text: string
  _count: { votes: number }
}

interface PollWithCounts {
  id: string
  question: string
  expiresAt: Date | string | null
  _count: { votes: number }
  options: PollOption[]
}

interface PollCardClientProps {
  poll: PollWithCounts
  isAdmin: boolean
  hasVoted: boolean
  userRole: Role
  userVoteOptionId: string | null
}

export function PollCardClient({ poll, isAdmin, hasVoted, userRole, userVoteOptionId }: PollCardClientProps) {
  const router = useRouter();
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalVotes = poll._count.votes;
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  
  const isPending = userRole === "PENDING";
  const canVote = userRole === "STUDENT";

  const handleVote = async (optionId: string) => {
    if (hasVoted || isExpired || isPending) return;
    setIsVoting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this poll?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 relative">
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50"
          title="Delete Poll"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      <h3 className="text-xl font-bold text-white pr-12">{poll.question}</h3>
      <div className="flex items-center gap-3 mt-2 mb-6 text-sm text-zinc-400">
        <span className="font-medium text-violet-400">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {poll.expiresAt && (
          <>
            <span>•</span>
            <span className={isExpired ? "text-red-400" : "text-zinc-400"}>
              {isExpired ? "Ended" : "Ends: " + formatDate(poll.expiresAt)}
            </span>
          </>
        )}
      </div>

      <div className="space-y-3">
        {poll.options.map((opt) => {
          const optionVotes = opt._count.votes;
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const isUserVote = opt.id === userVoteOptionId;

          if (!canVote || hasVoted || isExpired || isPending) {
            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-lg bg-zinc-700 border ${isUserVote ? "border-violet-600" : "border-zinc-700"}`}
              >
                <div 
                  className={`absolute inset-y-0 left-0 bg-violet-600 transition-all duration-1000`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative px-4 py-3 flex justify-between items-center text-sm z-10">
                  <span className={`font-medium ${isUserVote ? "text-white" : "text-zinc-200"}`}>
                    {opt.text}
                  </span>
                  <span className="font-semibold text-white">{percentage}%</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={isVoting}
              className="w-full text-left px-4 py-3 rounded-lg bg-zinc-700 border border-zinc-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white transition-colors text-sm font-medium text-zinc-200 disabled:opacity-50"
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {isPending && (
        <p className="mt-4 text-xs font-semibold text-red-400">Your account is pending. You cannot participate in polls.</p>
      )}
    </div>
  );
}
