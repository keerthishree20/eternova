"use client";
import { useState, useRef, useEffect } from "react";

interface DetailItem {
  label: string;
  value: string;
}

interface DetailsMenuProps {
  details: DetailItem[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DetailsMenu({ details, onEdit, onDelete }: DetailsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted hover:text-foreground">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-56 bg-card border border-card-border rounded-xl shadow-lg py-2 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 border-b border-card-border mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Details</p>
          </div>
          {details.map((d) => (
            <div key={d.label} className="px-3 py-1.5">
              <p className="text-[10px] text-muted uppercase tracking-wider">{d.label}</p>
              <p className="text-xs mt-0.5">{d.value}</p>
            </div>
          ))}
          {(onEdit || onDelete) && <div className="border-t border-card-border mt-1 pt-1" />}
          {onEdit && (
            <button onClick={() => { setOpen(false); onEdit(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 text-primary flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => { setOpen(false); onDelete(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-danger/5 text-danger flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
