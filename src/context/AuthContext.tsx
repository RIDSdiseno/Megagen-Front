import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "superadmin" | "supervisor" | "vendedor" | "bodeguero";

type User = {
  email: string;
  roles: Role[];
  token: string;
  impersonator?: { email: string; roles: Role[]; token: string };
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  impersonate: (payload: { email: string; roles: Role[]; token?: string }) => void;
  exitImpersonation: () => void;
  setSession: (payload: { email: string; roles: Role[]; token: string; impersonator?: User["impersonator"] }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (!data) return;
    try {
      const parsed = JSON.parse(data) as any;
      const roles: Role[] = Array.isArray(parsed.roles)
        ? parsed.roles
        : parsed.role
        ? [parsed.role]
        : [];
      const impersonatorStored = localStorage.getItem("impersonator");
      const impersonator = impersonatorStored ? (JSON.parse(impersonatorStored) as User) : parsed.impersonator;
      setUser({ email: parsed.email, roles, token: parsed.token, impersonator: impersonator || undefined });
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({}));
      throw new Error(error.message || "Credenciales incorrectas");
    }

    const data = (await resp.json()) as { token: string; user: { email: string; role?: string; roles?: string[] } };
    const roles: Role[] = Array.isArray(data.user.roles)
      ? (data.user.roles as Role[])
      : data.user.role
      ? [data.user.role as Role]
      : [];
    const newUser: User = { email: data.user.email, roles, token: data.token };
    setSession(newUser);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("impersonator");
    setUser(null);
    window.location.href = "/login";
  };

  const setSession = (payload: { email: string; roles: Role[]; token: string; impersonator?: User["impersonator"] }) => {
    const nextUser: User = {
      email: payload.email,
      roles: payload.roles,
      token: payload.token,
      impersonator: payload.impersonator,
    };
    localStorage.setItem("user", JSON.stringify(nextUser));
    if (!payload.impersonator) localStorage.removeItem("impersonator");
    setUser(nextUser);
  };

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    const required = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((r) => r === "superadmin" || required.includes(r));
  };

  const impersonate = (payload: { email: string; roles: Role[]; token?: string }) => {
    if (!user) return;
    localStorage.setItem("impersonator", JSON.stringify(user));
    const tokenToUse = payload.token || user.token || "impersonated-token";
    const newUser: User = {
      email: payload.email,
      roles: payload.roles,
      token: tokenToUse,
      impersonator: { email: user.email, roles: user.roles, token: user.token },
    };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const exitImpersonation = () => {
    const stored = localStorage.getItem("impersonator");
    const fallback = user?.impersonator;
    const target = stored
      ? (JSON.parse(stored) as User)
      : fallback
      ? { email: fallback.email, roles: fallback.roles, token: fallback.token }
      : null;
    if (!target) return;
    localStorage.setItem("user", JSON.stringify(target));
    localStorage.removeItem("impersonator");
    setUser(target);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole,
        impersonate,
        exitImpersonation,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
