"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { apiGetPublicSite, apiGetGuestbook, apiSubmitGuestbook, photoUrl } from "@/lib/api";
import { PublicSite, GuestbookEntry } from "@/lib/types";
import { SITE_THEMES } from "@/lib/siteThemes";
import SpotifyEmbed from "@/components/SpotifyEmbed";

export default function PublicSitePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [site, setSite] = useState<PublicSite | null>(null);
  const [error, setError] = useState(false);
  const [guestEntries, setGuestEntries] = useState<GuestbookEntry[]>([]);
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestMsg, setGuestMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGetPublicSite(slug).then(setSite).catch(() => setError(true));
  }, [slug]);

  const verifyPin = async () => {
    try {
      const entries = await apiGetGuestbook(slug, pin);
      setGuestEntries(entries);
      setPinVerified(true);
    } catch {
      alert("Invalid PIN");
    }
  };

  const submitGuestbook = async () => {
    if (!guestName.trim() || !guestMsg.trim()) return;
    setSubmitting(true);
    try {
      const entry = await apiSubmitGuestbook(slug, { author_name: guestName, message: guestMsg, pin });
      setGuestEntries((prev) => [...prev, entry]);
      setGuestName("");
      setGuestMsg("");
    } catch {
      alert("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-semibold">Site not found</h1>
        <p className="text-muted mt-2">This site doesn&apos;t exist or isn&apos;t published yet</p>
      </div>
    </div>
  );

  if (!site) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  const theme = SITE_THEMES[site.theme] || SITE_THEMES.romantic;
  const headerBg = theme.useGradientHeader
    ? `linear-gradient(135deg, ${site.theme_color}, ${site.accent_color})`
    : theme.bodyBg;

  return (
    <div className="min-h-screen" style={{ background: theme.bodyBg, color: theme.textColor, fontFamily: theme.fontFamily }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`py-20 text-center ${theme.id === "neon" ? "neon-glow" : ""}`}
        style={{ background: headerBg, color: theme.headerTextColor }}>
        <motion.h1 initial={{ y: 30 }} animate={{ y: 0 }}
          className="text-4xl md:text-5xl font-bold"
          style={!theme.useGradientHeader ? { color: theme.textColor } : undefined}>
          {site.title}
        </motion.h1>
        {site.subtitle && <p className="text-xl mt-3 opacity-80">{site.subtitle}</p>}
        {site.partner_name && <p className="mt-4 text-lg opacity-70">With {site.partner_name} 💜</p>}
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {(site.books?.length > 0 ? site.books : (site.book ? [site.book] : [])).map((book) => (
          book.entries.length > 0 && (
            <section key={book.id}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">{book.title}</h2>
                <p className="text-sm mt-1" style={{ color: theme.mutedColor }}>For {book.person_name}</p>
              </div>
              <div className="space-y-8">
                {book.entries.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl p-8 ${theme.id === "neon" ? "neon-glow" : ""}`}
                    style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                    <h3 className="text-xl font-semibold">{entry.title}</h3>
                    {entry.entry_date && <p className="text-sm mt-1" style={{ color: theme.mutedColor }}>{entry.entry_date}</p>}
                    {entry.mood && <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${theme.cardBorder}`, color: theme.mutedColor }}>{entry.mood}</span>}
                    <p className="mt-4 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                    {entry.photos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        {entry.photos.map((p) => (
                          <img key={p.id} src={photoUrl(p.file_path)} alt="" className="rounded-xl w-full h-48 object-cover" />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              {book.spotify_url && (
                <div className="mt-6">
                  <SpotifyEmbed url={book.spotify_url} />
                </div>
              )}
            </section>
          )
        ))}

        {site.milestones && site.milestones.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-center mb-8">Our Timeline</h2>
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5" style={{ background: site.theme_color }} />
              {site.milestones.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex mb-8 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`w-1/2 ${i % 2 === 0 ? "pr-8 text-right" : "pl-8"}`}>
                    <div className={`rounded-xl p-4 ${theme.id === "neon" ? "neon-glow" : ""}`}
                      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                      <h3 className="font-semibold">{m.title}</h3>
                      <p className="text-sm" style={{ color: theme.mutedColor }}>{m.milestone_date}</p>
                      {m.description && <p className="text-sm mt-2">{m.description}</p>}
                      {m.spotify_url && <div className="mt-2"><SpotifyEmbed url={m.spotify_url} /></div>}
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full mt-4" style={{ background: site.accent_color }} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {site.has_guestbook && (
          <section>
            <h2 className="text-2xl font-bold text-center mb-8">Leave a Message 💌</h2>
            {!pinVerified ? (
              <div className="max-w-sm mx-auto text-center space-y-4">
                <p style={{ color: theme.mutedColor }}>Enter the PIN to access the guestbook</p>
                <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN"
                  className="w-full px-4 py-2.5 rounded-xl text-center text-lg tracking-widest"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, color: theme.textColor }} />
                <button onClick={verifyPin}
                  className="w-full py-2.5 rounded-xl text-white font-medium"
                  style={{ background: `linear-gradient(135deg, ${site.theme_color}, ${site.accent_color})` }}>
                  Unlock Guestbook
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {guestEntries.length > 0 && (
                  <div className="space-y-4">
                    {guestEntries.map((entry) => (
                      <div key={entry.id} className="rounded-xl p-4"
                        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                        <p className="font-medium">{entry.author_name}</p>
                        <p className="mt-1 whitespace-pre-wrap">{entry.message}</p>
                        <p className="text-xs mt-2" style={{ color: theme.mutedColor }}>
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-xl p-6 space-y-3"
                  style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                  <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name" className="w-full px-4 py-2.5 rounded-xl"
                    style={{ background: theme.bodyBg, border: `1px solid ${theme.cardBorder}`, color: theme.textColor }} />
                  <textarea value={guestMsg} onChange={(e) => setGuestMsg(e.target.value)}
                    placeholder="Write your message..." rows={3} className="w-full px-4 py-2.5 rounded-xl resize-none"
                    style={{ background: theme.bodyBg, border: `1px solid ${theme.cardBorder}`, color: theme.textColor }} />
                  <button onClick={submitGuestbook} disabled={submitting}
                    className="w-full py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${site.theme_color}, ${site.accent_color})` }}>
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="text-center py-8 text-sm" style={{ color: theme.mutedColor }}>
        Made with love on Eternova 💜
      </div>
    </div>
  );
}
