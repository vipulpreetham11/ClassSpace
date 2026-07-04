import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ImageOff } from "lucide-react";
import { MemesPageClient } from "./MemesPageClient";

export const revalidate = 30;

export default async function MemesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";
  const currentUserId = session.user.id;

  const [initialMemes, totalMemes] = await Promise.all([
    prisma.meme.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        reactions: true,
        user: { select: { name: true } },
      },
    }),
    prisma.meme.count(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {initialMemes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <ImageOff className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No memes yet.</p>
          <p className="text-zinc-500 text-sm">Be the first to post one.</p>
        </div>
      ) : (
        <MemesPageClient
          initialMemes={initialMemes}
          totalMemes={totalMemes}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
