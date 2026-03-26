import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Search, Shield } from "lucide-react"
import { formatDate } from "@/lib/formatDate"

export const dynamic = "force-dynamic"

type StudentsPageProps = {
  searchParams: Promise<{ q?: string }>
}

type StudentCardUser = {
  id: string
  name: string | null
  email: string | null
  rollNumber: string | null
  branch: string | null
  year: number | null
  role: "STUDENT" | "ADMIN"
  createdAt: Date
}

const getInitials = (value: string | null) => {
  const v = (value ?? "U").trim()
  const firstChar = v.charAt(0).toUpperCase()
  return firstChar || "U"
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  if (session.user.role === "PENDING") redirect("/pending")

  const q = (await searchParams).q?.trim().toLowerCase() || ""

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
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const filtered = q
    ? users.filter((u: typeof users[0]) => {
        const nameMatch = (u.name ?? "").toLowerCase().includes(q)
        const emailMatch = (u.email ?? "").toLowerCase().includes(q)
        return nameMatch || emailMatch
      })
    : users

  const cards: StudentCardUser[] = filtered.map((u: typeof filtered[0]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    rollNumber: u.rollNumber,
    branch: u.branch,
    year: u.year,
    role: u.role === "ADMIN" ? "ADMIN" : "STUDENT",
    createdAt: u.createdAt,
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Students</h1>
          <p className="text-zinc-400 mt-1">Browse and manage enrolled students.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <form action="/dashboard/students" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email..."
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 transition-all outline-none shadow-sm"
          />
        </form>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 font-semibold">
            —
          </div>
          <p className="text-zinc-400 font-medium">No matching students found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((u: StudentCardUser) => {
            const initials = getInitials(u.name ?? u.email)
            return (
              <div
                key={u.id}
                className="bg-zinc-800 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate">{u.name ?? "Unknown"}</h3>
                      {u.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm break-all mt-1">{u.email ?? "No email"}</p>

                    <div className="mt-3 space-y-1 text-xs text-zinc-500">
                      <p>
                        Roll No: <span className="text-zinc-300">{u.rollNumber ?? "N/A"}</span>
                      </p>
                      <p>
                        Branch: <span className="text-zinc-300">{u.branch ?? "N/A"}</span>
                      </p>
                      <p>
                        Year: <span className="text-zinc-300">{u.year ?? "N/A"}</span>
                      </p>
                      <p>
                        Joined: <span className="text-zinc-300">{formatDate(u.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

