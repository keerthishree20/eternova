"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiLogin, apiRegister, apiMe } from "@/lib/api";

interface AuthState {
  user: { id: string; email: string; name: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("eternova_token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiMe()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem("eternova_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem("eternova_token", res.token);
    setUser({ id: res.user_id, email: res.email, name: res.name });
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await apiRegister(email, name, password);
    localStorage.setItem("eternova_token", res.token);
    setUser({ id: res.user_id, email: res.email, name: res.name });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("eternova_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
