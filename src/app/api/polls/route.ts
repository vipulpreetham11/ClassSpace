import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type PollOptionResponse = {
  id: string
  text: string
  votes: number
}

type PollResponse = {
  id: string
  question: string
  expiresAt: string | null
  totalVotes: number
  options: PollOptionResponse[]
  hasVoted: boolean
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: { include: { _count: { select: { votes: true } } } },
        votes: { where: { userId: session.user.id }, select: { pollOptionId: true } },
        _count: { select: { votes: true } },
      },
    })

    const response: PollResponse[] = polls.map(poll => ({
      id: poll.id,
      question: poll.question,
      expiresAt: poll.expiresAt ? poll.expiresAt.toISOString() : null,
      totalVotes: poll._count.votes,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes,
      })),
      hasVoted: poll.votes.length > 0,
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body: unknown = await req.json()

    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every(item => typeof item === "string")

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const payload = body as {
      question?: unknown
      options?: unknown
      expiresAt?: unknown
    }

    const question = typeof payload.question === "string" ? payload.question.trim() : ""
    const options = isStringArray(payload.options) ? payload.options.map(o => o.trim()) : []
    const expiresAtRaw = payload.expiresAt

    if (!question || options.length < 2 || options.length > 6) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const expiresAt =
      typeof expiresAtRaw === "string" && expiresAtRaw.trim()
        ? new Date(expiresAtRaw)
        : null

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 })
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        createdBy: session.user.id,
        expiresAt,
        options: {
          create: options.map(text => ({ text })),
        },
      },
    })

    return NextResponse.json(poll, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 })
  }
}
