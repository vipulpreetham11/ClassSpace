import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, MessageCircle, Hash } from "lucide-react";
import { formatDate } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default async function DiscussionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const discussions = await prisma.discussion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: { select: { comments: true } }
    }
  });

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "academic": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "events": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "help": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "other": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default: return "bg-blue-500/10 text-blue-400 border-blue-500/20"; 
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Discussions</h1>
          <p className="text-zinc-400 mt-1">Start a conversation or ask for help from peers.</p>
        </div>
        <Link 
          href="/dashboard/discussions/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> New Discussion
        </Link>
      </div>

      {discussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <MessageCircle className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No discussions started yet.</p>
          <p className="text-zinc-500 text-sm">Be the first to break the ice!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {discussions.map((disc: typeof discussions[0]) => (
            <Link 
              key={disc.id} 
              href={`/dashboard/discussions/${disc.id}`}
              className="bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-500/30 rounded-xl p-5 md:p-6 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${getCategoryColor(disc.category)}`}>
                    {disc.category}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {formatDate(disc.createdAt)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">
                  {disc.title}
                </h3>
                <p className="text-zinc-400 text-sm mt-1 line-clamp-1">
                  Posted by <span className="text-zinc-300 font-medium">{disc.user?.name || "Unknown"}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg shrink-0">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{disc._count.comments}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
