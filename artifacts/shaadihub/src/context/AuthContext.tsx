import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "shaadihub_token";
const USER_KEY = "shaadihub_user";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "vendor" | "admin";
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  vendorId: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedVendorId = localStorage.getItem("shaadihub_vendor_id");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedVendorId) setVendorId(Number(savedVendorId));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Login failed");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    if (data.vendorId) localStorage.setItem("shaadihub_vendor_id", String(data.vendorId));
    setToken(data.token);
    setUser(data.user);
    setVendorId(data.vendorId ?? null);
  }, []);

  const register = useCallback(async (formData: Record<string, unknown>) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message ?? "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    if (data.vendorId) localStorage.setItem("shaadihub_vendor_id", String(data.vendorId));
    setToken(data.token);
    setUser(data.user);
    setVendorId(data.vendorId ?? null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("shaadihub_vendor_id");
    setToken(null);
    setUser(null);
    setVendorId(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, vendorId, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
