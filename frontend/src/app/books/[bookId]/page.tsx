"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiGetBook, apiToggleShare, photoUrl } from "@/lib/api";
import { BookDetail } from "@/lib/types";
import { exportBookToPDF } from "@/lib/pdfExport";
import SpotifyEmbed from "@/components/SpotifyEmbed";

export default function BookReaderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  const [book, setBook] = useState<BookDetail | null>(null);
  const [page, setPage] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => {
    if (user && bookId) apiGetBook(bookId).then(setBook).catch(() => router.push("/books"));
  }, [user, bookId, router]);

  const handleShare = async () => {
    if (!book) return;
    const updated = await apiToggleShare(book.id);
    setBook((prev) => prev ? { ...prev, share_token: updated.share_token, is_shared: updated.is_shared } : prev);
    setShowShare(true);
  };

  const copyLink = () => {
    if (book?.share_token) {
      navigator.clipboard.writeText(`${window.location.origin}/shared/${book.share_token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!book) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const entries = book.entries;
  const entry = entries[page];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-muted">For {book.person_name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare} className="px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium">
            {book.is_shared ? "Unshare" : "Share"}
          </button>
          <button onClick={async () => { setExporting(true); await exportBookToPDF(book); setExporting(false); }} disabled={exporting}
            className="px-4 py-2 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 text-sm font-medium disabled:opacity-50">
            {exporting ? "Exporting..." : "PDF"}
          </button>
          <Link href={`/books/${book.id}/edit`} className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium">Edit</Link>
        </div>
      </div>

      {showShare && book.is_shared && book.share_token && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-accent/30 rounded-xl p-4 flex items-center gap-3">
          <input readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${book.share_token}`}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border text-sm" />
          <button onClick={copyLink} className="px-4 py-2 rounded-lg gradient-brand text-white text-sm">
            {copied ? "Copied!" : "Copy"}
          </button>
        </motion.div>
      )}

      {book.spotify_url && (
        <div className="bg-card border border-card-border rounded-xl p-4">
          <SpotifyEmbed url={book.spotify_url} />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
          <p className="text-4xl mb-4">✍️</p>
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-muted mt-1">Start writing your memories</p>
          <Link href={`/books/${book.id}/edit`} className="inline-block mt-4 px-5 py-2 rounded-xl gradient-brand text-white">Add First Entry</Link>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="h-2" style={{ background: book.cover_color }} />
          <div className="p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                {entry && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{entry.title}</h2>
                      {entry.entry_date && <span className="text-sm text-muted">{entry.entry_date}</span>}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                    {entry.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        {entry.photos.map((p) => (
                          <img key={p.id} src={photoUrl(p.file_path)} alt={p.caption || "Memory"}
                            className="rounded-xl w-full h-48 object-cover" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between px-8 py-4 border-t border-card-border">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary disabled:opacity-30">← Prev</button>
            <span className="text-sm text-muted">{page + 1} / {entries.length}</span>
            <button onClick={() => setPage(Math.min(entries.length - 1, page + 1))} disabled={page === entries.length - 1}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
