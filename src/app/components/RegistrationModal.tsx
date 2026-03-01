import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import { StampDisplay } from "./StampDisplay";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (accessToken: string) => void;
  stampImageUrl?: string;
}

type ModalView = "main" | "email" | "email-sent";

// ─── Rate-limit helpers ──────────────────────────────────────

const COOLDOWN_KEY = "figmatelia-magic-link-cooldown";
const SEND_COUNT_KEY = "figmatelia-magic-link-send-count";
const NORMAL_COOLDOWN = 90; // seconds after a successful send
const RATE_LIMIT_COOLDOWN = 600; // 10 minutes when Supabase rejects us

function getRemainingCooldown(): number {
  try {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    if (!stored) return 0;
    const expiresAt = parseInt(stored, 10);
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

function setPersistentCooldown(durationSeconds: number) {
  try {
    localStorage.setItem(
      COOLDOWN_KEY,
      String(Date.now() + durationSeconds * 1000)
    );
  } catch {
    // localStorage unavailable
  }
}

/** Track send count so we can apply exponential back-off locally
 *  before Supabase even rejects us. Resets after 1 hour of inactivity. */
function getSendCount(): number {
  try {
    const data = JSON.parse(localStorage.getItem(SEND_COUNT_KEY) || "{}");
    if (data.ts && Date.now() - data.ts > 3_600_000) return 0;
    return data.count || 0;
  } catch {
    return 0;
  }
}

function incrementSendCount() {
  try {
    const count = getSendCount() + 1;
    localStorage.setItem(
      SEND_COUNT_KEY,
      JSON.stringify({ count, ts: Date.now() })
    );
  } catch {
    // ignore
  }
}

/** Cooldown grows with each send to stay well under Supabase limits */
function getCooldownForSend(): number {
  const count = getSendCount();
  if (count >= 4) return RATE_LIMIT_COOLDOWN;
  if (count >= 2) return 180; // 3 min
  return NORMAL_COOLDOWN;
}

// ─── Component ──────────────────────────────────────────────

export function RegistrationModal({
  isOpen,
  onClose,
  onAuthenticated,
  stampImageUrl,
}: RegistrationModalProps) {
  const [view, setView] = useState<ModalView>("main");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore persistent cooldown on mount / open
  useEffect(() => {
    if (isOpen) {
      setView("main");
      setEmail("");
      setError(null);
      setLoading(false);
      const remaining = getRemainingCooldown();
      if (remaining > 0) {
        startCooldownTimer(remaining);
      } else {
        setResendCooldown(0);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      }
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [isOpen]);

  // Listen for auth state changes (for when magic link redirect returns)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.access_token) {
        onAuthenticated(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  const startCooldownTimer = useCallback((duration: number) => {
    setResendCooldown(duration);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /** Shared logic for sending (or resending) the magic link */
  const doSendMagicLink = useCallback(
    async (targetEmail: string) => {
      // 1. Check persistent cooldown first (never call Supabase if blocked)
      const remaining = getRemainingCooldown();
      if (remaining > 0) {
        setError(
          "Please wait before requesting another link. Check your inbox (and spam folder)."
        );
        startCooldownTimer(remaining);
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/oauth/consent`,
          },
        });

        if (authError) {
          console.error("Magic link error:", authError);
          const isRateLimit =
            authError.message?.toLowerCase().includes("rate limit") ||
            authError.status === 429;

          if (isRateLimit) {
            // Aggressive back-off: 10 minutes
            setPersistentCooldown(RATE_LIMIT_COOLDOWN);
            startCooldownTimer(RATE_LIMIT_COOLDOWN);
            incrementSendCount();
            setError(
              "Too many requests. Please wait 10 minutes before trying again, and check your spam folder in the meantime."
            );
          } else {
            setError(
              "Could not send magic link. Please check your email and try again."
            );
          }
          return false;
        }

        // Success — apply progressive cooldown
        incrementSendCount();
        const cooldown = getCooldownForSend();
        setPersistentCooldown(cooldown);
        startCooldownTimer(cooldown);
        return true;
      } catch (err) {
        console.error("Magic link send error:", err);
        setError("Something went wrong. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [startCooldownTimer]
  );

  const handleSendMagicLink = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const ok = await doSendMagicLink(email.trim());
    if (ok) setView("email-sent");
  }, [email, doSendMagicLink]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || loading) return;
    await doSendMagicLink(email.trim());
  }, [email, resendCooldown, loading, doSendMagicLink]);

  const handleBackdropClick = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  // Drag-to-dismiss state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  /** Format seconds into a human-readable string */
  const formatWait = (s: number) => {
    if (s >= 120) {
      const m = Math.ceil(s / 60);
      return `Wait ${m} min`;
    }
    return `Wait ${s}s`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
            initial={{ y: "100%" }}
            animate={{ y: isDragging ? dragY : 0 }}
            exit={{ y: "100%" }}
            transition={
              isDragging
                ? { duration: 0 }
                : { type: "spring", damping: 28, stiffness: 350 }
            }
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDrag={(_, info) => {
              setIsDragging(true);
              setDragY(Math.max(0, info.offset.y));
            }}
            onDragEnd={(_, info) => {
              setIsDragging(false);
              setDragY(0);
              if (info.offset.y > 120 || info.velocity.y > 400) {
                onClose();
              }
            }}
          >
            <div
              className="w-full rounded-t-[24px] flex flex-col items-center overflow-hidden"
              style={{
                maxWidth: "403px",
                backgroundColor: "#F1F1EE",
                boxShadow: "0px -8px 40px rgba(0, 0, 0, 0.12)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-[12px] pb-[4px] w-full cursor-grab">
                <div
                  className="rounded-full"
                  style={{
                    width: "36px",
                    height: "4px",
                    backgroundColor: "#C4C4C0",
                  }}
                />
              </div>

              {/* Content */}
              <div className="w-full px-[28px] pb-[28px] flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {view === "main" && (
                    <motion.div
                      key="main"
                      className="w-full flex flex-col items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Stamp thumbnail */}
                      <div className="mt-[16px] mb-[20px]">
                        {stampImageUrl ? (
                          <StampDisplay imageUrl={stampImageUrl} width={80} />
                        ) : (
                          <div
                            className="flex items-center justify-center"
                            style={{ width: "64px", height: "64px" }}
                          >
                            <svg
                              width="48"
                              height="48"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                stroke="#757575"
                                strokeWidth="1.5"
                              />
                              <circle cx="8.5" cy="8.5" r="1.5" fill="#757575" />
                              <path
                                d="M21 15L16 10L5 21"
                                stroke="#757575"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Heading */}
                      <h2
                        className="text-center mb-[8px]"
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: "28px",
                          lineHeight: "1.2",
                          fontWeight: 400,
                          color: "#1B1D1C",
                        }}
                      >
                        Save your stamps forever
                      </h2>

                      {/* Subtext */}
                      <p
                        className="text-center mb-[28px]"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          fontWeight: 400,
                          color: "#757575",
                          maxWidth: "280px",
                        }}
                      >
                        Create an account to keep your collection safe and share
                        it with anyone.
                      </p>

                      {/* Error message */}
                      {error && (
                        <p
                          className="text-center mb-[12px]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            color: "#D94040",
                          }}
                        >
                          {error}
                        </p>
                      )}

                      {/* Continue with email */}
                      <button
                        className="w-full flex items-center justify-center gap-[10px] py-[14px] rounded-[12px] cursor-pointer border-none mb-[20px] relative"
                        style={{
                          background: "rgba(255, 255, 255, 0.85)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                        }}
                        onClick={() => {
                          setError(null);
                          setView("email");
                        }}
                        disabled={loading}
                      >
                        <div
                          className="absolute pointer-events-none rounded-[13px]"
                          style={{
                            inset: "-1px",
                            border: "1px solid rgba(0,0,0,0.08)",
                            boxShadow:
                              "0px 1px 3px 0px rgba(27,29,28,0.08), 0px 1px 2px 0px rgba(27,29,28,0.06)",
                          }}
                        />
                        {/* Mail icon */}
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#757575"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: "#1B1D1C",
                          }}
                        >
                          Continue with email
                        </span>
                        <div
                          className="absolute pointer-events-none rounded-[inherit]"
                          style={{
                            inset: "-1px",
                            boxShadow:
                              "inset 0px 0px 9.78px 0px rgba(255,255,255,0.1)",
                          }}
                        />
                      </button>

                      {/* Skip for now */}
                      <button
                        className="bg-transparent border-none cursor-pointer p-[4px]"
                        onClick={onClose}
                        disabled={loading}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A09C",
                          }}
                        >
                          Skip for now
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {view === "email" && (
                    <motion.div
                      key="email"
                      className="w-full flex flex-col items-center"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Back to main */}
                      <button
                        className="self-start bg-transparent border-none cursor-pointer p-[4px] mt-[8px] mb-[8px]"
                        onClick={() => {
                          setError(null);
                          setView("main");
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M19 12H5"
                            stroke="#757575"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 19L5 12L12 5"
                            stroke="#757575"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {/* Heading */}
                      <h2
                        className="text-center mb-[8px]"
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: "28px",
                          lineHeight: "1.2",
                          fontWeight: 400,
                          color: "#1B1D1C",
                        }}
                      >
                        Enter your email
                      </h2>

                      <p
                        className="text-center mb-[24px]"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#757575",
                          maxWidth: "280px",
                        }}
                      >
                        We'll send you a magic link to sign in — no password
                        needed.
                      </p>

                      {/* Error */}
                      {error && (
                        <p
                          className="text-center mb-[12px]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            color: "#D94040",
                          }}
                        >
                          {error}
                        </p>
                      )}

                      {/* Email input */}
                      <div className="w-full mb-[16px] relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoFocus
                          className="w-full bg-transparent border-none outline-none py-[14px] px-[16px] rounded-[12px]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "15px",
                            color: "#1B1D1C",
                            caretColor: "#757575",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendMagicLink();
                          }}
                        />
                        <div
                          className="absolute pointer-events-none rounded-[12px]"
                          style={{
                            inset: "0",
                            border: "1.5px solid rgba(0,0,0,0.12)",
                          }}
                        />
                      </div>

                      {/* Send magic link button */}
                      <button
                        className="w-full flex items-center justify-center py-[14px] rounded-[12px] cursor-pointer border-none relative"
                        style={{
                          background:
                            loading || resendCooldown > 0
                              ? "rgba(200, 200, 196, 0.75)"
                              : "rgba(232, 232, 232, 0.75)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          opacity: resendCooldown > 0 ? 0.6 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                        onClick={handleSendMagicLink}
                        disabled={loading || resendCooldown > 0}
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
                          {loading
                            ? "Sending..."
                            : resendCooldown > 0
                              ? formatWait(resendCooldown)
                              : "Send magic link"}
                        </span>
                      </button>
                    </motion.div>
                  )}

                  {view === "email-sent" && (
                    <motion.div
                      key="email-sent"
                      className="w-full flex flex-col items-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Checkmark icon */}
                      <div
                        className="mt-[20px] mb-[16px] flex items-center justify-center rounded-full"
                        style={{
                          width: "56px",
                          height: "56px",
                          backgroundColor: "rgba(52, 168, 83, 0.1)",
                        }}
                      >
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#34A853"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17L4 12" />
                        </svg>
                      </div>

                      <h2
                        className="text-center mb-[8px]"
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: "28px",
                          lineHeight: "1.2",
                          fontWeight: 400,
                          color: "#1B1D1C",
                        }}
                      >
                        Check your inbox
                      </h2>

                      <p
                        className="text-center mb-[6px]"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          color: "#757575",
                          maxWidth: "280px",
                        }}
                      >
                        We sent a magic link to{" "}
                        <span style={{ color: "#1B1D1C", fontWeight: 500 }}>
                          {email}
                        </span>
                        . Click the link to sign in and save your stamp.
                      </p>

                      {/* Spam hint */}
                      <p
                        className="text-center mb-[20px]"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "12px",
                          lineHeight: "1.4",
                          color: "#A0A09C",
                          maxWidth: "260px",
                        }}
                      >
                        Don't see it? Check your spam or junk folder.
                      </p>

                      {/* Error */}
                      {error && (
                        <p
                          className="text-center mb-[12px]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            color: "#D94040",
                          }}
                        >
                          {error}
                        </p>
                      )}

                      {/* Resend button */}
                      <button
                        className="w-full flex items-center justify-center py-[14px] rounded-[12px] cursor-pointer border-none relative mb-[10px]"
                        style={{
                          background:
                            resendCooldown > 0
                              ? "rgba(200, 200, 196, 0.5)"
                              : "rgba(232, 232, 232, 0.75)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          opacity: resendCooldown > 0 ? 0.6 : 1,
                          transition: "opacity 0.2s ease",
                        }}
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
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
                          {loading
                            ? "Sending..."
                            : resendCooldown > 0
                              ? `Resend in ${formatWait(resendCooldown)}`
                              : "Resend magic link"}
                        </span>
                      </button>

                      {/* Use a different email */}
                      <button
                        className="bg-transparent border-none cursor-pointer p-[4px] mb-[4px]"
                        onClick={() => {
                          setError(null);
                          setView("email");
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A09C",
                            textDecoration: "underline",
                            textDecorationColor: "rgba(160,160,156,0.4)",
                            textUnderlineOffset: "2px",
                          }}
                        >
                          Use a different email
                        </span>
                      </button>

                      {/* Done / close */}
                      <button
                        className="bg-transparent border-none cursor-pointer p-[4px]"
                        onClick={onClose}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#A0A09C",
                          }}
                        >
                          Got it
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
