import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/formatDate";
import { FileText, Bell, Users, Ghost } from "lucide-react";

export const dynamic = "force-dynamic";

const getDisplayName = (name: string | null, email: string | null) => {
  const base = (name ?? email ?? "Unknown").trim();
  return base.split(" ")[0] || "Unknown";
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");

  const isAdmin = session.user.role === "ADMIN";
  const now = new Date();

  const [totalNotes, activeNotices, totalStudents, pendingConfessions] =
    await Promise.all([
      prisma.note.count(),
      prisma.notice.count({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      isAdmin
        ? prisma.confession.count({
            where: { isApproved: false, isRejected: false },
          })
        : Promise.resolve(0),
    ]);

  const [recentNotes, recentNotices, recentUsers] = await Promise.all([
    prisma.note.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.notice.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      take: 3,
      where: { role: { in: ["STUDENT", "ADMIN"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  const activity = [
    ...recentNotes.map((n) => ({
      id: `note_${n.id}`,
      message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} uploaded a note: ${n.title}`,
      createdAt: n.createdAt,
    })),
    ...recentNotices.map((n) => ({
      id: `notice_${n.id}`,
      message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} posted a notice: ${n.title}`,
      createdAt: n.createdAt,
    })),
    ...recentUsers.map((u) => ({
      id: `user_${u.id}`,
      message: `${getDisplayName(u.name, u.email)} joined ClassSpace`,
      createdAt: u.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const username = session.user.name
    ? session.user.name.split(" ")[0]
    : "Student";

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, {username}
        </h1>
        <p className="text-zinc-400 mt-2">
          Here is what is happening in CSM-A today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Notes"
          value={totalNotes}
          icon={<FileText className="w-5 h-5" />}
          color="text-violet-400 bg-violet-600/20"
        />
        <StatCard
          title="Active Notices"
          value={activeNotices}
          icon={<Bell className="w-5 h-5" />}
          color="text-orange-400 bg-orange-500/20"
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="w-5 h-5" />}
          color="text-emerald-400 bg-emerald-500/20"
        />
        {isAdmin && (
          <StatCard
            title="Pending Confessions"
            value={pendingConfessions}
            icon={<Ghost className="w-5 h-5" />}
            color="text-red-400 bg-red-500/20"
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Recent Activity
        </h2>
        {activity.length === 0 ? (
          <div className="py-16 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <p className="text-zinc-500 text-sm">No activity yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 bg-zinc-800 rounded-xl p-4 border border-zinc-700"
              >
                <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-white text-sm">{event.message}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {formatDate(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-zinc-400 text-sm font-medium">{title}</p>
        <p className="text-white text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
  );
}
