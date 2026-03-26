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
    const discussions = await prisma.discussion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        _count: { select: { comments: true } }
      }
    });
    return NextResponse.json(discussions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch discussions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content, category } = await req.json();
    if (!title?.trim() || !content?.trim() || !category?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const discussion = await prisma.discussion.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        postedBy: session.user.id
      }
    });

    return NextResponse.json(discussion, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
