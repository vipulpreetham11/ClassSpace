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
    const memes = await prisma.meme.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reactions: true,
        user: { select: { name: true } }
      }
    });
    return NextResponse.json(memes);
  } catch {
    return NextResponse.json({ error: "Failed to fetch memes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { imageUrl, caption } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const meme = await prisma.meme.create({
      data: {
        imageUrl,
        caption: caption?.trim() || null,
        uploadedBy: session.user.id
      }
    });

    return NextResponse.json(meme, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload meme" }, { status: 500 });
  }
}
