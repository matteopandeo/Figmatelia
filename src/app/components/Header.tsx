import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import svgPaths from "../../imports/svg-53u02dzvr3";

export function Header() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = useCallback(async () => {
    setShowMenu(false);
    await supabase.auth.signOut();
  }, []);

  const initials = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <div className="flex items-end justify-between pt-[10px] pb-[10px] w-full px-[18px]">
      {/* Left: Logo + tagline */}
      <div className="flex gap-[10px] items-end">
        {/* Figmatelia logo */}
        <div className="relative shrink-0" style={{ width: "105.303px", height: "77px" }}>
          <svg
            className="block w-full h-full"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 105.303 76.9999"
          >
            <path d={svgPaths.p13a86d80} fill="#757575" />
          </svg>
        </div>
        {/* Tagline */}
        <div
          className="shrink-0 text-[#757575] opacity-60 whitespace-nowrap"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "32.25px",
            lineHeight: "normal",
            fontStyle: "normal",
            fontWeight: 400,
          }}
        >
          <p className="mb-0">Gonna stamp</p>
          <p> them all</p>
        </div>
      </div>

      {/* Right: Auth status */}
      {!isLoading && isAuthenticated && user && (
        <div className="relative flex items-end pb-[6px]">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="relative flex items-center justify-center rounded-full cursor-pointer border-none p-0"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "#1B1D1C",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#F1F1EE",
                lineHeight: 1,
              }}
            >
              {initials}
            </span>
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                {/* Invisible backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  className="absolute right-0 z-50 flex flex-col rounded-[12px] overflow-hidden"
                  style={{
                    top: "44px",
                    minWidth: "180px",
                    backgroundColor: "#FFFFFF",
                    boxShadow:
                      "0px 4px 16px rgba(0,0,0,0.12), 0px 1px 4px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* User email */}
                  <div
                    className="px-[14px] py-[10px]"
                    style={{
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#1B1D1C",
                        lineHeight: 1.4,
                        wordBreak: "break-all",
                      }}
                    >
                      {user.email}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "11px",
                        color: "#34A853",
                        marginTop: "2px",
                      }}
                    >
                      Connected
                    </p>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-[8px] px-[14px] py-[10px] bg-transparent border-none cursor-pointer w-full text-left"
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {/* Logout icon */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#757575"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#757575",
                      }}
                    >
                      Sign out
                    </span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
