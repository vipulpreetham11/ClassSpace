import type { DefaultSession } from "next-auth"

type Role = "STUDENT" | "ADMIN" | "PENDING"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      isApproved?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: Role
    isApproved?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    isApproved: boolean
  }
}
