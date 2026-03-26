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

    const updateData: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isUrgent?: boolean;
      expiresAt?: Date | null;
    } = {};

    if (body.title !== undefined) updateData.title = String(body.title);
    if (body.content !== undefined) updateData.content = String(body.content);
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.isUrgent !== undefined) updateData.isUrgent = Boolean(body.isUrgent);
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const notice = await prisma.notice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    await prisma.notice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
