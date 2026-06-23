"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { apiCoupleStatus, apiCreateInvite, apiAcceptInvite, apiUnlinkPartner } from "@/lib/api";
import { CoupleStatus } from "@/lib/types";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<CoupleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [acceptCode, setAcceptCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user) apiCoupleStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleGenerateCode = async () => {
    setWorking(true); setMessage("");
    try {
      const invite = await apiCreateInvite();
      setGeneratedCode(invite.invite_code);
      setMessage("Invite code generated! Share it with your partner.");
      const s = await apiCoupleStatus();
      setStatus(s);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to generate code");
    } finally { setWorking(false); }
  };

  const handleEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true); setMessage("");
    try {
      const invite = await apiCreateInvite(inviteEmail);
      setGeneratedCode(invite.invite_code);
      setMessage(`Invite sent to ${inviteEmail}! Code: ${invite.invite_code}`);
      setInviteEmail("");
      const s = await apiCoupleStatus();
      setStatus(s);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to send invite");
    } finally { setWorking(false); }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorking(true); setMessage("");
    try {
      await apiAcceptInvite(acceptCode);
      setMessage("Linked successfully! You can now see each other's memories.");
      setAcceptCode("");
      const s = await apiCoupleStatus();
      setStatus(s);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to accept invite");
    } finally { setWorking(false); }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink from your partner?")) return;
    setWorking(true); setMessage("");
    try {
      await apiUnlinkPartner();
      setMessage("Unlinked successfully.");
      setGeneratedCode("");
      const s = await apiCoupleStatus();
      setStatus(s);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to unlink");
    } finally { setWorking(false); }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">👤 Account</h2>
            <p className="text-sm text-muted">{user.name} — {user.email}</p>
          </div>

          <hr className="border-card-border" />

          <div>
            <h2 className="text-lg font-semibold mb-3">💑 Couple Mode</h2>

            {loading ? (
              <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : status?.linked && status.partner ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
                  <p className="font-medium text-green-700 dark:text-green-400">Linked with {status.partner.name}</p>
                  <p className="text-sm text-green-600 dark:text-green-500">{status.partner.email}</p>
                  <p className="text-xs text-muted mt-2">You can see each other&apos;s books, capsules, and milestones</p>
                </div>
                <button onClick={handleUnlink} disabled={working}
                  className="text-sm px-4 py-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-50">
                  Unlink Partner
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-medium mb-2">Generate Invite Code</h3>
                  <button onClick={handleGenerateCode} disabled={working}
                    className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50">
                    {working ? "Working..." : "Generate Code"}
                  </button>
                  {(generatedCode || status?.pending_invite?.invite_code) && (
                    <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted mb-1">Share this code with your partner</p>
                      <p className="text-2xl font-bold tracking-widest text-primary">
                        {generatedCode || status?.pending_invite?.invite_code}
                      </p>
                      <button onClick={() => navigator.clipboard.writeText(generatedCode || status?.pending_invite?.invite_code || "")}
                        className="text-xs text-primary mt-2 hover:underline">Copy to clipboard</button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted">or</span></div>
                </div>

                <form onSubmit={handleEmailInvite}>
                  <h3 className="text-sm font-medium mb-2">Send Email Invite</h3>
                  <div className="flex gap-2">
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="partner@email.com" required
                      className="flex-1 px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <button type="submit" disabled={working}
                      className="px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50">
                      Send
                    </button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted">or</span></div>
                </div>

                <form onSubmit={handleAccept}>
                  <h3 className="text-sm font-medium mb-2">Accept an Invite Code</h3>
                  <div className="flex gap-2">
                    <input type="text" value={acceptCode} onChange={(e) => setAcceptCode(e.target.value)}
                      placeholder="Enter code" required
                      className="flex-1 px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm tracking-widest text-center" />
                    <button type="submit" disabled={working}
                      className="px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50">
                      Link
                    </button>
                  </div>
                </form>
              </div>
            )}

            {message && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 text-sm p-3 rounded-lg bg-primary/5 border border-primary/20 text-primary">
                {message}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
