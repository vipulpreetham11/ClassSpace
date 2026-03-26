import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If PENDING or not approved, redirect to pending page
  if (token.role === 'PENDING' || !token.isApproved) {
    return NextResponse.redirect(new URL('/pending', request.url))
  }

  // STUDENT and ADMIN pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
