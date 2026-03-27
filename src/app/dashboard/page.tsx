import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { FileText, Bell, Users, Ghost, Clock } from "lucide-react"
import { formatDate } from "@/lib/formatDate"

export const dynamic = "force-dynamic"
export const revalidate = 30 // Cache for 30 seconds

type ActivityEventKind = "NOTE" | "NOTICE" | "USER"

type ActivityEvent = {
  id: string
  kind: ActivityEventKind
  createdAt: Date
  message: string
}

const getDisplayName = (name: string | null, email: string | null) => {
  const base = (name ?? email ?? "Unknown").trim()
  return base.split(" ")[0] || "Unknown"
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  if (session.user.role === "PENDING") redirect("/pending")

  const now = new Date()
  const isAdmin = session.user.role === "ADMIN"

  const [totalNotes, activeNotices, totalStudents, pendingConfessions] = await Promise.all([
    prisma.note.count(),
    prisma.notice.count({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    isAdmin
      ? prisma.confession.count({ where: { isApproved: false, isRejected: false } })
      : Promise.resolve(0),
  ])

  const notes = await prisma.note.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  const notices = await prisma.notice.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  const newUsers = await prisma.user.findMany({
    take: 5,
    where: { role: { in: ["STUDENT", "ADMIN"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  const events: ActivityEvent[] = [
    ...notes.map((n: typeof notes[0]) => ({
      id: `note_${n.id}`,
      kind: "NOTE" as const,
      createdAt: n.createdAt,
      message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} uploaded a note: ${n.title}`,
    })),
    ...notices.map((n: typeof notices[0]) => ({
      id: `notice_${n.id}`,
      kind: "NOTICE" as const,
      createdAt: n.createdAt,
      message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} posted a notice: ${n.title}`,
    })),
    ...newUsers.map((u: typeof newUsers[0]) => ({
      id: `user_${u.id}`,
      kind: "USER" as const,
      createdAt: u.createdAt,
      message: `${getDisplayName(u.name, u.email)} joined ClassSpace`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)

  const username = session.user.name ? session.user.name.split(" ")[0] : "Student"

  const getEventAccent = (kind: ActivityEventKind) => {
    switch (kind) {
      case "NOTE":
        return { iconBg: "bg-violet-600/20 text-violet-600", Icon: FileText }
      case "NOTICE":
        return { iconBg: "bg-orange-500/20 text-orange-500", Icon: Bell }
      case "USER":
        return { iconBg: "bg-emerald-500/20 text-emerald-500", Icon: Users }
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, {username}
        </h1>
        <p className="text-zinc-400 mt-2">Here is what is happening in CSM-A today.</p>
      </div>

      <div className={isAdmin ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-800 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium">Total Notes</p>
            <p className="text-white text-3xl font-bold mt-2">{totalNotes}</p>
          </div>
          <div className="p-3 bg-violet-600/20 text-violet-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-800 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium">Active Notices</p>
            <p className="text-white text-3xl font-bold mt-2">{activeNotices}</p>
          </div>
          <div className="p-3 bg-orange-500/20 text-orange-500 rounded-lg">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        {isAdmin && (
          <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-800 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium">Pending Confessions</p>
              <p className="text-white text-3xl font-bold mt-2">{pendingConfessions}</p>
            </div>
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-lg">
              <Ghost className="w-6 h-6" />
            </div>
          </div>
        )}

        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-800 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-medium">Total Students</p>
            <p className="text-white text-3xl font-bold mt-2">{totalStudents}</p>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/50">
          {events.length === 0 ? (
            <div className="p-6 text-zinc-400 text-sm">No activity yet.</div>
          ) : (
            events.map((e: ActivityEvent) => {
              const { iconBg, Icon } = getEventAccent(e.kind)
              return (
                <div
                  key={e.id}
                  className="p-4 flex items-center gap-4 hover:bg-zinc-700/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.message}</p>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(e.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

