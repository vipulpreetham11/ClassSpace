import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    const pendingUsers = await prisma.user.findMany({
      where: { role: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, image: true, role: true, isApproved: true, createdAt: true }
    });
    
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, image: true, role: true, isApproved: true, createdAt: true, rollNumber: true, branch: true, year: true }
    });

    const totalNotes = await prisma.note.count();
    const totalNotices = await prisma.notice.count();

    const stats = {
      totalStudents: students.length,
      pendingApprovals: pendingUsers.length,
      totalNotes,
      totalNotices,
    };

    return NextResponse.json({ pendingUsers, students, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
