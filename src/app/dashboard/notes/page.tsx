import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NoteCard } from "@/components/notes/NoteCard";
import Link from "next/link";
import { Search, FileX, ShieldPlus } from "lucide-react";

export const revalidate = 30 // Cache for 30 seconds;

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const query = (await searchParams).q?.toLowerCase() || "";
  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  const notes = await prisma.note.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subject: { contains: query, mode: "insensitive" } },
      ]
    },
    include: {
      user: { select: { name: true } },
      bookmarks: {
        where: { userId }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const groupedNotes = notes.reduce<Record<string, typeof notes>>((acc: Record<string, typeof notes>, note: typeof notes[0]) => {
    if (!acc[note.subject]) acc[note.subject] = [];
    acc[note.subject]!.push(note);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notes Library</h1>
          <p className="text-zinc-400 mt-1">Access all your class materials in one place.</p>
        </div>
        {isAdmin && (
          <Link 
            href="/dashboard/notes/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <ShieldPlus className="w-5 h-5" /> Admin Upload
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <form action="/dashboard/notes" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search notes by title or subject..."
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 transition-all outline-none shadow-sm"
          />
        </form>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <FileX className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium">No notes found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedNotes).map(([subject, subjectNotes]) => {
            const typedNotes = subjectNotes as typeof notes

            return (
              <section key={subject} className="space-y-6">
                <h2 className="text-xl font-bold text-violet-400 border-b border-zinc-800 pb-3">
                  {subject}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {typedNotes.map((note: typeof notes[0]) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isBookmarked={note.bookmarks.length > 0}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  );
}
