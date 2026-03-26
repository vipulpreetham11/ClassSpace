import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PendingConfessionClient } from "./PendingConfessionClient";

export const dynamic = "force-dynamic";

export default async function PendingConfessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");
  if (session.user.role !== "ADMIN") redirect("/dashboard/confessions");

  const pending = await prisma.confession.findMany({
    where: { isApproved: false, isRejected: false },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/confessions"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pending Confessions</h1>
          <p className="text-zinc-400 text-sm mt-1">Review anonymous submissions before they go public.</p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-zinc-400 font-medium text-lg">No pending confessions.</p>
          <p className="text-zinc-500 text-sm">All caught up! The queue is empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(conf => (
            <PendingConfessionClient 
              key={conf.id} 
              id={conf.id}
              content={conf.content}
              createdAt={conf.createdAt}
              user={conf.user}
            />
          ))}
        </div>
      )}
    </div>
  );
}
