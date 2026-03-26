import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, MessageSquareOff } from "lucide-react";
import { ConfessionCardClient } from "./ConfessionCardClient";

export const dynamic = "force-dynamic";

export default async function ConfessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";

  const confessions = await prisma.confession.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    include: {
      reactions: true,
    }
  });

  const pendingCount = isAdmin ? await prisma.confession.count({ where: { isApproved: false, isRejected: false } }) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Confessions Wall</h1>
          <p className="text-zinc-400 mt-1">Anonymous thoughts and feelings from the campus.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link 
              href="/dashboard/confessions/pending"
              className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              Pending Approvals
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-yellow-950">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
          <Link 
            href="/dashboard/confessions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Submit Confession
          </Link>
        </div>
      </div>

      {confessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <MessageSquareOff className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No confessions yet.</p>
          <p className="text-zinc-500 text-sm">Be the first to share something anonymously!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {confessions.map(conf => (
            <ConfessionCardClient 
              key={conf.id} 
              id={conf.id}
              content={conf.content}
              createdAt={conf.createdAt}
              reactions={conf.reactions.map(r => ({ type: r.type, userId: r.userId }))}
              isAdmin={isAdmin} 
              currentUserId={session.user.id} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
