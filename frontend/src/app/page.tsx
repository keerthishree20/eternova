"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiDashboard, apiRandomMemory, apiSetTogetherSince } from "@/lib/api";
import { DashboardData, RandomMemory } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  first_date: "💕", trip: "✈️", birthday: "🎂", anniversary: "⭐", other: "📌",
};

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊", romantic: "💕", nostalgic: "🥹", grateful: "🙏", excited: "🎉", peaceful: "☮️", sad: "😢",
};

function daysBetween(d1: string, d2: Date) {
  return Math.floor((d2.getTime() - new Date(d1).getTime()) / 86400000);
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [randomMemory, setRandomMemory] = useState<RandomMemory | null>(null);
  const [showRandom, setShowRandom] = useState(false);
  const [togetherDate, setTogetherDate] = useState("");
  const [settingDate, setSettingDate] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => { if (user) apiDashboard().then(setData).catch(() => {}); }, [user]);

  const handleSurpriseMe = async () => {
    const mem = await apiRandomMemory();
    if (mem) { setRandomMemory(mem); setShowRandom(true); }
  };

  const handleSetDate = async () => {
    if (!togetherDate) return;
    setSettingDate(true);
    try {
      await apiSetTogetherSince(togetherDate);
      setData((prev) => prev ? { ...prev, together_since: togetherDate } : prev);
      setTogetherDate("");
    } catch {} finally { setSettingDate(false); }
  };

  if (authLoading || !user || !data) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const stats = [
    { label: "Memory Books", value: data.stats.books, href: "/books", icon: "📖" },
    { label: "Time Capsules", value: data.stats.capsules, href: "/capsules", icon: "💊" },
    { label: "Milestones", value: data.stats.milestones, href: "/milestones", icon: "🏆" },
    { label: "Letters", value: data.stats.letters, href: "/letters", icon: "💌" },
    { label: "Mini Sites", value: data.stats.sites, href: "/sites", icon: "🌐" },
  ];

  const togetherDays = data.together_since ? daysBetween(data.together_since, new Date()) : null;
  const togetherYears = togetherDays !== null ? Math.floor(togetherDays / 365) : 0;
  const togetherMonths = togetherDays !== null ? Math.floor((togetherDays % 365) / 30) : 0;
  const togetherRemDays = togetherDays !== null ? togetherDays % 30 : 0;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="gradient-brand rounded-2xl p-8 text-white text-center">
        <h1 className="text-3xl font-bold">Welcome back, {user.name} ✨</h1>
        <p className="mt-2 opacity-80">Your memories are safe and waiting for you</p>
        {data.total_entries > 0 && (
          <button onClick={handleSurpriseMe}
            className="mt-4 px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors">
            🎲 Surprise Me
          </button>
        )}
      </motion.div>

      {data.together_since && togetherDays !== null ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border-2 border-accent/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted mb-2">Together Since {data.together_since}</p>
          <div className="flex items-center justify-center gap-6">
            {togetherYears > 0 && (
              <div>
                <span className="text-3xl font-bold text-primary">{togetherYears}</span>
                <p className="text-xs text-muted">{togetherYears === 1 ? "year" : "years"}</p>
              </div>
            )}
            <div>
              <span className="text-3xl font-bold text-accent">{togetherMonths}</span>
              <p className="text-xs text-muted">{togetherMonths === 1 ? "month" : "months"}</p>
            </div>
            <div>
              <span className="text-3xl font-bold text-gold">{togetherRemDays}</span>
              <p className="text-xs text-muted">{togetherRemDays === 1 ? "day" : "days"}</p>
            </div>
          </div>
          <p className="text-lg font-semibold mt-3 text-primary">{togetherDays} days of love 💜</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-dashed border-accent/30 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
          <p className="text-sm text-muted flex-shrink-0">💑 When did your love story begin?</p>
          <input type="date" value={togetherDate} onChange={(e) => setTogetherDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-card-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleSetDate} disabled={settingDate || !togetherDate}
            className="px-4 py-1.5 rounded-lg gradient-brand text-white text-sm font-medium disabled:opacity-50">
            {settingDate ? "Saving..." : "Set Date"}
          </button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-card border border-card-border rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </motion.div>

      {(data.total_entries > 0 || data.total_photos > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="flex items-center justify-center gap-8 py-3 text-center">
          <div>
            <span className="text-xl font-bold text-primary">{data.total_entries}</span>
            <p className="text-xs text-muted">memories written</p>
          </div>
          <div className="w-px h-8 bg-card-border" />
          <div>
            <span className="text-xl font-bold text-accent">{data.total_photos}</span>
            <p className="text-xs text-muted">photos saved</p>
          </div>
        </motion.div>
      )}

      {(data.on_this_day?.entries.length > 0 || data.on_this_day?.milestones.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-semibold mb-3">📅 On This Day</h2>
          <div className="grid gap-3">
            {data.on_this_day.entries.map((e) => {
              const year = new Date(e.entry_date).getFullYear();
              const yearsAgo = new Date().getFullYear() - year;
              return (
                <div key={e.id} className="bg-card border-2 border-gold/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                      {yearsAgo} {yearsAgo === 1 ? "year" : "years"} ago
                    </span>
                    <span className="text-xs text-muted">{e.book_title} — {e.person_name}</span>
                  </div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{e.content}</p>
                </div>
              );
            })}
            {data.on_this_day.milestones.map((m) => {
              const year = new Date(m.milestone_date).getFullYear();
              const yearsAgo = new Date().getFullYear() - year;
              return (
                <div key={m.id} className="bg-card border-2 border-gold/30 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_EMOJI[m.category] || "📌"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.title}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                        {yearsAgo} {yearsAgo === 1 ? "year" : "years"} ago
                      </span>
                    </div>
                    {m.description && <p className="text-sm text-muted mt-1">{m.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {data.newly_unlocked_capsules.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-semibold mb-3">🔓 Newly Unlocked Capsules</h2>
          <div className="grid gap-3">
            {data.newly_unlocked_capsules.map((c) => (
              <Link key={c.id} href="/capsules"
                className="bg-card border-2 border-accent/30 rounded-xl p-4 flex items-center gap-3 hover:border-accent/60 transition-colors">
                <span className="text-2xl">💝</span>
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted">Ready to open!</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {data.recent_books.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">📖 Recent Books</h2>
            <Link href="/books" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.recent_books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}
                className="bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-3" style={{ background: book.cover_color }} />
                <div className="p-4">
                  <h3 className="font-semibold truncate">{book.title}</h3>
                  <p className="text-sm text-muted">For {book.person_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {data.upcoming_milestones.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-xl font-semibold mb-3">⏳ Upcoming Milestones</h2>
          <div className="grid gap-3">
            {data.upcoming_milestones.map((m) => (
              <div key={m.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_EMOJI[m.category] || "📌"}</span>
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-muted">{m.milestone_date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    m.days_until <= 7 ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                  }`}>
                    {m.days_until === 0 ? "Today!" : `${m.days_until} days`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {data.stats.books === 0 && data.stats.capsules === 0 && data.stats.milestones === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center py-12">
          <p className="text-4xl mb-4">💜</p>
          <h2 className="text-xl font-semibold mb-2">Your journey begins here</h2>
          <p className="text-muted mb-6">Start by creating a memory book, setting a milestone, or writing a letter</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/books/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">Create a Book</Link>
            <Link href="/capsules/new" className="px-5 py-2.5 rounded-xl border border-primary text-primary font-medium hover:bg-primary/5">Seal a Capsule</Link>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showRandom && randomMemory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowRandom(false)}>
            <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0 }}
              className="bg-card rounded-2xl p-8 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <span className="text-4xl">🎲</span>
                <h2 className="text-xl font-bold mt-2">Random Memory</h2>
                <p className="text-sm text-muted">{randomMemory.book_title} — For {randomMemory.person_name}</p>
              </div>
              <h3 className="font-semibold text-lg">{randomMemory.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                {randomMemory.entry_date && <span className="text-xs text-muted">{randomMemory.entry_date}</span>}
                {randomMemory.mood && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">{MOOD_EMOJI[randomMemory.mood] || "💭"} {randomMemory.mood}</span>}
              </div>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">{randomMemory.content}</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowRandom(false); router.push(`/books/${randomMemory.book_id}`); }}
                  className="flex-1 py-2 rounded-xl bg-primary/10 text-primary font-medium text-sm">Open Book</button>
                <button onClick={async () => { const m = await apiRandomMemory(); if (m) setRandomMemory(m); }}
                  className="flex-1 py-2 rounded-xl gradient-brand text-white font-medium text-sm">Another One</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
