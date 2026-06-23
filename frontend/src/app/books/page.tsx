"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiListBooks, apiDeleteBook } from "@/lib/api";
import { Book } from "@/lib/types";
import DetailsMenu from "@/components/DetailsMenu";

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

  useEffect(() => {
    if (user) apiListBooks().then(setBooks).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book and all its entries?")) return;
    await apiDeleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return d; }
  };

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📖 Memory Books</h1>
        <Link href="/books/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">
          + New Book
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : books.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📚</p>
          <h2 className="text-xl font-semibold mb-2">No memory books yet</h2>
          <p className="text-muted mb-6">Create your first book to start preserving memories</p>
          <Link href="/books/new" className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium">Create Your First Book</Link>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map((book, i) => (
            <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-4" style={{ background: book.cover_color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <Link href={`/books/${book.id}`} className="flex-1">
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors">{book.title}</h3>
                    <p className="text-sm text-muted mt-1">For {book.person_name}</p>
                  </Link>
                  <DetailsMenu
                    details={[
                      { label: "Created", value: formatDate(book.created_at) },
                      { label: "Last Updated", value: formatDate(book.updated_at) },
                      { label: "Entries", value: String(book.entry_count || 0) },
                      { label: "Shared", value: book.is_shared ? "Yes" : "No" },
                      ...(book.spotify_url ? [{ label: "Song", value: "Linked" }] : []),
                    ]}
                    onEdit={() => router.push(`/books/${book.id}/edit`)}
                    onDelete={() => handleDelete(book.id)}
                  />
                </div>
                {book.description && <p className="text-sm text-muted mt-2 line-clamp-2">{book.description}</p>}
                <div className="flex items-center mt-4">
                  <span className="text-xs text-muted">{book.entry_count || 0} entries</span>
                  {book.is_shared ? <span className="text-xs ml-auto px-2 py-0.5 rounded-full bg-accent/10 text-accent">Shared</span> : null}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
