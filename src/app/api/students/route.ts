import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

type Role = "STUDENT" | "ADMIN" | "PENDING"

type StudentUserItem = {
  id: string
  name: string | null
  email: string | null
  rollNumber: string | null
  branch: string | null
  year: number | null
  role: Role
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "PENDING") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: { role: { in: ["STUDENT", "ADMIN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        rollNumber: true,
        branch: true,
        year: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const response: StudentUserItem[] = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      rollNumber: u.rollNumber,
      branch: u.branch,
      year: u.year,
      role: u.role,
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

