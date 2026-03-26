import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, Calendar, MessageSquare } from "lucide-react";
import { CommentBoxClient, DeleteDiscussionClient } from "./ClientComponents";
import { formatDate } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default async function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const { id } = await params;
  
  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } }
      }
    }
  });

  if (!discussion) redirect("/dashboard/discussions");

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/discussions"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
            {discussion.category}
          </span>
        </div>
        {isAdmin && <DeleteDiscussionClient id={discussion.id} />}
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 md:p-10 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">{discussion.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/20">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-zinc-300">{discussion.user?.name || "Unknown"}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            <Calendar className="w-4 h-4" /> {formatDate(discussion.createdAt)}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-700/50">
          <p className="text-zinc-200 text-lg leading-relaxed whitespace-pre-wrap">{discussion.content}</p>
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-violet-500" />
          <h2 className="text-2xl font-bold text-white">Comments ({discussion.comments.length})</h2>
        </div>

        <div className="space-y-4">
          {discussion.comments.map((comment: typeof discussion.comments[0]) => (
            <div key={comment.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white font-bold text-sm">
                  {(comment.user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-semibold text-zinc-200">{comment.user?.name || "Unknown"}</span>
                  <span className="text-xs text-zinc-500 font-medium shrink-0">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
          
          {discussion.comments.length === 0 && (
            <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800/50 border-dashed">
              <p className="text-zinc-500 font-medium">No comments yet. Start the discussion!</p>
            </div>
          )}
        </div>
      </div>

      <CommentBoxClient discussionId={discussion.id} />
    </div>
  );
}
