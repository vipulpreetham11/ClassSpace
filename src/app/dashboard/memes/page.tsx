import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ImageOff } from "lucide-react";
import { MemesPageClient } from "./MemesPageClient"; 

export const revalidate = 30 // Cache for 30 seconds;

export default async function MemesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";

  const memes = await prisma.meme.findMany({
    take: 20, // Load first 20 for instant display
    orderBy: { createdAt: "desc" },
    include: {
      reactions: true,
      user: { select: { name: true } }
    }
  });

  const totalMemes = await prisma.meme.count();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Memes</h1>
          <p className="text-zinc-400 mt-1">Campus humor and relatable moments.</p>
        </div>
        {isAdmin && (
          <Link 
            href="/dashboard/memes/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Upload Meme
          </Link>
        )}
      </div>

      {memes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <ImageOff className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No memes yet 💀</p>
        </div>
      ) : (
        <MemesPageClient
          initialMemes={memes}
          totalMemes={totalMemes}
          isAdmin={isAdmin}
          currentUserId={session.user.id}
        />
      )}
    </div>
  );
}
