"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

// Remember to create 'memes' bucket in Supabase Storage with same policies as 'notes' bucket
export default function UploadMemePage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");
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
      router.push("/dashboard/memes")
    }
  }, [authStatus, session, router])

  if (authStatus === "loading") return null
  if (authStatus === "unauthenticated") return null
  if (authStatus === "authenticated" && session?.user?.role !== "ADMIN") return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    setStatus("uploading");
    setError("");

    try {
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const filePath = `memes/${timestamp}_${filename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("memes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("memes")
        .getPublicUrl(uploadData.path);

      setStatus("saving");

      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageUrl: publicUrlData.publicUrl, 
          caption 
        }),
      });

      if (!res.ok) throw new Error("Failed to save meme to database");

      router.push("/dashboard/memes");
      router.refresh();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "An error occurred during upload.");
      } else {
        setError("An error occurred during upload.");
      }
      setStatus("idle");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <Link 
          href="/dashboard/memes"
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Upload Meme</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
        {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Select Image</label>
          <div className="relative border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-xl p-8 transition-colors flex flex-col items-center justify-center bg-zinc-900/50 group overflow-hidden">
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={status !== "idle"}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-violet-500 mb-3 transition-colors" />
            <span className="text-zinc-300 font-medium text-center px-4">{file ? file.name : "Click or drag image here"}</span>
            <span className="text-zinc-500 text-sm mt-1">Supports JPG, PNG, GIF</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Caption (Optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={status !== "idle"}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-violet-600 focus:ring-1 focus:ring-violet-600 outline-none disabled:opacity-50"
            placeholder="Add a funny caption..."
          />
        </div>

        <button
          type="submit"
          disabled={status !== "idle" || !file}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-50 shadow-sm transition-colors"
        >
          {status === "uploading" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading to Supabase...</> 
           : status === "saving" ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving Record...</> 
           : "Upload Meme"}
        </button>
      </form>
    </div>
  );
}
