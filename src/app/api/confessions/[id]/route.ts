import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { action, type } = await req.json();

    if (action === "react") {
      if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (!type || !["LIKE", "LOVE", "FIRE", "LAUGH"].includes(type)) {
        return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
      }

      const existing = await prisma.reaction.findUnique({
        where: { userId_confessionId: { userId: session.user.id, confessionId: id } }
      });

      if (existing) {
        if (existing.type === type) {
          await prisma.reaction.delete({ where: { id: existing.id } }); 
        } else {
          await prisma.reaction.update({ where: { id: existing.id }, data: { type } }); 
        }
      } else {
        await prisma.reaction.create({
          data: {
            type,
            userId: session.user.id,
            confessionId: id
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (action === "approve") {
      await prisma.confession.update({
        where: { id },
        data: { isApproved: true, isRejected: false }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await prisma.confession.update({
        where: { id },
        data: { isApproved: false, isRejected: true }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.confession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete confession" }, { status: 500 });
  }
}
