import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NoteCard } from "@/components/notes/NoteCard";
import Link from "next/link";
import { Plus, FileX } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;

  const [notes, myBookmarks] = await Promise.all([
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      select: { noteId: true },
    }),
  ]);

  const bookmarkedIds = new Set(myBookmarks.map((b) => b.noteId));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notes Library</h1>
          <p className="text-zinc-400 mt-1">Study materials shared across the class.</p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/notes/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Upload Note
          </Link>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <FileX className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No notes uploaded yet.</p>
          <p className="text-zinc-500 text-sm">Check back later for study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isBookmarked={bookmarkedIds.has(note.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
