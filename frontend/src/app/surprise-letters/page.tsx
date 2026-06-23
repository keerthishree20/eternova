"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiCreateScheduledLetter, apiListScheduledLetters, apiDeleteScheduledLetter } from "@/lib/api";
import { ScheduledLetter } from "@/lib/types";
import DetailsMenu from "@/components/DetailsMenu";

export default function SurpriseLettersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [letters, setLetters] = useState<ScheduledLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiListScheduledLetters().then(setLetters).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const letter = await apiCreateScheduledLetter({
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject, body,
        scheduled_date: scheduledDate,
      });
      setLetters((prev) => [...prev, letter]);
      setRecipientEmail(""); setRecipientName(""); setSubject(""); setBody(""); setScheduledDate("");
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to schedule letter");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Cancel this scheduled letter?")) return;
    await apiDeleteScheduledLetter(id);
    setLetters((prev) => prev.filter((l) => l.id !== id));
  };

  if (authLoading || !user) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💌 Surprise Letters</h1>
          <p className="text-muted text-sm mt-1">Schedule love letters to be emailed on a special date</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90">
          {showForm ? "Cancel" : "+ New Letter"}
        </button>
      </div>

      {showForm && (
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
          {error && <p className="text-danger text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Email</label>
              <input type="email" required value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="their@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Their Name (optional)</label>
              <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Sweetheart"
                className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="A surprise for you 💜"
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Letter Content</label>
            <textarea required value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Write your heart out..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Send On Date</label>
            <input type="date" required value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Scheduling..." : "Schedule Letter"}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">💌</p>
          <h2 className="text-xl font-semibold mb-2">No surprise letters yet</h2>
          <p className="text-muted">Schedule a letter to surprise someone special</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {letters.map((letter, i) => (
            <motion.div key={letter.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{letter.subject}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      letter.is_sent
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gold/20 text-gold"
                    }`}>
                      {letter.is_sent ? "Sent" : "Scheduled"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">
                    To: {letter.recipient_name ? `${letter.recipient_name} (${letter.recipient_email})` : letter.recipient_email}
                  </p>
                  <p className="text-sm text-muted">
                    {letter.is_sent ? `Sent on ${letter.sent_at?.split("T")[0]}` : `Sending on ${letter.scheduled_date}`}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2">{letter.body}</p>
                </div>
                <DetailsMenu
                  details={[
                    { label: "Created", value: new Date(letter.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
                    { label: "Scheduled For", value: letter.scheduled_date },
                    { label: "Recipient", value: letter.recipient_name || letter.recipient_email },
                    { label: "Status", value: letter.is_sent ? `Sent ${letter.sent_at?.split("T")[0] || ""}` : "Pending" },
                  ]}
                  onDelete={!letter.is_sent ? () => handleDelete(letter.id) : undefined}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
