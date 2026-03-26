import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "PENDING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        user: { select: { name: true } }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ]
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    const { title, content, isPinned, isUrgent, expiresAt } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const notice = await prisma.notice.create({
      data: {
        title: String(title),
        content: String(content),
        isPinned: Boolean(isPinned),
        isUrgent: Boolean(isUrgent),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        postedBy: session.user.id,
      }
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
