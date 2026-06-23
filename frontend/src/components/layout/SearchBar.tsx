"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiSearch } from "@/lib/api";
import { SearchResults } from "@/lib/types";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(null); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await apiSearch(val.trim());
        setResults(r);
        setOpen(true);
      } catch { setResults(null); }
    }, 300);
  };

  const go = (path: string) => {
    setOpen(false); setQuery(""); setResults(null);
    router.push(path);
  };

  const totalResults = results ? results.books.length + results.entries.length + results.milestones.length : 0;

  return (
    <div className="relative" ref={ref}>
      <input type="text" value={query} onChange={(e) => handleChange(e.target.value)}
        placeholder="Search..."
        className="w-32 lg:w-48 px-3 py-1.5 rounded-lg bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20 transition-all" />

      {open && results && (
        <div className="absolute top-full mt-2 right-0 w-80 max-h-96 overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl z-50">
          {totalResults === 0 ? (
            <p className="p-4 text-sm text-muted text-center">No results found</p>
          ) : (
            <div className="py-2">
              {results.books.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Books</p>
                  {results.books.map((b) => (
                    <button key={b.id} onClick={() => go(`/books/${b.id}`)}
                      className="w-full text-left px-3 py-2 hover:bg-primary/5 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.cover_color }} />
                      <div>
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted">For {b.person_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.entries.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted mt-1">Entries</p>
                  {results.entries.slice(0, 5).map((e) => (
                    <button key={e.id} onClick={() => go(`/books/${e.book_id}`)}
                      className="w-full text-left px-3 py-2 hover:bg-primary/5">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted line-clamp-1">{e.book_title} — {e.content.slice(0, 60)}</p>
                    </button>
                  ))}
                </div>
              )}
              {results.milestones.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted mt-1">Milestones</p>
                  {results.milestones.map((m) => (
                    <button key={m.id} onClick={() => go("/milestones")}
                      className="w-full text-left px-3 py-2 hover:bg-primary/5">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted">{m.milestone_date}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
