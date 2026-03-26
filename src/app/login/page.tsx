"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-[#1a1a1a]">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-white">ClassSpace</h1>
        <p className="text-[#a0a0a0]">Your class, organized</p>
      </div>

      <div className="bg-[#2a2a2a] p-8 rounded-xl shadow-lg w-full max-w-md border border-[#3a3a3a]">
        <h2 className="text-xl text-white font-semibold text-center mb-6">Welcome Back</h2>
        
        {error === "AccessDenied" && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            Access denied. Please use your official college email.
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-[#0084ff] hover:bg-[#0066cc] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
        >
          Login with College Email
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-[#1a1a1a] text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
