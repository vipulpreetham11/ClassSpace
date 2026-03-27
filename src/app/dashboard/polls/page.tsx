import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BarChart2 } from "lucide-react";
import { PollCardClient } from "./PollCardClient";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");
  
  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: {
        include: { _count: { select: { votes: true } } }
      },
      votes: {
        where: { userId }
      },
      _count: { select: { votes: true } }
    }
  });

  const activePolls = polls.filter((p: typeof polls[0]) => !p.expiresAt || new Date(p.expiresAt) > new Date());
  const expiredPolls = polls.filter((p: typeof polls[0]) => p.expiresAt && new Date(p.expiresAt) <= new Date());
  const sortedPolls = [...activePolls, ...expiredPolls];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Polls</h1>
          <p className="text-zinc-400 mt-1">Vote on campus decisions and events.</p>
        </div>
        {isAdmin && (
          <Link 
            href="/dashboard/polls/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Create Poll
          </Link>
        )}
      </div>

      {sortedPolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <BarChart2 className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No polls active right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedPolls.map((poll: typeof polls[0]) => {
            const hasVoted = poll.votes.length > 0;
            const userVoteOptionId = hasVoted ? poll.votes[0]!.pollOptionId : null;

            const sanitizedPoll = {
              id: poll.id,
              question: poll.question,
              expiresAt: poll.expiresAt ? poll.expiresAt.toISOString() : null,
              _count: poll._count,
              options: poll.options.map((opt: typeof poll.options[0]) => ({
                id: opt.id,
                text: opt.text,
                _count: opt._count
              }))
            };

            return (
              <PollCardClient 
                key={poll.id} 
                poll={sanitizedPoll} 
                isAdmin={isAdmin} 
                hasVoted={hasVoted} 
                userRole={session.user.role}
                userVoteOptionId={userVoteOptionId} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
