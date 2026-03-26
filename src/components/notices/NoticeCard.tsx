"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, AlertCircle, Edit, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

interface NoticeCardProps {
  notice: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    isUrgent: boolean;
    createdAt: Date | string;
    expiresAt: Date | string | null;
    user: { name: string | null } | null;
  };
  isAdmin: boolean;
}

export function NoticeCard({ notice, isAdmin }: NoticeCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notices/${notice.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete notice");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(message);
      setIsDeleting(false);
    }
  };

  const getBorderColor = () => {
    if (notice.isUrgent) return "border-l-4 border-l-red-500 border-t-zinc-700 border-r-zinc-700 border-b-zinc-700";
    if (notice.isPinned) return "border-l-4 border-l-violet-600 border-t-zinc-700 border-r-zinc-700 border-b-zinc-700";
    return "border border-zinc-700";
  };

  return (
    <div className={`bg-zinc-800 rounded-xl p-5 md:p-6 transition-colors hover:bg-zinc-800/80 ${getBorderColor()} relative flex flex-col h-full group`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {notice.isUrgent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle className="w-3.5 h-3.5" /> Urgent
            </span>
          )}
          {notice.isPinned && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-600/10 text-violet-400 border border-violet-600/20">
              <Pin className="w-3.5 h-3.5" /> Pinned
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Link
              href={`/dashboard/notices/${notice.id}/edit`}
              className="p-2 bg-zinc-700/50 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
              title="Edit Notice"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
              title="Delete Notice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{notice.title}</h3>
      <p className="text-zinc-400 text-sm whitespace-pre-wrap flex-grow">{notice.content}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-4 pt-4 border-t border-zinc-700/50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-400">{notice.user?.name || "Admin"}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(notice.createdAt)}</span>
        </div>
        {notice.expiresAt && (
          <span className="text-zinc-500">
            Valid till: {formatDate(notice.expiresAt)}
          </span>
        )}
      </div>
    </div>
  );
}
