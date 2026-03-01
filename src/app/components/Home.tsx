import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Header } from "./Header";
import { StampCard } from "./StampCard";
import { ShareButton } from "./ShareButton";
import { ShareBottomSheet } from "./ShareBottomSheet";
import { RegistrationModal } from "./RegistrationModal";
import { StampGallery } from "./StampGallery";
import { useAuth } from "../lib/AuthContext";
import { projectId } from "/utils/supabase/info";

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1`;

interface Stamp {
  id: string;
  name?: string;
  imageUrl: string;
  localOnly?: boolean;
}

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken, isLoading } = useAuth();

  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const stampsLoadedForToken = useRef<string | null>(null);

  // Fetch stamps from Supabase for an authenticated user
  const fetchStampsFromServer = useCallback(
    async (token: string): Promise<Stamp[]> => {
      try {
        const res = await fetch(
          `${SERVER_BASE}/make-server-758b50b2/stamps`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data.stamps)) {
          return data.stamps;
        }
        console.error("Error fetching stamps from server:", data.error);
        return [];
      } catch (err) {
        console.error("Error fetching stamps from server:", err);
        return [];
      }
    },
    []
  );

  // Load stamps based on auth state (runs when auth resolves or changes)
  useEffect(() => {
    if (isLoading) return; // Wait for auth to resolve

    async function loadStamps() {
      if (isAuthenticated && accessToken) {
        // Avoid re-fetching if we already loaded for this token
        if (stampsLoadedForToken.current === accessToken) return;
        stampsLoadedForToken.current = accessToken;

        const serverStamps = await fetchStampsFromServer(accessToken);
        setStamps(serverStamps);
      } else {
        stampsLoadedForToken.current = null;
        // Not authenticated → load from localStorage
        try {
          const saved = localStorage.getItem("figmatelia-stamps");
          if (saved) {
            setStamps(JSON.parse(saved));
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    loadStamps();
  }, [isAuthenticated, accessToken, isLoading, fetchStampsFromServer]);

  const handleCreateNew = () => {
    navigate("/step1");
  };

  const handleStampTap = (stamp: Stamp) => {
    const idx = stamps.findIndex((s) => s.id === stamp.id);
    if (idx >= 0) {
      setGalleryIndex(idx);
      setGalleryOpen(true);
    }
  };

  // Ensure stampbook exists and get slug for the authenticated user
  const ensureStampbook = useCallback(
    async (token: string): Promise<string | null> => {
      try {
        const res = await fetch(
          `${SERVER_BASE}/make-server-758b50b2/stampbook/ensure`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          console.error("Error ensuring stampbook:", data.error);
          return null;
        }
        return data.stampbook?.slug || null;
      } catch (err) {
        console.error("Error ensuring stampbook:", err);
        return null;
      }
    },
    []
  );

  const handleShare = useCallback(async () => {
    if (shareLoading) return;
    setShareLoading(true);

    try {
      // Use the centralized auth state — no separate getSession() call
      if (!isAuthenticated || !accessToken) {
        // Not authenticated → show registration modal
        setShareLoading(false);
        setShowRegistrationModal(true);
        return;
      }

      // Authenticated → ensure stampbook exists & get slug
      const slug = await ensureStampbook(accessToken);
      if (!slug) {
        console.error("Could not create stampbook slug");
        setShareLoading(false);
        return;
      }

      // Build public URL
      const url = `${window.location.origin}/book/${slug}`;
      setPublicUrl(url);
      setShowShareSheet(true);
    } catch (err) {
      console.error("Error handling share:", err);
    } finally {
      setShareLoading(false);
    }
  }, [shareLoading, isAuthenticated, accessToken, ensureStampbook]);

  const handleRegistrationClose = useCallback(() => {
    setShowRegistrationModal(false);
  }, []);

  const handleAuthenticated = useCallback(
    async (newAccessToken: string) => {
      setShowRegistrationModal(false);

      // AuthProvider already migrates local stamps on SIGNED_IN.
      // Just reload stamps from server.
      stampsLoadedForToken.current = null; // force reload
      const serverStamps = await fetchStampsFromServer(newAccessToken);
      setStamps(serverStamps);

      // Now open the share sheet
      const slug = await ensureStampbook(newAccessToken);
      if (slug) {
        const url = `${window.location.origin}/book/${slug}`;
        setPublicUrl(url);
        setShowShareSheet(true);
      }
    },
    [fetchStampsFromServer, ensureStampbook]
  );

  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: "#F1F1EE" }}
    >
      <div
        className="relative w-full flex flex-col items-center min-h-[80vh]"
        style={{ maxWidth: "403px" }}
      >
        {/* Header */}
        <Header />

        {/* Stamp Grid */}
        <div
          className="grid grid-cols-2 w-full px-[18px] pb-[142px]"
          style={{ gap: "16px", marginTop: "12px" }}
        >
          {/* Create new stamp card — always first */}
          <StampCard id="create-new" isEmpty onClick={handleCreateNew} />

          {/* Existing stamps */}
          {stamps.map((stamp) => (
            <StampCard
              key={stamp.id}
              id={stamp.id}
              isEmpty={false}
              imageUrl={stamp.imageUrl}
              localOnly={stamp.localOnly}
              onClick={() => handleStampTap(stamp)}
            />
          ))}
        </div>

        {/* Fixed Share Button */}
        <ShareButton onClick={handleShare} />
      </div>

      {/* Share Bottom Sheet (for authenticated users) */}
      <ShareBottomSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        stamps={stamps}
        publicUrl={publicUrl}
      />

      {/* Registration Modal (for unauthenticated share attempt) */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleRegistrationClose}
        onAuthenticated={handleAuthenticated}
      />

      {/* Fullscreen Gallery */}
      <StampGallery
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        stamps={stamps}
        initialIndex={galleryIndex}
      />
    </div>
  );
}
