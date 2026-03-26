import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body: unknown = await req.json()
    const action =
      typeof body === "object" && body !== null
        ? (body as { action?: unknown }).action
        : undefined

    if (action === "download") {
      const note = await prisma.note.update({
        where: { id },
        data: { downloads: { increment: 1 } },
      })
      return NextResponse.json(note)
    }

    if (action === "bookmark") {
      const userId = session.user.id

      const existing = await prisma.bookmark.findUnique({
        where: { userId_noteId: { userId, noteId: id } },
      })

      if (existing) {
        await prisma.bookmark.delete({ where: { id: existing.id } })
        return NextResponse.json({ bookmarked: false })
      }

      await prisma.bookmark.create({ data: { userId, noteId: id } })
      return NextResponse.json({ bookmarked: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
