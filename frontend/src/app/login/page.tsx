"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) { router.push("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-brand bg-clip-text text-transparent">Eternova</h1>
          <p className="text-muted mt-2">Welcome back to your memories</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-8 shadow-lg space-y-5">
          <h2 className="text-2xl font-semibold text-center">Sign In</h2>
          {error && <p className="text-danger text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-card px-3 text-muted">or</span></div>
          </div>
          <GoogleSignInButton onError={(msg) => setError(msg)} />
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
            <p className="text-muted">
              <Link href="/register" className="text-primary font-medium hover:underline">Create account</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
