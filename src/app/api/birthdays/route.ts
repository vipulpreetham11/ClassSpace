import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

type BirthdayResponse = {
  id: string
  userId: string
  date: string
  message: string | null
  user: {
    name: string | null
  }
}

const normalizeBirthdayDate = (inputDate: string) => {
  const parsed = new Date(inputDate)
  const now = new Date()
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(now.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const birthdays = await prisma.birthday.findMany({
      include: {
        user: { select: { name: true } },
      },
    })

    const now = new Date()

    const response: BirthdayResponse[] = birthdays
      .map(b => {
        const next = new Date(b.date)
        next.setFullYear(now.getFullYear())
        if (next < now) next.setFullYear(now.getFullYear() + 1)
        return { birthday: b, nextTime: next.getTime() }
      })
      .sort((a, b) => a.nextTime - b.nextTime)
      .map(({ birthday }) => ({
        id: birthday.id,
        userId: birthday.userId,
        date: birthday.date.toISOString(),
        message: birthday.message ?? null,
        user: { name: birthday.user?.name ?? null },
      }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: "Failed to fetch birthdays" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "PENDING") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body: unknown = await req.json()

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const payload = body as {
      studentName?: unknown
      date?: unknown
      message?: unknown
    }

    const studentName = typeof payload.studentName === "string" ? payload.studentName.trim() : ""
    const dateInput = typeof payload.date === "string" ? payload.date : ""
    const message = typeof payload.message === "string" ? payload.message.trim() : undefined

    if (!studentName || !dateInput) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const normalizedDate = normalizeBirthdayDate(dateInput)
    if (!normalizedDate) return NextResponse.json({ error: "Invalid date" }, { status: 400 })

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: studentName, mode: "insensitive" } },
          { email: { equals: studentName, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    })

    if (!user) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const birthday = await prisma.birthday.create({
      data: {
        userId: user.id,
        date: normalizedDate,
        message: message ? message : null,
      },
    })

    return NextResponse.json(birthday, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create birthday" }, { status: 500 })
  }
}
