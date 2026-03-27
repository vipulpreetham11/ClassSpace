import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

const getDisplayName = (name: string | null, email: string | null) => {
  const base = (name ?? email ?? "Unknown").trim()
  return base.split(" ")[0] || "Unknown"
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "PENDING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const isAdmin = session.user.role === "ADMIN";

    // Get dashboard stats
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
    ]);

    // Get recent activity data
    const notes = await prisma.note.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const notices = await prisma.notice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

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
    });

    // Create activity events
    const events = [
      ...notes.map((n) => ({
        id: `note_${n.id}`,
        type: "NOTE",
        createdAt: n.createdAt.toISOString(),
        message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} uploaded a note: ${n.title}`,
      })),
      ...notices.map((n) => ({
        id: `notice_${n.id}`,
        type: "NOTICE",
        createdAt: n.createdAt.toISOString(),
        message: `${getDisplayName(n.user?.name ?? null, n.user?.email ?? null)} posted a notice: ${n.title}`,
      })),
      ...newUsers.map((u) => ({
        id: `user_${u.id}`,
        type: "USER",
        createdAt: u.createdAt.toISOString(),
        message: `${getDisplayName(u.name, u.email)} joined ClassSpace`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalNotes,
        activeNotices,
        totalStudents,
        pendingConfessions,
      },
      recentActivity: events,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}