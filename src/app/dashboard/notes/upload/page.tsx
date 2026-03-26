"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UploadCloud, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", 
  "Data Structures", "OOP", "DBMS", 
  "OS", "Networks", "Other"
];

export default function UploadNotePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "saving" | "done">("idle");
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
      router.push("/dashboard/notes")
    }
  }, [status, session, isAdmin, router])

  if (status === "loading") return null
  if (status === "unauthenticated") return null
  if (status === "authenticated" && !isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !description) {
      setError("Please fill all fields and select a file.");
      return;
    }

    setUploadState("uploading");
    setError("");

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${subject}/${Date.now()}_${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload file to storage bucket.");
      }

      setUploadState("saving");

      const { data: publicUrlData } = supabase.storage
        .from('notes')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          description,
          fileUrl,
          fileType: fileExt || "unknown",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to persist the API record safely.");
      }

      setUploadState("done");
      setTimeout(() => {
        router.push("/dashboard/notes");
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setUploadState("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/notes"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Upload Note</h1>
          <p className="text-zinc-400 text-sm mt-1">Add a new document to the class library.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Note Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploadState !== "idle"}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow disabled:opacity-50"
            placeholder="e.g., Chapter 1: Introduction to Trees"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Subject Category</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={uploadState !== "idle"}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow appearance-none disabled:opacity-50"
          >
            {SUBJECTS.map((sub: string) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploadState !== "idle"}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-shadow resize-none disabled:opacity-50"
            placeholder="Briefly describe what this note covers..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">File Attachment</label>
          <div className="relative">
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
              disabled={uploadState !== "idle"}
            />
            <label 
              htmlFor="file-upload" 
              className={`flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-zinc-700 rounded-xl px-6 py-12 transition-colors ${
                uploadState !== "idle" ? 'opacity-50 cursor-not-allowed' : 'hover:border-violet-500 hover:bg-zinc-800 cursor-pointer'
              }`}
            >
              <UploadCloud className={`w-10 h-10 ${file ? 'text-violet-500' : 'text-zinc-500'}`} />
              <div className="text-center">
                <span className={`block text-sm font-medium ${file ? 'text-white' : 'text-zinc-400'}`}>
                  {file ? file.name : "Click to select a file"}
                </span>
                <span className="block text-xs text-zinc-500 mt-1">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, PPT, DOCX (Max 50MB)"}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={uploadState !== "idle"}
            className={`w-full flex justify-center items-center py-3.5 font-semibold rounded-xl transition-colors shadow-sm ${
              uploadState === "done" 
                ? "bg-green-600 text-white" 
                : uploadState === "uploading"
                ? "bg-yellow-600 text-white cursor-not-allowed"
                : uploadState === "saving"
                ? "bg-blue-600 text-white cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {uploadState === "uploading" && <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading to Supabase...</>}
            {uploadState === "saving" && <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving record...</>}
            {uploadState === "done" && <><CheckCircle2 className="w-5 h-5 mr-2" /> Publish Complete</>}
            {uploadState === "idle" && "Publish Note to Library"}
          </button>
        </div>
      </form>
    </div>
  );
}
