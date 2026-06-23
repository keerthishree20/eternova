"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { apiGetSharedBook, photoUrl } from "@/lib/api";
import { BookDetail } from "@/lib/types";

export default function SharedBookPage() {
  const params = useParams();
  const token = params.token as string;
  const [book, setBook] = useState<BookDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGetSharedBook(token).then(setBook).catch(() => setError(true));
  }, [token]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-semibold">Book not found</h1>
        <p className="text-muted mt-2">This link may have expired or the book is no longer shared</p>
      </div>
    </div>
  );

  if (!book) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: book.cover_color }}>
          <span className="text-2xl">📖</span>
        </div>
        <h1 className="text-3xl font-bold">{book.title}</h1>
        <p className="text-lg text-muted mt-1">For {book.person_name}</p>
        {book.description && <p className="text-muted mt-3">{book.description}</p>}
      </motion.div>

      {book.entries.map((entry, i) => (
        <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="bg-card border border-card-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{entry.title}</h2>
            {entry.entry_date && <span className="text-sm text-muted">{entry.entry_date}</span>}
          </div>
          <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
          {entry.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              {entry.photos.map((p) => (
                <img key={p.id} src={photoUrl(p.file_path)} alt={p.caption || "Memory"} className="rounded-xl w-full h-48 object-cover" />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      <p className="text-center text-sm text-muted py-8">Shared with love via Eternova 💜</p>
    </div>
  );
}
