import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/pending' ||
    pathname.startsWith('/api/auth/')

  if (isPublicRoute) return NextResponse.next()

  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  const isApproved = token.isApproved
  const role = token.role

  // If not approved, redirect to pending page
  if (role === 'PENDING' || isApproved === false) {
    return NextResponse.redirect(new URL('/pending', request.url))
  }

  // STUDENT and ADMIN pass through
  if (role === 'STUDENT' || role === 'ADMIN') return NextResponse.next()

  // Unknown role: safest fallback
  return NextResponse.redirect(new URL('/pending', request.url))
}

export const config = {
  matcher: ['/dashboard/:path*']
}
