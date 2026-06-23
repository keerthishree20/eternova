"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiListTemplates } from "@/lib/api";
import { LetterTemplate } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  romantic: "💕", gratitude: "🙏", longing: "💭", celebration: "🎉", healing: "💚",
};

const CATEGORY_COLOR: Record<string, string> = {
  romantic: "bg-accent/10 text-accent", gratitude: "bg-gold/10 text-gold",
  longing: "bg-primary/10 text-primary", celebration: "bg-gold/10 text-gold",
  healing: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
};

export default function LettersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiListTemplates().then(setTemplates).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">💌 Letter Templates</h1>
        <p className="text-muted mt-1">Choose a template, fill in the blanks, and create something beautiful</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/letters/${t.id}`}
                className="block bg-card border border-card-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary/30 h-full">
                <div className="text-3xl mb-3">{CATEGORY_EMOJI[t.category] || "📝"}</div>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="text-sm text-muted mt-2">{t.description}</p>
                <span className={`inline-block mt-3 text-xs px-3 py-1 rounded-full ${CATEGORY_COLOR[t.category] || "bg-primary/10 text-primary"}`}>
                  {t.category}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
