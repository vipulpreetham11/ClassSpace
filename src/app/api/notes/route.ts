import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === "PENDING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins Only" }, { status: 403 });
    }

    const body = await req.json();
    const { title, subject, description, fileUrl, fileType } = body;

    if (!title || !subject || !description || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title: String(title),
        subject: String(subject),
        description: String(description),
        fileUrl: String(fileUrl),
        fileType: String(fileType || "unknown"),
        uploadedBy: session.user.id,
      }
    });

    // Revalidate notes pages so they show fresh data
    revalidatePath('/dashboard/notes');
    revalidatePath('/dashboard');

    return NextResponse.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
