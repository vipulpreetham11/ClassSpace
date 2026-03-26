"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Ghost, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function NewConfessionPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login")
      return
    }

    if (authStatus !== "authenticated" || !session?.user) return

    if (session.user.role === "PENDING") {
      router.push("/pending")
    }
  }, [authStatus, session, router])

  if (authStatus === "loading") return null
  if (authStatus === "unauthenticated") return null
  if (authStatus === "authenticated" && session?.user?.role === "PENDING") return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write something.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to post confession.");
      }

      setStatus("success");
      setContent("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/confessions"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Submit Confession</h1>
          <p className="text-zinc-400 text-sm mt-1">Share your thoughts anonymously.</p>
        </div>
      </div>

      {status === "success" ? (
        <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Submitted!</h2>
          <p className="text-zinc-400">Awaiting admin approval. Your identity remains completely hidden from everyone, including admins.</p>
          <button onClick={() => setStatus("idle")} className="text-violet-400 hover:text-violet-300 text-sm font-medium mt-4 block mx-auto underline outline-none">
            Submit another confession
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-400">
            <Ghost className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <p>Your identity will not be revealed. Posts are reviewed before publishing to ensure community safety.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={status === "submitting"}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow resize-none disabled:opacity-50 text-lg shadow-inner"
              placeholder="Write your confession here..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === "submitting" || !content.trim()}
              className="w-full flex justify-center items-center py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {status === "submitting" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</> : "Submit Anonymously"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
