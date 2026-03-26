"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function CommentBoxClient({ discussionId }: { discussionId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("submitting");
    try {
      const res = await fetch(`/api/discussions/${discussionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      
      setContent("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      alert("Failed to submit comment");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 sm:p-6 mt-6 shadow-sm">
      <h3 className="text-white font-medium mb-4">Add a comment</h3>
      <textarea
        required
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={status === "submitting"}
        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow resize-none text-sm"
        placeholder="Share your thoughts..."
      />
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={status === "submitting" || !content.trim()}
          className="flex justify-center items-center px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Posting...</> : "Post Comment"}
        </button>
      </div>
    </form>
  );
}

export function DeleteDiscussionClient({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this discussion to everyone?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/discussions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/dashboard/discussions");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      setIsDeleting(false);
      alert("Failed to delete discussion");
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
      title="Delete Discussion"
    >
      <Trash2 className="w-5 h-5" /> 
      <span className="hidden sm:inline">Delete Node</span>
    </button>
  );
}
