
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NewPollPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
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
      return
    }

    if (session.user.role !== "ADMIN") {
      router.push("/dashboard/polls")
    }
  }, [authStatus, session, router])

  if (authStatus === "loading") return null
  if (authStatus === "unauthenticated") return null
  if (authStatus === "authenticated" && session?.user?.role !== "ADMIN") return null

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleChangeOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== "");
    if (!question.trim() || validOptions.length < 2) {
      setError("Question and at least 2 valid options are required.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options: validOptions, expiresAt: expiresAt || null }),
      });

      if (!res.ok) throw new Error("Failed to create poll");
      router.push("/dashboard/polls");
      router.refresh();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError("An error occurred")
      }
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/polls"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Poll</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Question</label>
          <input
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 focus:ring-1 focus:ring-violet-600 outline-none disabled:opacity-50"
            placeholder="Ask anything..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Options (Min 2, Max 6)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                required
                value={opt}
                onChange={(e) => handleChangeOption(i, e.target.value)}
                disabled={status === "submitting"}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-600 outline-none disabled:opacity-50"
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveOption(i)} 
                  disabled={status === "submitting"}
                  className="p-2.5 text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button 
              type="button" 
              onClick={handleAddOption} 
              disabled={status === "submitting"}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 mt-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Expiry Date (Optional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting" || !question.trim() || options.length < 2}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-50 shadow-sm transition-colors"
        >
          {status === "submitting" ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Create Poll
        </button>
      </form>
    </div>
  );
}
