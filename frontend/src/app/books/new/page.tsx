"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiCreateBook } from "@/lib/api";

const COLORS = ["#7c3aed", "#ec4899", "#d97706", "#059669", "#2563eb", "#dc2626"];

export default function NewBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [personName, setPersonName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) { router.push("/login"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const book = await apiCreateBook({ title, person_name: personName, description, cover_color: coverColor, spotify_url: spotifyUrl || undefined });
      router.push(`/books/${book.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">📖 Create New Memory Book</h1>
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
          {error && <p className="text-danger text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Book Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Story"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">For Who?</label>
            <input type="text" required value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Their name"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this book about?"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cover Color</label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setCoverColor(c)}
                  className={`w-10 h-10 rounded-full border-4 transition-transform ${coverColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">🎵 Spotify Song (optional)</label>
            <input type="url" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Creating..." : "Create Book"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
