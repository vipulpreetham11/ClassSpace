"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Pin, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NewNoticePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status !== "authenticated" || !session?.user) return

    if (session.user.role === "PENDING") {
      router.push("/pending")
      return
    }

    if (!isAdmin) {
      router.push("/dashboard/notices")
    }
  }, [status, session, isAdmin, router])

  if (status === "loading") return null
  if (status === "unauthenticated") return null
  if (status === "authenticated" && !isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError("Title and content are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        title,
        content,
        isPinned,
        isUrgent,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to post notice.");

      router.push("/dashboard/notices");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/notices"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Post New Notice</h1>
          <p className="text-zinc-400 text-sm mt-1">Broadcast an announcement to all students.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Notice Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow flex-grow"
            placeholder="e.g., Mid-Semester Exam Schedule Released"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Content</label>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow resize-none"
            placeholder="Write the full announcement here..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${isPinned ? 'bg-violet-600/10 border-violet-600/30' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'}`}>
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-violet-600 focus:ring-violet-600 focus:ring-offset-zinc-900 bg-zinc-800"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white flex items-center gap-1.5"><Pin className="w-4 h-4 text-violet-400" /> Pin Notice</span>
              <span className="text-xs text-zinc-400 mt-0.5">Keep at the top of the board</span>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'}`}>
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-red-500 focus:ring-red-500 focus:ring-offset-zinc-900 bg-zinc-800"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-red-500" /> Mark Urgent</span>
              <span className="text-xs text-zinc-400 mt-0.5">Highlights in red for priority</span>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Expiration Date (Optional)</label>
          <input
            type="date"
            style={{ colorScheme: "dark" }}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow"
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Publishing...</> : "Publish Notice"}
          </button>
        </div>
      </form>
    </div>
  );
}
