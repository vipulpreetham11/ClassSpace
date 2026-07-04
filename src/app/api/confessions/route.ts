import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');

    if (session.user.role === "ADMIN" && searchParams.get("status") === "pending") {
      const pending = await prisma.confession.findMany({
        where: { isApproved: false, isRejected: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } }
      });
      return NextResponse.json(pending);
    }

    const approved = await prisma.confession.findMany({
      where: { isApproved: true },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { reactions: true }
    });
    return NextResponse.json(approved);
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

    // Revalidate confessions page
    revalidatePath('/dashboard/confessions');
    revalidatePath('/dashboard');

    return NextResponse.json(confession, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
