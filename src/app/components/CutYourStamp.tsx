import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "../../imports/svg-fb5gf2yc72";
import imgPunchTool from "figma:asset/005f14c479988123f230e03d4bbe68e67ece9192.png";
import { StampDisplay } from "./StampDisplay";

const SCISSORS_PATHS = [
  svgPaths.p291ac800,
  svgPaths.p131fc300,
  svgPaths.p1692e900,
  svgPaths.p212e8080,
  svgPaths.p1dc42600,
  svgPaths.p1e933500,
  svgPaths.p2684e80,
  svgPaths.p2931d080,
  svgPaths.p2e410f00,
  svgPaths.p31c67e00,
  svgPaths.p18a2f180,
  svgPaths.p3b6b3880,
  svgPaths.p62968f0,
  svgPaths.p3f7d2400,
  svgPaths.p7c05480,
];

// Animation phases
type Phase = "idle" | "press" | "flash" | "bounce" | "extract" | "transition";

export function CutYourStamp() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  // Transform state for the photo
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Random rotation for extracted stamp
  const stampRotation = useMemo(() => Math.random() * 10 - 5, []);

  const imageRef = useRef<HTMLImageElement>(null);
  const punchWindowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stampDataUrl, setStampDataUrl] = useState<string | null>(null);

  // Store punch window bounds BEFORE animation starts (at idle)
  const punchWindowBoundsRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("figmatelia-pending-image");
    if (saved) {
      setImageUrl(saved);
    } else {
      navigate("/step1");
    }
  }, [navigate]);

  // Average color for top tint
  const [avgColor, setAvgColor] = useState("rgba(217,217,217,0.8)");
  const onImageLoad = useCallback(() => {
    if (!imageRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 20;
      canvas.height = 20;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(imageRef.current, 0, 0, 20, 20);
      const data = ctx.getImageData(0, 0, 20, 20).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      setAvgColor(
        `rgba(${Math.round(r / count)},${Math.round(g / count)},${Math.round(
          b / count
        )},0.8)`
      );
    } catch {
      /* keep default */
    }
  }, []);

  // Gesture handling
  const bind = useGesture(
    {
      onDrag: ({ delta: [dx, dy] }) => {
        if (phase !== "idle") return;
        setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
      },
      onPinch: ({ offset: [s, r] }) => {
        if (phase !== "idle") return;
        setScale(s);
        setRotation(r);
      },
      onWheel: ({ event, shiftKey, delta: [, dy] }) => {
        if (phase !== "idle") return;
        event.preventDefault();
        if (shiftKey) {
          setRotation((r) => r + dy * 0.2);
        } else {
          setScale((s) => Math.max(0.2, Math.min(5, s - dy * 0.002)));
        }
      },
    },
    {
      drag: { filterTaps: true },
      pinch: { scaleBounds: { min: 0.2, max: 5 } },
    }
  );

  // Capture the stamp: crop EXACTLY the region visible through the punch window
  const captureStamp = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const photoEl = imageRef.current;

    // Use the pre-captured idle-state bounds for the punch window
    const punchWindow = punchWindowBoundsRef.current;
    if (!punchWindow) return;

    // Photo's bounding rect — gives axis-aligned bounding box in viewport coords
    // Note: for rotated elements, this AABB is larger than the actual photo,
    // but its center is still the correct center of the rotated photo.
    const photoRect = photoEl.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = punchWindow.width * dpr;
    canvas.height = punchWindow.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, punchWindow.width, punchWindow.height);

    // Photo center relative to punch window (correct even for rotated elements)
    const photoCenterX =
      photoRect.left + photoRect.width / 2 - punchWindow.left;
    const photoCenterY =
      photoRect.top + photoRect.height / 2 - punchWindow.top;

    // Visual dimensions = layout dimensions × scale (NOT from getBoundingClientRect,
    // which returns the AABB and would be wrong for rotated photos)
    const visualW = photoEl.offsetWidth * scale;
    const visualH = photoEl.offsetHeight * scale;

    ctx.save();
    // Move origin to photo center, apply rotation, then draw centered
    ctx.translate(photoCenterX, photoCenterY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(photoEl, -visualW / 2, -visualH / 2, visualW, visualH);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");
    setStampDataUrl(dataUrl);

    // Store for Step 3
    sessionStorage.setItem("figmatelia-stamp-image", dataUrl);
    sessionStorage.setItem(
      "figmatelia-stamp-transform",
      JSON.stringify({ x: pos.x, y: pos.y, scale, rotation })
    );
  }, [pos, scale, rotation]);

  // Run the 5-phase animation sequence
  const handleCut = useCallback(() => {
    if (phase !== "idle") return;

    // Snapshot the punch window bounds BEFORE animation starts
    if (punchWindowRef.current) {
      punchWindowBoundsRef.current =
        punchWindowRef.current.getBoundingClientRect();
    }

    // Capture stamp immediately while photo is still at idle position
    // (before punch tool animation changes anything)
    captureStamp();

    // Phase 1: PRESS DOWN (150ms)
    setPhase("press");

    // Haptic feedback
    try {
      navigator.vibrate?.(50);
    } catch {
      /* not supported */
    }

    setTimeout(() => {
      // Phase 2: CUT FLASH (100ms)
      setPhase("flash");

      setTimeout(() => {
        // Phase 3: BOUNCE BACK (200ms)
        setPhase("bounce");

        setTimeout(() => {
          // Phase 4: STAMP EXTRACTION (400ms)
          setPhase("extract");

          setTimeout(() => {
            // Phase 5: TRANSITION (300ms)
            setPhase("transition");

            setTimeout(() => {
              navigate("/step3");
            }, 300);
          }, 400);
        }, 200);
      }, 100);
    }, 150);
  }, [phase, captureStamp, navigate]);

  const handleBack = () => {
    navigate("/step1");
  };

  if (!imageUrl) return null;

  // Punch tool transform based on phase
  const punchVariants = {
    idle: { scale: 1, y: 0 },
    press: { scale: 0.95, y: 8 },
    flash: { scale: 0.95, y: 8 },
    bounce: { scale: 1.02, y: -2 },
    extract: { scale: 1, y: 0 },
    transition: { scale: 1, y: 0 },
  };

  const punchTransition: Record<Phase, object> = {
    idle: {},
    press: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1],
    },
    flash: { duration: 0.05 },
    bounce: {
      type: "spring",
      stiffness: 300,
      damping: 15,
      mass: 0.8,
    },
    extract: { duration: 0.2 },
    transition: { duration: 0.2 },
  };

  const showStampExtract = phase === "extract" || phase === "transition";
  const showFlash = phase === "flash";
  const showTransition = phase === "transition";
  const isAnimating = phase !== "idle";

  return (
    <div
      className="h-screen w-full flex justify-center overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Hidden canvas for stamp capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div
        className="relative w-full h-full flex flex-col items-center"
        style={{ maxWidth: "403px" }}
      >
        {/* Back button */}
        {!isAnimating && (
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
        )}

        {/* Photo layer */}
        <div
          {...bind()}
          className="absolute inset-0 z-0 overflow-hidden"
          style={{
            cursor: isAnimating ? "default" : "grab",
            touchAction: "none",
          }}
        >
          <motion.img
            ref={imageRef}
            src={imageUrl}
            alt="Your photo"
            onLoad={onImageLoad}
            className="absolute select-none pointer-events-none"
            draggable={false}
            style={{
              left: "50%",
              top: "50%",
              maxWidth: "none",
              width: "120%",
              height: "auto",
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
            animate={{
              opacity: showTransition ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step label */}
        <motion.div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pointer-events-none"
          style={{
            height: "10vh",
            padding: "10px",
            background: "transparent",
          }}
          animate={{
            opacity: showTransition ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
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
          >Cut your stamp</p>
        </motion.div>

        {/* 
          Punch window ref — invisible element at the EXACT position of the 
          transparent window in the punch tool. Sits OUTSIDE the animated 
          punch container so getBoundingClientRect always returns idle-state bounds.
        */}
        <div
          ref={punchWindowRef}
          className="absolute pointer-events-none"
          style={{
            width: "120px",
            height: "155px",
            left: "50%",
            // Punch tool top: 183px, punch tool height: 478px
            // Window is at 50% of punch tool height, offset up by 55% of its own height
            // 183 + 478*0.5 - 155*0.55 = 183 + 239 - 85.25 = 336.75
            top: "337px",
            transform: "translateX(-50%)",
          }}
        />

        {/* Punch tool overlay (animated) */}
        <motion.div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            width: "261px",
            height: "478px",
            left: "50%",
            top: "183px",
            x: "-50%",
          }}
          animate={punchVariants[phase]}
          transition={punchTransition[phase]}
        >
          <motion.div
            className="flex-none rotate-90"
            animate={{
              opacity: showTransition ? 0 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="relative"
              style={{
                width: "478px",
                height: "261px",
              }}
            >
              <img
                alt="Stamp punch tool"
                className="absolute h-full left-0 top-0 w-full"
                src={imgPunchTool}
                style={{ maxWidth: "none" }}
              />
            </div>
          </motion.div>

          {/* Pulsing dashed border at punch window */}
          {phase === "idle" && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                width: "120px",
                height: "155px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -55%)",
              }}
            >
              <motion.div
                className="w-full h-full rounded-[4px]"
                style={{
                  border: "1.5px dashed rgba(255,255,255,0.6)",
                }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </motion.div>

        {/* CUT FLASH overlay */}
        <AnimatePresence>
          {showFlash && (
            <motion.div
              className="absolute z-30 bg-white"
              style={{
                width: "140px",
                height: "180px",
                left: "50%",
                top: "337px",
                x: "-50%",
                y: "-10px",
                borderRadius: "4px",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            />
          )}
        </AnimatePresence>

        {/* Extracted stamp — displays the EXACT cropped region with stamp shape */}
        <AnimatePresence>
          {showStampExtract && stampDataUrl && (
            <motion.div
              className="absolute z-25 pointer-events-none"
              style={{
                left: "50%",
                top: "337px",
                x: "-50%",
                y: "-10px",
              }}
              initial={{
                scale: 1,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                scale: phase === "transition" ? 0.85 : 0.6,
                rotate: stampRotation,
                opacity: 1,
                y: phase === "transition" ? "0%" : "-10px",
              }}
              transition={{
                duration: phase === "transition" ? 0.3 : 0.4,
                ease: "easeOut",
              }}
            >
              <StampDisplay imageUrl={stampDataUrl} width={120} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition overlay to Step 3 */}
        <AnimatePresence>
          {showTransition && (
            <motion.div
              className="absolute inset-0 z-20"
              style={{ backgroundColor: "#F1F1EE" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Cut button */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-center pb-[28px] pt-[10px] pointer-events-none z-50"
          animate={{
            opacity: isAnimating ? 0 : 1,
            y: isAnimating ? 20 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            className="pointer-events-auto relative flex items-center justify-center gap-[12px] pl-[13px] pr-[25px] py-[12px] rounded-[12px] cursor-pointer border-none"
            style={{
              background: "rgba(232, 232, 232, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={handleCut}
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
            <div
              className="overflow-clip relative shrink-0"
              style={{ width: "38px", height: "38px" }}
            >
              <svg
                className="block"
                fill="none"
                viewBox="0 0 34.8333 36.8125"
                style={{ width: "100%", height: "100%", padding: "1.04%" }}
              >
                {SCISSORS_PATHS.map((d, i) => (
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
              className="shrink-0 text-left text-[#757575]"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "40px",
                lineHeight: "normal",
                fontStyle: "normal",
                fontWeight: 400,
              }}
            >
              Cut your stamp
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
    </div>
  );
}