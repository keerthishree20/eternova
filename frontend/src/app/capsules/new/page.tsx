"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiCreateCapsule } from "@/lib/api";

export default function NewCapsulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) { router.push("/login"); return null; }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiCreateCapsule({ title, message, unlock_date: unlockDate });
      router.push("/capsules");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create capsule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">⏳ Seal a Time Capsule</h1>
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
          {error && <p className="text-danger text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Capsule Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A message to my future self"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your Message</label>
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Write something meaningful... This will be locked until the unlock date."
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary h-40 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unlock Date</label>
            <input type="date" required min={tomorrow} value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted mt-1">You won&apos;t be able to read this until this date</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl gradient-warm text-white font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Sealing..." : "Seal Capsule 🔒"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
