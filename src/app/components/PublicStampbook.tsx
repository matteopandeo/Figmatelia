import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { StampCard } from "./StampCard";
import { StampGallery } from "./StampGallery";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import svgPaths from "../../imports/svg-53u02dzvr3";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1`;

interface Stamp {
  id: string;
  name?: string;
  imageUrl: string;
}

interface StampbookData {
  slug: string;
  title: string;
  displayName: string;
}

export function PublicStampbook() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [stampbook, setStampbook] = useState<StampbookData | null>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;

    async function fetchPublicStampbook() {
      try {
        const res = await fetch(
          `${SERVER_BASE}/make-server-758b50b2/stampbook/public/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Stampbook not found");
          return;
        }

        setStampbook(data.stampbook);
        setStamps(data.stamps || []);
      } catch (err) {
        console.error("Error loading public stampbook:", err);
        setError("Could not load this stampbook. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchPublicStampbook();
  }, [slug]);

  const handleStampTap = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleCreateOwn = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "#F1F1EE" }}
      >
        <p
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "24px",
            color: "#757575",
            opacity: 0.6,
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  if (error || !stampbook) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center px-[24px]"
        style={{ backgroundColor: "#F1F1EE" }}
      >
        <p
          className="text-center mb-[24px]"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "28px",
            color: "#1B1D1C",
          }}
        >
          Stampbook not found
        </p>
        <p
          className="text-center mb-[32px]"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "#757575",
            maxWidth: "280px",
          }}
        >
          This stampbook doesn't exist or may have been removed.
        </p>
        <button
          className="relative flex items-center justify-center py-[14px] px-[28px] rounded-[12px] cursor-pointer border-none"
          style={{
            background: "rgba(232, 232, 232, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={handleCreateOwn}
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
            Create your own Figmatelia
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: "#F1F1EE" }}
    >
      <div
        className="relative w-full flex flex-col items-center"
        style={{ maxWidth: "403px" }}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col items-center pt-[16px] pb-[8px] w-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Figmatelia logo */}
          <div
            className="relative shrink-0"
            style={{ width: "80px", height: "58px" }}
          >
            <svg
              className="block w-full h-full"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 105.303 76.9999"
            >
              <path d={svgPaths.p13a86d80} fill="#757575" />
            </svg>
          </div>

          {/* Owner name + stamp count */}
          <p
            className="mt-[8px] text-center"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "24px",
              lineHeight: "1.3",
              fontWeight: 400,
              color: "#1B1D1C",
            }}
          >
            {stampbook.displayName}'s stamps
          </p>
          <p
            className="mt-[2px]"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "#A0A09C",
            }}
          >
            {stamps.length} stamp{stamps.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Divider */}
        <div
          className="w-full px-[28px] my-[8px]"
        >
          <div
            className="w-full h-[1px] opacity-30"
            style={{ backgroundColor: "#757575" }}
          />
        </div>

        {/* Stamp Grid */}
        <motion.div
          className="grid grid-cols-2 w-full px-[18px] pb-[120px]"
          style={{ gap: "16px", marginTop: "8px" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {stamps.map((stamp, index) => (
            <motion.div
              key={stamp.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * Math.min(index, 8) }}
            >
              <StampCard
                id={`public-${stamp.id}`}
                isEmpty={false}
                imageUrl={stamp.imageUrl}
                onClick={() => handleStampTap(index)}
              />
            </motion.div>
          ))}
        </motion.div>

        {stamps.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-[28px]">
            <p
              className="text-center"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "22px",
                color: "#A0A09C",
              }}
            >
              No stamps yet
            </p>
          </div>
        )}

        {/* CTA Footer — Create your own */}
        <div
          className="fixed bottom-0 left-0 right-0 flex items-center justify-center pb-[28px] pt-[10px] pointer-events-none"
          style={{ maxWidth: "403px", margin: "0 auto" }}
        >
          <button
            className="pointer-events-auto relative flex items-center justify-center gap-[8px] py-[12px] px-[24px] rounded-[12px] cursor-pointer border-none"
            style={{
              background: "rgba(232, 232, 232, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={handleCreateOwn}
          >
            <div
              className="absolute pointer-events-none rounded-[13px]"
              style={{
                inset: "-1px",
                border: "1px solid #efefef",
                boxShadow:
                  "0px 25.414px 10.241px 0px rgba(27,29,28,0.01), 0px 14.414px 8.724px 0px rgba(27,29,28,0.05), 0px 6.448px 6.448px 0px rgba(27,29,28,0.1), 0px 1.517px 3.414px 0px rgba(27,29,28,0.14)",
              }}
            />
            {/* Plus icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#757575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "22px",
                lineHeight: "normal",
                fontWeight: 400,
                color: "#757575",
              }}
            >
              Create your own Figmatelia
            </span>
            <div
              className="absolute pointer-events-none rounded-[inherit]"
              style={{
                inset: "-1px",
                boxShadow:
                  "inset 0px 0px 7.586px 0px rgba(255,255,255,0.1)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Stamp Gallery */}
      <StampGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        stamps={stamps}
        initialIndex={galleryIndex}
      />
    </div>
  );
}