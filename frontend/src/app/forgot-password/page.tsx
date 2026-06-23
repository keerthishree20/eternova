"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiForgotPassword, apiResetPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiForgotPassword(email);
      setSuccess("Reset code sent to your email! Check your inbox.");
      setStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiResetPassword(email, code, newPassword);
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-brand bg-clip-text text-transparent">Eternova</h1>
          <p className="text-muted mt-2">Reset your password</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-lg space-y-5">
          {step === "email" ? (
            <>
              <h2 className="text-2xl font-semibold text-center">Forgot Password</h2>
              <p className="text-sm text-muted text-center">Enter your email and we&apos;ll send you a 6-digit reset code</p>
              {error && <p className="text-danger text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
              {success && <p className="text-green-700 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">{success}</p>}
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-center">Enter Reset Code</h2>
              <p className="text-sm text-muted text-center">Check <span className="text-primary">{email}</span> for the 6-digit code</p>
              {error && <p className="text-danger text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
              {success && <p className="text-green-700 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">{success}</p>}
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reset Code</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="123456" maxLength={6}
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-[0.5em]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6} placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 disabled:opacity-50">
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setError(""); setSuccess(""); }}
                  className="w-full text-sm text-muted hover:text-primary">
                  Didn&apos;t get the code? Try again
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted">
            <Link href="/login" className="text-primary font-medium hover:underline">Back to Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
