import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

const clearLocalAuthData = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const hasCleared = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        clearTimeout(timeout);

        if (!isMounted) return;

        if (error) {
          console.warn("Session restore failed, clearing stale data:", error.message);
          clearLocalAuthData();
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          setSession(null);
        } else {
          setSession(currentSession);
        }
      } catch (err: any) {
        console.warn("Auth init error, clearing stale session:", err?.message);
        if (isMounted && !hasCleared.current) {
          hasCleared.current = true;
          clearLocalAuthData();
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          setSession(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === "TOKEN_REFRESHED" && !newSession) {
        clearLocalAuthData();
        setSession(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setLoading(false);
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    clearLocalAuthData();
    await supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
