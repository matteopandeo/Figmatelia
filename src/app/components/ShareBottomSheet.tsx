import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StampDisplay } from "./StampDisplay";

interface Stamp {
  id: string;
  name?: string;
  imageUrl: string;
}

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stamps: Stamp[];
  publicUrl: string;
}

export function ShareBottomSheet({
  isOpen,
  onClose,
  stamps,
  publicUrl,
}: ShareBottomSheetProps) {
  const [copied, setCopied] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  // Reset copied state when modal opens
  useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, [publicUrl]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: "My Figmatelia",
        url: publicUrl,
      });
    } catch (err) {
      // User cancelled share — ignore
      if ((err as DOMException).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  }, [publicUrl]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Show up to 4 stamps as thumbnails
  const previewStamps = stamps.slice(0, 4);

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
                {/* Heading */}
                <h2
                  className="text-center mt-[12px] mb-[16px]"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "28px",
                    lineHeight: "1.2",
                    fontWeight: 400,
                    color: "#1B1D1C",
                  }}
                >
                  Share your stampbook
                </h2>

                {/* Stamp preview grid — 2x2 miniature */}
                {previewStamps.length > 0 && (
                  <div
                    className="grid grid-cols-4 mb-[20px]"
                    style={{ gap: "6px" }}
                  >
                    {previewStamps.map((stamp) => (
                      <StampDisplay
                        key={stamp.id}
                        imageUrl={stamp.imageUrl}
                        width={56}
                      />
                    ))}
                  </div>
                )}

                {/* URL field */}
                <div className="w-full mb-[16px] relative">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="w-full bg-transparent border-none outline-none py-[12px] px-[14px] rounded-[12px] select-all"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "#757575",
                      letterSpacing: "-0.01em",
                    }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <div
                    className="absolute pointer-events-none rounded-[12px]"
                    style={{
                      inset: "0",
                      border: "1.5px solid rgba(0,0,0,0.08)",
                    }}
                  />
                </div>

                {/* Action buttons */}
                <div className="w-full flex gap-[10px]">
                  {/* Copy link button */}
                  <button
                    className="flex-1 flex items-center justify-center gap-[8px] py-[14px] rounded-[12px] cursor-pointer border-none relative"
                    style={{
                      background: "rgba(255, 255, 255, 0.85)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                    onClick={handleCopy}
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
                    {copied ? (
                      /* Checkmark icon */
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#34A853"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17L4 12" />
                      </svg>
                    ) : (
                      /* Link icon */
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#757575"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: copied ? "#34A853" : "#1B1D1C",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {copied ? "Copied!" : "Copy link"}
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

                  {/* Share button — only if Web Share API is available */}
                  {canShare && (
                    <button
                      className="flex-1 flex items-center justify-center gap-[8px] py-[14px] rounded-[12px] cursor-pointer border-none relative"
                      style={{
                        background: "rgba(232, 232, 232, 0.75)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                      }}
                      onClick={handleShare}
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
                      {/* Share icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#757575"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "15px",
                          fontWeight: 500,
                          color: "#757575",
                        }}
                      >
                        Share
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
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
