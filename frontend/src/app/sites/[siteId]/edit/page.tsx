"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiGetSite, apiUpdateSite, apiListBooks, apiGetBook, apiListMilestones } from "@/lib/api";
import { Book, MiniSite, BookDetail, Milestone } from "@/lib/types";
import { SITE_THEMES } from "@/lib/siteThemes";

export default function EditSitePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;
  const [site, setSite] = useState<MiniSite | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [themeColor, setThemeColor] = useState("#7c3aed");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [theme, setTheme] = useState("romantic");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [bookDetails, setBookDetails] = useState<Record<string, BookDetail>>({});
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<string[]>([]);
  const [showMilestoneSelect, setShowMilestoneSelect] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [guestPin, setGuestPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => {
    if (!user || !siteId) return;
    apiListMilestones().then(setMilestones).catch(() => {});
    Promise.all([apiGetSite(siteId), apiListBooks()])
      .then(([s, b]) => {
        setSite(s);
        setBooks(b);
        setTitle(s.title);
        setSubtitle(s.subtitle || "");
        setPartnerName(s.partner_name || "");
        setThemeColor(s.theme_color);
        setAccentColor(s.accent_color);
        setTheme(s.theme || "romantic");
        const bids = s.book_ids?.length ? s.book_ids : (s.book_id ? [s.book_id] : []);
        setSelectedBookIds(bids);
        setSelectedEntryIds(s.entry_ids || []);
        setSelectedMilestoneIds(s.milestone_ids || []);
        for (const bid of bids) {
          apiGetBook(bid).then((d) => setBookDetails((prev) => ({ ...prev, [bid]: d }))).catch(() => {});
        }
        setShowMilestones(!!s.show_milestones);
        setShowPhotos(!!s.show_photos);
        setGuestPin(s.guest_pin || "");
      })
      .catch(() => router.push("/sites"))
      .finally(() => setLoading(false));
  }, [user, siteId, router]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiUpdateSite(siteId, {
        title, subtitle, partner_name: partnerName,
        theme_color: themeColor, accent_color: accentColor,
        theme,
        book_ids: selectedBookIds,
        entry_ids: selectedEntryIds,
        milestone_ids: selectedMilestoneIds,
        show_milestones: showMilestones, show_photos: showPhotos,
        guest_pin: guestPin || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update site");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!site) return null;

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🌐 Edit Site</h1>
          <button onClick={() => router.push("/sites")} className="text-sm text-muted hover:text-foreground">Back to Sites</button>
        </div>
        <form onSubmit={handleSave} className="bg-card border border-card-border rounded-2xl p-6 space-y-5">
          {error && <p className="text-danger text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          {saved && <p className="text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">Saved successfully!</p>}

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
            <label className="block text-sm font-medium mb-1">Site Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partner Name</label>
            <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)}
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
              <p className="text-sm text-muted">No books yet</p>
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
                            ? "All entries shown (select to filter)"
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
            <label className="block text-sm font-medium mb-1">Guest PIN</label>
            <input type="text" value={guestPin} onChange={(e) => setGuestPin(e.target.value)} placeholder="e.g. 1234"
              maxLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted mt-1">Set a PIN so your special person can leave messages</p>
          </div>
          <div className="h-24 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}, ${accentColor})` }}>
            <span className="text-white font-bold text-lg">{title || "Preview"}</span>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
