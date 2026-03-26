import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (session.user.role === "ADMIN") {
      const pending = await prisma.confession.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } }
      });
      return NextResponse.json(pending);
    } else {
      const approved = await prisma.confession.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { reactions: true }
      });
      return NextResponse.json(approved);
    }
  } catch {
    return NextResponse.json({ error: "Failed to fetch confessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const confession = await prisma.confession.create({
      data: {
        content: content.trim(),
        isApproved: false,
        isRejected: false,
        postedBy: session.user.id
      }
    });

    return NextResponse.json(confession, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create confession" }, { status: 500 });
  }
}
