"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export function BirthdayFormClient() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !date) {
      setError("Student name and Date are required.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/birthdays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, date, message }),
      });

      if (!res.ok) throw new Error("Failed to create birthday");

      router.push("/dashboard/birthdays");
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
          href="/dashboard/birthdays"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Add Birthday</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Student Name</label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 focus:ring-1 focus:ring-violet-600 outline-none disabled:opacity-50 shadow-sm"
            placeholder="Enter student name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Date (Month & Day)</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 focus:ring-1 focus:ring-violet-600 outline-none disabled:opacity-50 shadow-sm"
          />
          <p className="text-xs text-zinc-500 mt-2">The year component is implicitly ignored visually across interactions.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Message (Optional)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "submitting"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 outline-none disabled:opacity-50 shadow-sm"
            placeholder="e.g. Wishing you a great year!"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting" || !studentName.trim() || !date}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-50 shadow-sm transition-colors"
        >
          {status === "submitting" ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Save Birthday Event
        </button>
      </form>
    </div>
  );
}
