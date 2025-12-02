import { createContext, useContext, useEffect, useState } from "react";

type User = {
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  }, []);

  const login = (email: string, password: string) => {

    // SIMULACIÓN DE LOGIN REAL
    if (
      (email === "admin@megagen.cl" && password === "123456") ||
      (email === "clinic@megagen.cl" && password === "megagen2025")
    ) {
      const newUser = { email, role: "admin" };
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
