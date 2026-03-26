"use client";

import { FileText, Download, Bookmark, Clock, FileArchive, FileImage, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatDate";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    description: string;
    subject: string;
    fileUrl: string;
    fileType: string;
    downloads: number;
    createdAt: Date | string;
    user: { name: string | null } | null;
  };
  isBookmarked: boolean;
  isAdmin: boolean;
}

export function NoteCard({ note, isBookmarked, isAdmin }: NoteCardProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [downloads, setDownloads] = useState(note.downloads);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("pdf")) return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
    if (t.includes("ppt") || t.includes("presentation")) return { icon: FileArchive, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (t.includes("doc") || t.includes("word")) return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (t.includes("png") || t.includes("jpg") || t.includes("jpeg")) return { icon: FileImage, color: "text-green-500", bg: "bg-green-500/10" };
    return { icon: FileText, color: "text-zinc-400", bg: "bg-zinc-800" };
  };

  const { icon: TypeIcon, color: typeColor, bg: typeBg } = getFileIcon(note.fileType);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await fetch(`/api/notes/${note.id}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "download" })
      });
      setDownloads(d => d + 1);
      window.open(note.fileUrl, "_blank");
    } catch (e) {
      console.error("Failed to increment download count", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookmark = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const original = bookmarked;
    setBookmarked(!bookmarked);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bookmark" })
      });
      if (!res.ok) throw new Error("Failed to bookmark");
      router.refresh();
    } catch {
      setBookmarked(original);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-600 transition-colors h-full group relative">
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute -top-3 -right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Delete Note"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      <div>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-lg ${typeBg} ${typeColor}`}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <button 
            onClick={handleBookmark} 
            disabled={isLiking}
            className="p-2 hover:bg-zinc-700 rounded-full transition-colors"
          >
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-yellow-500 text-yellow-500" : "text-zinc-400"}`} />
          </button>
        </div>
        
        <h3 className="text-lg font-semibold text-white line-clamp-1" title={note.title}>{note.title}</h3>
        <p className="text-zinc-400 text-sm mt-2 line-clamp-2" title={note.description}>{note.description}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(note.createdAt)}</span>
          <span className="truncate max-w-[120px]">By {note.user?.name || "Unknown"}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
          <span className="text-xs text-zinc-400 font-medium">{downloads} {downloads === 1 ? 'dl' : 'dls'}</span>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors border border-violet-500/20 shadow-sm"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
