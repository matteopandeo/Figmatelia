import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

/**
 * OAuth consent / callback page.
 * Supabase redirects here after a magic-link click with tokens in the URL hash:
 *   /oauth/consent#access_token=...&refresh_token=...&type=magiclink
 *
 * We capture the hash synchronously at module/component init time,
 * then call setSession() to establish the auth session.
 */

// Capture hash immediately when this module loads (before any async cleanup)
const capturedHash = window.location.hash.substring(1);

export function OAuthConsent() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleCallback() {
      try {
        // Use the hash captured at module load time (immune to race conditions)
        const hash = capturedHash || window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        console.log(
          "OAuthConsent: processing callback, hash length:",
          hash.length,
          "has access_token:",
          params.has("access_token")
        );

        // 1. Check for error in hash (e.g. expired link)
        const hashError = params.get("error");
        if (hashError) {
          const errorDescription =
            params.get("error_description")?.replace(/\+/g, " ") ||
            "Authentication failed.";
          console.error("OAuth callback error:", hashError, errorDescription);
          setStatus("error");
          setErrorMsg(errorDescription);
          return;
        }

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        // 2. If we have tokens in the hash, set the session explicitly
        if (accessToken && refreshToken) {
          console.log("OAuthConsent: found tokens, calling setSession…");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("OAuthConsent setSession error:", error);
            setStatus("error");
            setErrorMsg(error.message);
            return;
          }

          if (data.session) {
            console.log("OAuthConsent: session set successfully, going home");
            window.history.replaceState(null, "", "/");
            navigate("/", { replace: true });
            return;
          }
        }

        // 3. No tokens in hash — maybe Supabase client already processed them.
        //    Check getSession() as fallback.
        console.log("OAuthConsent: no tokens in hash, checking existing session…");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          console.log("OAuthConsent: existing session found, going home");
          window.history.replaceState(null, "", "/");
          navigate("/", { replace: true });
          return;
        }

        // 4. Still nothing — listen for onAuthStateChange as last resort
        console.log("OAuthConsent: waiting for auth state change…");
        let resolved = false;

        const timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          subscription.unsubscribe();
          console.error("OAuthConsent: timed out waiting for session");
          setStatus("error");
          setErrorMsg(
            "Could not complete sign in. The link may have expired — please request a new one."
          );
        }, 10000);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (resolved) return;
          if (
            (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
            session
          ) {
            resolved = true;
            clearTimeout(timeout);
            subscription.unsubscribe();
            console.log("OAuthConsent: auth state changed, going home");
            window.history.replaceState(null, "", "/");
            navigate("/", { replace: true });
          }
        });
      } catch (err) {
        console.error("OAuthConsent unexpected error:", err);
        setStatus("error");
        setErrorMsg("Something went wrong. Please try again.");
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#F1F1EE" }}
    >
      {status === "processing" && (
        <div className="flex flex-col items-center gap-[16px]">
          <div
            className="animate-spin rounded-full"
            style={{
              width: "32px",
              height: "32px",
              border: "3px solid rgba(0,0,0,0.08)",
              borderTopColor: "#757575",
            }}
          />
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              color: "#757575",
            }}
          >
            Signing you in…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-[16px] px-[32px] max-w-[360px]">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "rgba(217, 64, 64, 0.1)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D94040"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h2
            className="text-center"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "24px",
              lineHeight: "1.2",
              fontWeight: 400,
              color: "#1B1D1C",
            }}
          >
            Sign in failed
          </h2>

          {errorMsg && (
            <p
              className="text-center"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#757575",
              }}
            >
              {errorMsg}
            </p>
          )}

          <button
            className="mt-[8px] flex items-center justify-center py-[12px] px-[32px] rounded-[12px] cursor-pointer border-none relative"
            style={{
              background: "rgba(232, 232, 232, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={() => navigate("/", { replace: true })}
          >
            <div
              className="absolute pointer-events-none rounded-[13px]"
              style={{
                inset: "-1px",
                border: "1px solid #efefef",
                boxShadow:
                  "0px 1px 3px 0px rgba(27,29,28,0.08), 0px 1px 2px 0px rgba(27,29,28,0.06)",
              }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                fontWeight: 500,
                color: "#757575",
              }}
            >
              Go to Stampbook
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
