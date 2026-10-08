import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import type { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, displayName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authApi.getCurrentUser()
      .then((currentUser) => active && setUser(currentUser))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function signIn(username: string, password: string) {
    setUser(await authApi.login(username, password));
  }

  async function signUp(username: string, displayName: string, password: string) {
    setUser(await authApi.register(username, displayName, password));
  }

  async function signOut() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}