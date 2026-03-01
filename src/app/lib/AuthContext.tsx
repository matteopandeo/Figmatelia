import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import { projectId } from "/utils/supabase/info";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1`;

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Re-check session (useful after navigation) */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  refreshSession: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Migrate local stamps to server ──────────────────────────

async function migrateLocalStampsToServer(token: string) {
  try {
    const raw = localStorage.getItem("figmatelia-stamps");
    if (!raw) return;
    const localStamps = JSON.parse(raw);
    if (!Array.isArray(localStamps) || localStamps.length === 0) return;

    // Fetch existing server stamps to avoid duplicates
    let serverStamps: any[] = [];
    try {
      const res = await fetch(
        `${SERVER_BASE}/make-server-758b50b2/stamps`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.stamps)) {
        serverStamps = data.stamps;
      }
    } catch {
      /* continue — worst case we re-upload duplicates */
    }

    const serverIds = new Set(serverStamps.map((s: any) => s.id));
    const newStamps = localStamps.filter((s: any) => !serverIds.has(s.id));

    if (newStamps.length === 0) {
      // Everything already on server — just clean up
      localStorage.removeItem("figmatelia-stamps");
      return;
    }

    const merged = [
      ...newStamps.map((s: any) => ({ ...s, localOnly: false })),
      ...serverStamps,
    ];

    const res = await fetch(`${SERVER_BASE}/make-server-758b50b2/stamps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stamps: merged }),
    });

    if (res.ok) {
      localStorage.removeItem("figmatelia-stamps");
      toast.success("Your stamps have been saved to your account");
    } else {
      const data = await res.json();
      console.error("Error migrating stamps during auth init:", data.error);
    }
  } catch (err) {
    console.error("Error migrating stamps during auth init:", err);
  }
}

// ─── Clean URL hash left by Supabase magic link redirect ────

function cleanHashIfNeeded() {
  // Don't clean hash on /oauth/consent — that page needs the tokens
  if (window.location.pathname === "/oauth/consent") return;

  if (
    window.location.hash &&
    (window.location.hash.includes("access_token") ||
      window.location.hash.includes("refresh_token") ||
      window.location.hash.includes("error"))
  ) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

// ─── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initDone = useRef(false);

  const applySession = useCallback(
    (sessionUser: AuthUser | null, token: string | null) => {
      setUser(sessionUser);
      setAccessToken(token);
    },
    []
  );

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      applySession(session?.user ?? null, session?.access_token ?? null);
    } catch {
      /* keep current state */
    }
  }, [applySession]);

  // ── 1. Detect session on mount (magic link tokens + stored session) ──
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function initAuth() {
      try {
        // getSession() detects tokens in URL hash AND restores from storage
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth session detection error:", error);
        }

        if (session?.user && session.access_token) {
          applySession(session.user, session.access_token);

          // Migrate any local stamps
          await migrateLocalStampsToServer(session.access_token);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        // Clean hash tokens from URL
        cleanHashIfNeeded();
        setIsLoading(false);
      }
    }

    initAuth();
  }, [applySession]);

  // ── 2. Listen for future auth changes ──
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user && session.access_token) {
        applySession(session.user, session.access_token);
        // Migrate stamps on sign-in (idempotent — skips if nothing local)
        await migrateLocalStampsToServer(session.access_token);
        cleanHashIfNeeded();
      }

      if (event === "SIGNED_OUT") {
        applySession(null, null);
      }

      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        applySession(session.user ?? null, session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated, isLoading, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}