"use client"
import { SessionProvider } from "next-auth/react"

if (typeof window === "undefined") {
  // Some auth libraries reference the global `location` during SSR.
  // Provide a minimal stub so production builds don't crash.
  const existing = (globalThis as unknown as { location?: unknown }).location
  if (existing === undefined) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const url = new URL(baseUrl)
    const locationStub = {
      href: url.href,
      origin: url.origin,
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
    } as unknown
    ;(globalThis as unknown as { location?: unknown }).location = locationStub

    const existingWindow = (globalThis as unknown as { window?: unknown }).window
    if (existingWindow === undefined) {
      ;(globalThis as unknown as { window?: unknown }).window = { location: locationStub }
    }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
