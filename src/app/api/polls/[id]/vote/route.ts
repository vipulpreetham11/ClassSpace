import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
// Prisma namespace not needed in Prisma 7
type OptionVotesResponse = {
  id: string
  text: string
  votes: number
}

type VoteResponse = {
  pollId: string
  totalVotes: number
  options: OptionVotesResponse[]
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (session.user.isApproved !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id: pollId } = await params
    const body: unknown = await req.json()

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const optionId =
      typeof (body as { optionId?: unknown }).optionId === "string"
        ? ((body as { optionId?: unknown }).optionId as string).trim()
        : ""

    if (!optionId) {
      return NextResponse.json({ error: "Option ID is required" }, { status: 400 })
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        expiresAt: true,
        options: { select: { id: true, text: true } },
      },
    })

    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      return NextResponse.json({ error: "Poll ended" }, { status: 400 })
    }

    const optionExists = poll.options.some((o: { id: string }) => o.id === optionId)
    if (!optionExists) return NextResponse.json({ error: "Invalid option" }, { status: 400 })

    try {
      // Enforce uniqueness using the DB constraint @@unique([userId, pollId])
      await prisma.pollVote.create({
        data: {
          userId: session.user.id,
          pollId,
          pollOptionId: optionId,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error"
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json(
          { error: 'Already voted' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const updated = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { include: { _count: { select: { votes: true } } } },
        _count: { select: { votes: true } },
      },
    })

    if (!updated) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    const response: VoteResponse = {
      pollId,
      totalVotes: updated._count.votes,
      options: updated.options.map(o => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes,
      })),
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
