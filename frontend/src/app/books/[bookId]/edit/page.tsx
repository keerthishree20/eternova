"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiGetBook, apiCreateEntry, apiUpdateEntry, apiDeleteEntry, apiUploadPhotos, apiDeletePhoto, photoUrl } from "@/lib/api";
import { BookDetail, BookEntry } from "@/lib/types";
import DetailsMenu from "@/components/DetailsMenu";

const MOODS = [
  { value: "happy", emoji: "😊" },
  { value: "romantic", emoji: "💕" },
  { value: "nostalgic", emoji: "🥹" },
  { value: "grateful", emoji: "🙏" },
  { value: "excited", emoji: "🎉" },
  { value: "peaceful", emoji: "☮️" },
  { value: "sad", emoji: "😢" },
];

export default function EditBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  const [book, setBook] = useState<BookDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  const loadBook = () => {
    if (user && bookId) apiGetBook(bookId).then(setBook).catch(() => router.push("/books"));
  };

  useEffect(loadBook, [user, bookId, router]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await apiCreateEntry(bookId, { title, content, entry_date: entryDate || undefined, mood: mood || undefined });
      setTitle(""); setContent(""); setEntryDate(""); setMood("");
      loadBook();
    } catch {} finally { setSaving(false); }
  };

  const startEdit = (entry: BookEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditDate(entry.entry_date || "");
    setEditMood(entry.mood || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle(""); setEditContent(""); setEditDate(""); setEditMood("");
  };

  const handleSaveEdit = async (entryId: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setEditSaving(true);
    try {
      await apiUpdateEntry(bookId, entryId, {
        title: editTitle,
        content: editContent,
        entry_date: editDate || null,
        mood: editMood || null,
      });
      cancelEdit();
      loadBook();
    } catch {} finally { setEditSaving(false); }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Delete this entry?")) return;
    await apiDeleteEntry(bookId, entryId);
    loadBook();
  };

  const handleUpload = async (entryId: string, files: FileList) => {
    await apiUploadPhotos(bookId, entryId, Array.from(files));
    loadBook();
  };

  const handleDeletePhoto = async (photoId: string) => {
    await apiDeletePhoto(photoId);
    loadBook();
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  if (!book) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit: {book.title}</h1>
          <p className="text-muted">For {book.person_name}</p>
        </div>
        <button onClick={() => router.push(`/books/${bookId}`)} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">View Book</button>
      </div>

      <motion.form onSubmit={handleAddEntry} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border-2 border-dashed border-primary/30 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">+ Add New Entry</h2>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" required
          className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your memory..." required
          className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none" />
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted mr-1">Mood:</span>
            {MOODS.map((m) => (
              <button key={m.value} type="button" onClick={() => setMood(mood === m.value ? "" : m.value)}
                className={`w-8 h-8 rounded-full text-lg flex items-center justify-center transition-all ${mood === m.value ? "ring-2 ring-primary scale-110 bg-primary/10" : "hover:bg-muted/10"}`}
                title={m.value}>{m.emoji}</button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
          {saving ? "Adding..." : "Add Entry"}
        </button>
      </motion.form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Entries ({book.entries.length})</h2>
        {book.entries.map((entry: BookEntry, i: number) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-card-border rounded-xl p-5">

            <AnimatePresence mode="wait">
              {editingId === entry.id ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-primary">Editing Entry</h3>
                    <button onClick={cancelEdit} className="text-xs text-muted hover:text-foreground">Cancel</button>
                  </div>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary h-28 resize-none" />
                  <div className="flex items-center gap-3 flex-wrap">
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted mr-1">Mood:</span>
                      {MOODS.map((m) => (
                        <button key={m.value} type="button" onClick={() => setEditMood(editMood === m.value ? "" : m.value)}
                          className={`w-7 h-7 rounded-full text-sm flex items-center justify-center transition-all ${editMood === m.value ? "ring-2 ring-primary scale-110 bg-primary/10" : "hover:bg-muted/10"}`}
                          title={m.value}>{m.emoji}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleSaveEdit(entry.id)} disabled={editSaving}
                    className="px-5 py-2 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50">
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{entry.title}</h3>
                      <div className="flex items-center gap-2">
                        {entry.entry_date && <span className="text-xs text-muted">{entry.entry_date}</span>}
                        {entry.mood && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">{MOODS.find(m => m.value === entry.mood)?.emoji || "💭"} {entry.mood}</span>}
                      </div>
                    </div>
                    <DetailsMenu
                      details={[
                        { label: "Created", value: formatDate(entry.created_at) },
                        { label: "Last Updated", value: formatDate(entry.updated_at) },
                        ...(entry.entry_date ? [{ label: "Entry Date", value: entry.entry_date }] : []),
                        { label: "Photos", value: String(entry.photos.length) },
                      ]}
                      onEdit={() => startEdit(entry)}
                      onDelete={() => handleDeleteEntry(entry.id)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted line-clamp-3">{entry.content}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {entry.photos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {entry.photos.map((p) => (
                  <div key={p.id} className="relative group">
                    <img src={photoUrl(p.file_path)} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    <button onClick={() => handleDeletePhoto(p.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="inline-block mt-3 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
              + Add Photos
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(entry.id, e.target.files)} />
            </label>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
