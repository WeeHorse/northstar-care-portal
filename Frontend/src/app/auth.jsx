import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

const STORAGE_KEY = "northstar_auth";
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession());
  const [isRestoring, setIsRestoring] = useState(Boolean(readStoredSession().token));

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      if (!session.token) {
        if (active) setIsRestoring(false);
        return;
      }
      try {
        const profile = await api.me(session.token);
        if (!active) return;
        const next = { token: session.token, user: profile.user };
        setSession(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        if (!active) return;
        const next = { token: null, user: null };
        setSession(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } finally {
        if (active) setIsRestoring(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      token: session.token,
      user: session.user,
      isAuthenticated: Boolean(session.token),
      isRestoring,
      setSession(nextSession) {
        setSession(nextSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      },
      clearSession() {
        const next = { token: null, user: null };
        setSession(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      async logout() {
        if (session.token) {
          try {
            await api.logout(session.token);
          } catch {
            // Local session clear still protects the client even if logout call fails.
          }
        }
        const next = { token: null, user: null };
        setSession(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    }),
    [session, isRestoring]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
