"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiCreateSite, apiListBooks, apiGetBook, apiListMilestones } from "@/lib/api";
import { Book, BookDetail, Milestone } from "@/lib/types";
import { SITE_THEMES } from "@/lib/siteThemes";

export default function NewSitePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [themeColor, setThemeColor] = useState("#7c3aed");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [theme, setTheme] = useState("romantic");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([]);
  const [bookDetails, setBookDetails] = useState<Record<string, BookDetail>>({});
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestoneSelect, setShowMilestoneSelect] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [guestPin, setGuestPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => {
    if (user) {
      apiListBooks().then(setBooks).catch(() => {});
      apiListMilestones().then(setMilestones).catch(() => {});
    }
  }, [user]);

  const toggleBook = async (bookId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookIds((prev) => [...prev, bookId]);
      if (!bookDetails[bookId]) {
        try {
          const detail = await apiGetBook(bookId);
          setBookDetails((prev) => ({ ...prev, [bookId]: detail }));
        } catch {}
      }
    } else {
      setSelectedBookIds((prev) => prev.filter((id) => id !== bookId));
      setSelectedEntryIds((prev) => {
        const entryIdsOfBook = bookDetails[bookId]?.entries.map((e) => e.id) || [];
        return prev.filter((id) => !entryIdsOfBook.includes(id));
      });
    }
  };

  const toggleEntry = (entryId: string, checked: boolean) => {
    if (checked) setSelectedEntryIds((prev) => [...prev, entryId]);
    else setSelectedEntryIds((prev) => prev.filter((id) => id !== entryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiCreateSite({
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        title, subtitle, partner_name: partnerName,
        theme_color: themeColor, accent_color: accentColor,
        theme,
        book_ids: selectedBookIds,
        entry_ids: selectedEntryIds,
        milestone_ids: selectedMilestoneIds,
        show_milestones: showMilestones, show_photos: showPhotos,
        guest_pin: guestPin || null,
      });
      router.push("/sites");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">🌐 Create Mini Site</h1>
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
          {error && <p className="text-danger text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-2">Theme Style</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(SITE_THEMES).map((t) => (
                <button key={t.id} type="button" onClick={() => setTheme(t.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    theme === t.id ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900" : "border border-card-border"
                  }`}>
                  <div className="h-6 rounded-lg mb-2" style={{ background: t.preview }} />
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Site URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">/site/</span>
              <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="our-love-story"
                className="flex-1 px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Site Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Love Story"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="A journey of love"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Name</label>
            <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Their name"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Theme Color</label>
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Accent Color</label>
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Link Memory Books & Entries</label>
            {books.length === 0 ? (
              <p className="text-sm text-muted">No books yet — create one first</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto border border-card-border rounded-xl p-3">
                {books.map((b) => (
                  <div key={b.id}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10">
                      <input type="checkbox" className="rounded"
                        checked={selectedBookIds.includes(b.id)}
                        onChange={(e) => toggleBook(b.id, e.target.checked)} />
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.cover_color }} />
                      <div className="flex-1 cursor-pointer" onClick={() => {
                        if (selectedBookIds.includes(b.id)) setExpandedBook(expandedBook === b.id ? null : b.id);
                      }}>
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted">For {b.person_name}</p>
                      </div>
                      {selectedBookIds.includes(b.id) && bookDetails[b.id] && (
                        <button type="button" onClick={() => setExpandedBook(expandedBook === b.id ? null : b.id)}
                          className="text-xs text-primary hover:underline">
                          {expandedBook === b.id ? "Hide" : `${bookDetails[b.id].entries.length} entries`}
                        </button>
                      )}
                    </div>
                    {expandedBook === b.id && bookDetails[b.id] && (
                      <div className="ml-10 mb-2 space-y-1 border-l-2 border-primary/20 pl-3">
                        <p className="text-[10px] text-muted uppercase tracking-wider py-1">
                          {selectedEntryIds.filter(id => bookDetails[b.id].entries.some(e => e.id === id)).length === 0
                            ? "All entries shown (select specific ones to filter)"
                            : `${selectedEntryIds.filter(id => bookDetails[b.id].entries.some(e => e.id === id)).length} selected`}
                        </p>
                        {bookDetails[b.id].entries.map((entry) => (
                          <label key={entry.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/10 cursor-pointer text-sm">
                            <input type="checkbox" className="rounded"
                              checked={selectedEntryIds.includes(entry.id)}
                              onChange={(e) => toggleEntry(entry.id, e.target.checked)} />
                            <span className="truncate">{entry.title}</span>
                            {entry.entry_date && <span className="text-xs text-muted flex-shrink-0">{entry.entry_date}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted mt-1">
              {selectedBookIds.length} book{selectedBookIds.length !== 1 ? "s" : ""}
              {selectedEntryIds.length > 0 ? `, ${selectedEntryIds.length} specific entries` : ""}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showMilestones} onChange={(e) => setShowMilestones(e.target.checked)} className="rounded" />
                Show milestones
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showPhotos} onChange={(e) => setShowPhotos(e.target.checked)} className="rounded" />
                Show photos
              </label>
            </div>
            {showMilestones && milestones.length > 0 && (
              <div>
                <button type="button" onClick={() => setShowMilestoneSelect(!showMilestoneSelect)}
                  className="text-xs text-primary hover:underline">
                  {showMilestoneSelect ? "Hide milestone picker" : `Select specific milestones (${milestones.length} available)`}
                </button>
                {showMilestoneSelect && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border border-card-border rounded-xl p-3">
                    <p className="text-[10px] text-muted uppercase tracking-wider py-1">
                      {selectedMilestoneIds.length === 0 ? "All milestones shown (select to filter)" : `${selectedMilestoneIds.length} selected`}
                    </p>
                    {milestones.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/10 cursor-pointer text-sm">
                        <input type="checkbox" className="rounded"
                          checked={selectedMilestoneIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMilestoneIds((prev) => [...prev, m.id]);
                            else setSelectedMilestoneIds((prev) => prev.filter((id) => id !== m.id));
                          }} />
                        <span className="truncate">{m.title}</span>
                        <span className="text-xs text-muted flex-shrink-0">{m.milestone_date}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Guest PIN (optional)</label>
            <input type="text" value={guestPin} onChange={(e) => setGuestPin(e.target.value)} placeholder="e.g. 1234"
              maxLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted mt-1">Set a PIN so your special person can leave messages on the site</p>
          </div>
          <div className="h-24 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}, ${accentColor})` }}>
            <span className="text-white font-bold text-lg">{title || "Preview"}</span>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Creating..." : "Create Site"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
