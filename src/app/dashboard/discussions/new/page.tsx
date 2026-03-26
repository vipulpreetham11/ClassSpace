"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["General", "Academic", "Events", "Help", "Other"];

export default function NewDiscussionPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
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
    if (!title.trim() || !content.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to post discussion.");
      }

      router.push("/dashboard/discussions");
      router.refresh();
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/discussions"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Discussion</h1>
          <p className="text-zinc-400 text-sm mt-1">Start a new thread to talk with fellow students.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-zinc-300">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={status === "submitting"}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow"
              placeholder="What do you want to talk about?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={status === "submitting"}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow appearance-none"
            >
              {CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Content</label>
          <textarea
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow resize-none"
            placeholder="Add details and contexts here..."
          />
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={status === "submitting" || !title.trim() || !content.trim()}
            className="flex justify-center items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[200px]"
          >
            {status === "submitting" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Publishing...</> : "Publish Discussion"}
          </button>
        </div>
      </form>
    </div>
  );
}
