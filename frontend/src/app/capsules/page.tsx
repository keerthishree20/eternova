"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiListCapsules, apiGetCapsule, apiDeleteCapsule } from "@/lib/api";
import { Capsule } from "@/lib/types";
import DetailsMenu from "@/components/DetailsMenu";

export default function CapsulesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Capsule | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiListCapsules().then(setCapsules).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleReveal = async (id: string) => {
    const full = await apiGetCapsule(id);
    setRevealed(full);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time capsule?")) return;
    await apiDeleteCapsule(id);
    setCapsules((prev) => prev.filter((c) => c.id !== id));
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💊 Time Capsules</h1>
        <Link href="/capsules/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">+ New Capsule</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : capsules.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⏳</p>
          <h2 className="text-xl font-semibold mb-2">No time capsules yet</h2>
          <p className="text-muted mb-6">Seal a message for your future self</p>
          <Link href="/capsules/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium">Create Your First Capsule</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capsules.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-5 border-2 ${c.is_locked
                ? "bg-card/50 border-card-border backdrop-blur-sm"
                : "bg-card border-accent/30 shadow-[0_0_20px_rgba(236,72,153,0.1)]"
              }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{c.is_locked ? "🔒" : "💝"}</span>
                <DetailsMenu
                  details={[
                    { label: "Created", value: c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—" },
                    { label: "Unlock Date", value: c.unlock_date },
                    { label: "Status", value: c.is_locked ? `Locked (${daysUntil(c.unlock_date)} days left)` : "Unlocked" },
                    ...(c.photo_count ? [{ label: "Photos", value: String(c.photo_count) }] : []),
                  ]}
                  onDelete={() => handleDelete(c.id)}
                />
              </div>
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="text-sm text-muted mt-1">
                {c.is_locked ? `Unlock: ${c.unlock_date}` : "Unlocked!"}
              </p>
              {c.is_locked ? (
                <div className="mt-4 text-center">
                  <div className="text-3xl font-bold text-primary">{daysUntil(c.unlock_date)}</div>
                  <div className="text-xs text-muted">days remaining</div>
                </div>
              ) : (
                <button onClick={() => handleReveal(c.id)}
                  className="mt-4 w-full py-2 rounded-xl gradient-warm text-white font-medium hover:opacity-90">
                  Open Capsule
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setRevealed(null)}>
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="bg-card rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <span className="text-4xl">💌</span>
                <h2 className="text-xl font-bold mt-3">{revealed.title}</h2>
                <p className="text-sm text-muted">Sealed on {revealed.created_at?.split("T")[0]}</p>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{revealed.message}</p>
              <button onClick={() => setRevealed(null)}
                className="mt-6 w-full py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
