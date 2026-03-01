import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { StampDisplay } from "./StampDisplay";
import { RegistrationModal } from "./RegistrationModal";
import { useAuth } from "../lib/AuthContext";
import { projectId } from "/utils/supabase/info";

// Image-plus icon paths (same as used in other buttons)
const SAVE_ICON_PATHS = [
  "M20.2129 16.4541L30.7221 30.803H2.54355V30.7825L9.58836 21.7924L13.3446 26.2373L20.2129 16.4541Z",
  "M34.8333 15.4375V27.3125C34.8333 29.9358 32.7067 32.0625 30.0833 32.0625H4.75C2.12665 32.0625 0 29.9358 0 27.3125V8.3125C0 5.68915 2.12665 3.5625 4.75 3.5625H18.2083V5.9375H4.75C3.43833 5.9375 2.375 7.00079 2.375 8.3125V27.3125C2.375 28.6242 3.43833 29.6875 4.75 29.6875H30.0833C31.395 29.6875 32.4583 28.6242 32.4583 27.3125V15.4375H34.8333Z",
  "M35.2292 7.52083C35.2292 11.6745 31.862 15.0417 27.7083 15.0417C23.5547 15.0417 20.1875 11.6745 20.1875 7.52083C20.1875 3.36719 23.5547 0 27.7083 0C31.862 0 35.2292 3.36719 35.2292 7.52083ZM28.8958 3.5625H26.5208V6.33333H23.75V8.70833H26.5208V11.4792H28.8958V8.70833H31.6667V6.33333H28.8958V3.5625Z",
  "M9.5 17.4167C11.4675 17.4167 13.0625 15.8217 13.0625 13.8542C13.0625 11.8866 11.4675 10.2917 9.5 10.2917C7.53248 10.2917 5.9375 11.8866 5.9375 13.8542C5.9375 15.8217 7.53248 17.4167 9.5 17.4167Z",
];

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1`;

export function AddDetails() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuth();

  const [stampImage, setStampImage] = useState<string | null>(null);
  const [stampName, setStampName] = useState("");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingStamp, setPendingStamp] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const img = sessionStorage.getItem("figmatelia-stamp-image");
    if (img) {
      setStampImage(img);
    } else {
      navigate("/step1");
    }
  }, [navigate]);

  useEffect(() => {
    // Auto-focus the name input after mount
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const buildStamp = useCallback(() => {
    if (!stampImage) return null;
    return {
      id: crypto.randomUUID(),
      name: stampName || "Untitled stamp",
      imageUrl: stampImage,
      createdAt: new Date().toISOString(),
      localOnly: true,
    };
  }, [stampImage, stampName]);

  const cleanupSession = () => {
    sessionStorage.removeItem("figmatelia-pending-image");
    sessionStorage.removeItem("figmatelia-stamp-image");
    sessionStorage.removeItem("figmatelia-stamp-transform");
  };

  const saveStampLocally = (stamp: any) => {
    try {
      const existing = localStorage.getItem("figmatelia-stamps");
      const stamps = existing ? JSON.parse(existing) : [];
      stamps.unshift(stamp);
      localStorage.setItem("figmatelia-stamps", JSON.stringify(stamps));
    } catch (err) {
      console.error("Error saving stamp to localStorage:", err);
    }
  };

  const saveStampToSupabase = async (stamp: any, token: string) => {
    try {
      const cloudStamp = { ...stamp, localOnly: false };

      const res = await fetch(
        `${SERVER_BASE}/make-server-758b50b2/stamps/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ stamp: cloudStamp }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        console.error("Error saving stamp to Supabase:", data.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error saving stamp to Supabase:", err);
      return false;
    }
  };

  const migrateLocalStampsToSupabase = async (token: string) => {
    try {
      const existing = localStorage.getItem("figmatelia-stamps");
      if (!existing) return;
      const stamps = JSON.parse(existing);
      if (!stamps.length) return;

      const cloudStamps = stamps.map((s: any) => ({ ...s, localOnly: false }));

      const res = await fetch(`${SERVER_BASE}/make-server-758b50b2/stamps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stamps: cloudStamps }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem("figmatelia-stamps");
        toast.success("Your stamps have been saved to your account");
      } else {
        console.error("Error migrating stamps to Supabase:", data.error);
      }
    } catch (err) {
      console.error("Error migrating stamps:", err);
    }
  };

  const handleSave = async () => {
    if (!stampImage) return;

    const stamp = buildStamp();
    if (!stamp) return;

    // CRITICAL: Check actual auth state from context, not "first stamp" heuristic
    if (isAuthenticated && accessToken) {
      // User is authenticated → save directly to Supabase
      stamp.localOnly = false;
      await saveStampToSupabase(stamp, accessToken);
      // Also save locally for instant display
      saveStampLocally(stamp);
      cleanupSession();
      navigate("/");
      return;
    }

    // Not authenticated — check if this is the first stamp ever
    const existingStamps = localStorage.getItem("figmatelia-stamps");
    const hasExistingStamps =
      existingStamps && JSON.parse(existingStamps).length > 0;

    if (!hasExistingStamps) {
      // First stamp → show registration modal
      setPendingStamp(stamp);
      setShowRegistrationModal(true);
    } else {
      // Not first stamp, not authenticated → save locally silently
      saveStampLocally(stamp);
      cleanupSession();
      navigate("/");
    }
  };

  const handleModalClose = () => {
    // "Skip for now" — save stamp locally with localOnly badge
    setShowRegistrationModal(false);
    if (pendingStamp) {
      saveStampLocally(pendingStamp);
      cleanupSession();
      navigate("/");
    }
  };

  const handleAuthenticated = async (newAccessToken: string) => {
    setShowRegistrationModal(false);

    if (pendingStamp) {
      // Save the pending stamp to Supabase
      pendingStamp.localOnly = false;
      saveStampLocally(pendingStamp);
      await saveStampToSupabase(pendingStamp, newAccessToken);

      // Also migrate any other local stamps
      await migrateLocalStampsToSupabase(newAccessToken);

      cleanupSession();
      navigate("/");
    }
  };

  const handleBack = () => {
    navigate("/step2");
  };

  if (!stampImage) return null;

  return (
    <div
      className="h-screen w-full flex justify-center overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="relative w-full h-full flex flex-col items-center"
        style={{ maxWidth: "403px" }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute left-[16px] top-[20px] z-30 cursor-pointer bg-transparent border-none p-[8px]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

        {/* Step label with horizontal lines */}
        <motion.div
          className="flex items-center justify-center w-full"
          style={{ height: "10vh", padding: "10px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p
            className="shrink-0 text-center text-[#757575] opacity-60 px-[10px]"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "30px",
              lineHeight: "normal",
              fontStyle: "normal",
              fontWeight: 400,
            }}
          >
            Add details
          </p>
        </motion.div>

        {/* Name your stamp + stamp preview */}
        <div
          className="flex flex-col items-center flex-1 justify-center"
          style={{ marginTop: "-60px" }}
        >
          {/* Name input */}
          <motion.div
            className="relative w-full flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={stampName}
              onChange={(e) => setStampName(e.target.value)}
              placeholder="Name your stamp"
              className="text-center bg-transparent border-none outline-none text-[#757575] w-full px-[40px]"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "40px",
                lineHeight: "normal",
                fontStyle: "normal",
                fontWeight: 400,
                caretColor: "#757575",
              }}
            />
          </motion.div>

          {/* Stamp image with scalloped clip */}
          <motion.div
            className="relative"
            style={{
              marginTop: "16px",
            }}
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: "easeOut",
            }}
          >
            <StampDisplay imageUrl={stampImage} width={160} />
          </motion.div>
        </div>

        {/* Save in stamp book button */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-[28px] pt-[10px] z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <button
            className="relative flex items-center justify-center gap-[12px] pl-[13px] pr-[25px] py-[12px] rounded-[12px] cursor-pointer border-none"
            style={{
              background: "rgba(232, 232, 232, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={handleSave}
          >
            <div
              className="absolute pointer-events-none rounded-[13px]"
              style={{
                inset: "-1px",
                border: "1px solid #efefef",
                boxShadow:
                  "0px 32.762px 13.203px 0px rgba(27,29,28,0.01), 0px 18.581px 11.247px 0px rgba(27,29,28,0.05), 0px 8.313px 8.313px 0px rgba(27,29,28,0.1), 0px 1.956px 4.401px 0px rgba(27,29,28,0.14)",
              }}
            />
            {/* Save icon */}
            <div
              className="overflow-clip relative shrink-0 opacity-40"
              style={{ width: "38px", height: "38px" }}
            >
              <svg
                className="block"
                fill="none"
                viewBox="0 0 35.2292 32.0625"
                style={{ width: "100%", height: "100%", padding: "4%" }}
              >
                {SAVE_ICON_PATHS.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="#757575"
                    clipRule="evenodd"
                    fillRule="evenodd"
                  />
                ))}
              </svg>
            </div>
            <p
              className="shrink-0 text-left text-[#757575] opacity-40"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "40px",
                lineHeight: "normal",
                fontStyle: "normal",
                fontWeight: 400,
              }}
            >
              Save in stamp book
            </p>
            <div
              className="absolute pointer-events-none rounded-[inherit]"
              style={{
                inset: "-1px",
                boxShadow:
                  "inset 0px 0px 9.78px 0px rgba(255,255,255,0.1)",
              }}
            />
          </button>
        </motion.div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleModalClose}
        onAuthenticated={handleAuthenticated}
        stampImageUrl={stampImage}
      />
    </div>
  );
}
