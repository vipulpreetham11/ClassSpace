import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import type { Adapter } from "next-auth/adapters"
type Role = "STUDENT" | "ADMIN" | "PENDING"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? ''
      return email.endsWith('@mallareddyuniversity.ac.in')
    },

    async jwt({ token, user, trigger, session }) {
      // First time user signs in, user object is provided
      if (user?.id) {
        token.id = user.id

        // The adapter may not spread custom fields into `user`, so we fetch them.
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, isApproved: true },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.isApproved = dbUser.isApproved
          }
        }
      }

      // Handle session updates
      if (trigger === "update" && session?.user) {
        token.id = session.user.id
        token.role = session.user.role as Role
        token.isApproved = session.user.isApproved
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? session.user.id ?? ""
        session.user.role = (token.role ?? ("PENDING" as Role)) as Role
        session.user.isApproved = token.isApproved
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
