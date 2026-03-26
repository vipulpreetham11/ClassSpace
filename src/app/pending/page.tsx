"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function PendingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Account Pending</h1>
          <p className="text-zinc-400">
            Your account is pending admin approval. You&apos;ll get access to the dashboard once approved.
          </p>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-300">
          <p className="font-medium text-white">{session?.user?.name || "Student"}</p>
          <p>{session?.user?.email}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-700"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
