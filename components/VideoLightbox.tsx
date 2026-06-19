"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

interface VideoLightboxProps {
  /** YouTube video id. */
  youtubeId: string;
  title?: string;
  onClose: () => void;
}

/**
 * Full-screen modal that plays a YouTube video on top of the page. Portalled to
 * <body> so card `overflow:hidden` / `transform` can't clip or mis-position it.
 * Closes on Escape, backdrop click or the close button; locks body scroll while
 * open.
 */
export function VideoLightbox({ youtubeId, title, onClose }: VideoLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Vídeo"}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(960px, 92vw)",
          aspectRatio: "16 / 9",
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          backgroundColor: "#000",
        }}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title ?? "Vídeo"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar vídeo"
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.3)",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <Icon name="close" size={22} />
      </button>
    </div>,
    document.body,
  );
}
