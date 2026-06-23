"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiListMilestones, apiCreateMilestone, apiUpdateMilestone, apiDeleteMilestone } from "@/lib/api";
import { Milestone } from "@/lib/types";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import DetailsMenu from "@/components/DetailsMenu";

const CATEGORIES = [
  { value: "first_date", label: "First Date", emoji: "💕" },
  { value: "trip", label: "Trip", emoji: "✈️" },
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "anniversary", label: "Anniversary", emoji: "⭐" },
  { value: "other", label: "Other", emoji: "📌" },
];

const EMOJI_MAP: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.emoji]));

export default function MilestonesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("other");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiListMilestones().then(setMilestones).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setDate(""); setCategory("other"); setSpotifyUrl("");
    setEditId(null); setShowForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const updated = await apiUpdateMilestone(editId, {
          title, description, milestone_date: date, category, spotify_url: spotifyUrl || null,
        });
        setMilestones((prev) => prev.map((m) => m.id === editId ? updated : m)
          .sort((a, b) => a.milestone_date.localeCompare(b.milestone_date)));
      } else {
        const m = await apiCreateMilestone({ title, description, milestone_date: date, category, spotify_url: spotifyUrl || undefined });
        setMilestones((prev) => [...prev, m].sort((a, b) => a.milestone_date.localeCompare(b.milestone_date)));
      }
      resetForm();
    } catch {} finally { setSaving(false); }
  };

  const startEdit = (m: Milestone) => {
    setEditId(m.id);
    setTitle(m.title);
    setDescription(m.description || "");
    setDate(m.milestone_date);
    setCategory(m.category);
    setSpotifyUrl(m.spotify_url || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    await apiDeleteMilestone(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏆 Milestones</h1>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">
          {showForm ? "Cancel" : "+ Add Milestone"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={handleAdd} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted">{editId ? "Edit Milestone" : "New Milestone"}</h2>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none" />
            <div className="flex gap-4">
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <input type="url" value={spotifyUrl} onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="🎵 Spotify song URL (optional)"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving..." : editId ? "Save Changes" : "Add Milestone"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📅</p>
          <h2 className="text-xl font-semibold mb-2">No milestones yet</h2>
          <p className="text-muted">Track your important dates and memories</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-card-border" />
          {milestones.map((m, i) => {
            const isPast = m.days_until < 0;
            const isToday = m.days_until === 0;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex items-start mb-8 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                <div className={`w-full sm:w-1/2 ${i % 2 === 0 ? "sm:pr-8 pl-12 sm:pl-0" : "sm:pl-8 pl-12 sm:pl-0"}`}>
                  <div className={`bg-card rounded-xl p-5 border-2 ${
                    isToday ? "border-accent shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                    : isPast ? "border-card-border opacity-75"
                    : "border-primary/30 border-dashed"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{EMOJI_MAP[m.category] || "📌"}</span>
                      <DetailsMenu
                        details={[
                          { label: "Created", value: formatDate(m.created_at) },
                          { label: "Date", value: formatDate(m.milestone_date) },
                          { label: "Category", value: (CATEGORIES.find(c => c.value === m.category)?.label || m.category) },
                          { label: "Status", value: isToday ? "Today!" : isPast ? `${Math.abs(m.days_until)} days ago` : `${m.days_until} days away` },
                          ...(m.spotify_url ? [{ label: "Song", value: "Linked" }] : []),
                        ]}
                        onEdit={() => startEdit(m)}
                        onDelete={() => handleDelete(m.id)}
                      />
                    </div>
                    <h3 className="font-semibold text-lg">{m.title}</h3>
                    <p className="text-sm text-muted">{m.milestone_date}</p>
                    {m.description && <p className="text-sm mt-2">{m.description}</p>}
                    {m.spotify_url && <div className="mt-3"><SpotifyEmbed url={m.spotify_url} /></div>}
                    <div className="mt-3">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        isToday ? "bg-accent/20 text-accent"
                        : isPast ? "bg-muted/20 text-muted"
                        : m.days_until <= 7 ? "bg-gold/20 text-gold"
                        : "bg-primary/10 text-primary"
                      }`}>
                        {isToday ? "Today!" : isPast ? `${Math.abs(m.days_until)} days ago` : `${m.days_until} days away`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 w-4 h-4 rounded-full border-4 border-primary bg-background mt-6" />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
