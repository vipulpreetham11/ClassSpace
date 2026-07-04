import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NoticeCard } from "@/components/notices/NoticeCard";
import Link from "next/link";
import { Plus, BellOff } from "lucide-react";

export const revalidate = 30;

export default async function NoticesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";
  const now = new Date();

  const notices = await prisma.notice.findMany({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    include: {
      user: { select: { name: true } }
    },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" }
    ]
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notice Board</h1>
          <p className="text-zinc-400 mt-1">Official announcements and urgent updates.</p>
        </div>
        
        {isAdmin && (
          <Link 
            href="/dashboard/notices/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Post Notice
          </Link>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <BellOff className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No active notices at the moment.</p>
          <p className="text-zinc-500 text-sm">Check back later for announcements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice: typeof notices[0]) => (
            <NoticeCard 
              key={notice.id} 
              notice={notice} 
              isAdmin={isAdmin} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
