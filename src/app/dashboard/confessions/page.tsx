import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Ghost as GhostIcon, ShieldCheck } from "lucide-react";
import { ConfessionsPageClient } from "./ConfessionsPageClient";

export const dynamic = "force-dynamic";

export default async function ConfessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";
  const currentUserId = session.user.id;

  const [initialConfessions, totalConfessions] = await Promise.all([
    prisma.confession.findMany({
      where: { isApproved: true },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { reactions: true },
    }),
    prisma.confession.count({ where: { isApproved: true } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Confessions Wall</h1>
          <p className="text-zinc-400 mt-1">Anonymous thoughts and feelings from campus.</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700 whitespace-nowrap"
            >
              <ShieldCheck className="w-5 h-5" /> Review Pending
            </Link>
          )}
          <Link
            href="/dashboard/confessions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Confess
          </Link>
        </div>
      </div>

      {initialConfessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
            <GhostIcon className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No confessions yet.</p>
          <p className="text-zinc-500 text-sm">Approved confessions will appear here.</p>
        </div>
      ) : (
        <ConfessionsPageClient
          initialConfessions={initialConfessions}
          totalConfessions={totalConfessions}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
