import { createContext, useContext, useEffect, useState } from "react";
import { type User, type Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function syncUser(u: User) {
    try {
      const username =
        u.user_metadata?.username ??
        u.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "_") ??
        "user";
      const display_name =
        u.user_metadata?.display_name ??
        u.user_metadata?.full_name ??
        u.user_metadata?.name ??
        username;

      await fetch(apiUrl("/auth/sync-user"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          username,
          display_name,
        }),
      });
    } catch {
      // non-critical
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) syncUser(session.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) syncUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: displayName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const loginWithGoogle = async () => {
    const baseUrl = (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") || "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${baseUrl}/`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, signup, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
