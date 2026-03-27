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

    const memes = await prisma.meme.findMany({
      skip,
      take,
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

    // Revalidate memes page for instant visibility
    revalidatePath('/dashboard/memes');
    revalidatePath('/dashboard');

    return NextResponse.json(meme, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
