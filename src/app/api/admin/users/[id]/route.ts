import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    if (body.action === 'approve') {
      const user = await prisma.user.update({
        where: { id },
        data: { role: 'STUDENT', isApproved: true }
      });
      return NextResponse.json(user);
    } 
    
    if (body.action === 'reject') {
      await prisma.user.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, action: 'deleted' });
    }
    
    if (body.action === 'remove') {
      const user = await prisma.user.update({
        where: { id },
        data: { role: 'PENDING', isApproved: false }
      });
      return NextResponse.json(user);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
