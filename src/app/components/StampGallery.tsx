import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StampDisplay } from "./StampDisplay";

interface Stamp {
  id: string;
  name?: string;
  imageUrl: string;
}

interface StampGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  stamps: Stamp[];
  initialIndex: number;
}

export function StampGallery({
  isOpen,
  onClose,
  stamps,
  initialIndex,
}: StampGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Reset index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setDirection(0);
    }
  }, [isOpen, initialIndex]);

  const goTo = useCallback(
    (newIndex: number, dir: number) => {
      if (newIndex < 0 || newIndex >= stamps.length) return;
      setDirection(dir);
      setCurrentIndex(newIndex);
    },
    [stamps.length]
  );

  const goNext = useCallback(() => {
    if (currentIndex < stamps.length - 1) goTo(currentIndex + 1, 1);
  }, [currentIndex, stamps.length, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1, -1);
  }, [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const threshold = 60;
    if (touchDeltaX.current < -threshold) {
      goNext();
    } else if (touchDeltaX.current > threshold) {
      goPrev();
    }
    touchDeltaX.current = 0;
  };

  if (!stamps.length) return null;

  const stamp = stamps[currentIndex];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.85,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Close button */}
          <button
            className="absolute top-0 right-0 z-10 bg-transparent border-none cursor-pointer p-[16px]"
            onClick={onClose}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Counter */}
          <div
            className="absolute top-[18px] left-0 right-0 text-center"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.02em",
            }}
          >
            {currentIndex + 1} / {stamps.length}
          </div>

          {/* Stamp area — swipeable */}
          <div
            className="relative flex items-center justify-center w-full"
            style={{ height: "60vh", maxWidth: "403px", touchAction: "pan-y" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Nav arrows — desktop */}
            {currentIndex > 0 && (
              <button
                className="absolute left-[8px] z-10 bg-transparent border-none cursor-pointer p-[8px] hidden md:block"
                onClick={goPrev}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18L9 12L15 6" />
                </svg>
              </button>
            )}
            {currentIndex < stamps.length - 1 && (
              <button
                className="absolute right-[8px] z-10 bg-transparent border-none cursor-pointer p-[8px] hidden md:block"
                onClick={goNext}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18L15 12L9 6" />
                </svg>
              </button>
            )}

            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={stamp.id}
                className="flex flex-col items-center"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 32,
                }}
              >
                <StampDisplay
                  imageUrl={stamp.imageUrl}
                  width={220}
                  className="drop-shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stamp name */}
          <motion.p
            key={`name-${stamp.id}`}
            className="mt-[20px] text-center"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "26px",
              lineHeight: "1.3",
              fontWeight: 400,
              color: "rgba(255,255,255,0.9)",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            {stamp.name || "Untitled"}
          </motion.p>

          {/* Dot indicators */}
          {stamps.length > 1 && stamps.length <= 12 && (
            <div className="flex items-center gap-[6px] mt-[16px]">
              {stamps.map((s, i) => (
                <button
                  key={s.id}
                  className="bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                >
                  <div
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: i === currentIndex ? "8px" : "6px",
                      height: i === currentIndex ? "8px" : "6px",
                      backgroundColor:
                        i === currentIndex
                          ? "rgba(255,255,255,0.8)"
                          : "rgba(255,255,255,0.25)",
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
