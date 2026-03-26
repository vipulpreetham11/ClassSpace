import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) return NextResponse.json({ error: "Content needed" }, { status: 400 });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postedBy: session.user.id,
        discussionId: id
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { discussionId: id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } } }
    });
    return NextResponse.json(comments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
