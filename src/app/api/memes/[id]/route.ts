import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action, type } = await req.json();

    if (action === "react" && ["LIKE", "LOVE", "FIRE", "LAUGH"].includes(type)) {
      const existing = await prisma.reaction.findUnique({
        where: { userId_memeId: { userId: session.user.id, memeId: id } }
      });

      if (existing) {
        if (existing.type === type) {
          await prisma.reaction.delete({ where: { id: existing.id } }); 
        } else {
          await prisma.reaction.update({ where: { id: existing.id }, data: { type } }); 
        }
      } else {
        await prisma.reaction.create({
          data: { type, userId: session.user.id, memeId: id }
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params;
    await prisma.meme.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete meme" }, { status: 500 });
  }
}
