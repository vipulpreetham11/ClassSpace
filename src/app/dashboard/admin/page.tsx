import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminPanelClient } from "./AdminPanelClient";

export const dynamic = "force-dynamic"
export const revalidate = 30 // Cache for 30 seconds;

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "PENDING") redirect("/pending");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

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

  const stats = {
    totalStudents: students.length,
    pendingApprovals: pendingUsers.length,
    totalNotes: await prisma.note.count(),
    totalNotices: await prisma.notice.count(),
  };

  return <AdminPanelClient initialPending={pendingUsers} initialStudents={students} stats={stats} />;
}
