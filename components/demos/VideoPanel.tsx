"use client";

import { useRef, useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoFit, DemoMedia } from "./types";

interface VideoPanelProps extends DemoBaseProps {
  /** Video source under /public or a URL. */
  src?: string;
  /** Poster image shown before playback (and as the placeholder label source). */
  poster?: DemoMedia;
  /** Autoplay muted loop instead of click-to-play. Default false. */
  autoPlay?: boolean;
  badge?: string;
  /** "cover" crops to fill the panel (no bands); "contain" fits the whole frame. */
  fit?: DemoFit;
  /** CSS object-position for the media (e.g. "right" to keep the right edge when
   * `cover` crops horizontally). Default "center". */
  fitPosition?: string;
}

/**
 * Generic image→video panel: shows a poster frame with a play affordance and
 * swaps to an inline (muted, looping) video on click. When `autoPlay` is set it
 * behaves like an ambient looping clip. Renders a placeholder until a real clip
 * is wired in.
 */
export function VideoPanel({
  src,
  poster,
  autoPlay = false,
  accent = "var(--accent-cyan)",
  badge = "demo",
  fit = "cover",
  fitPosition = "center",
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);

  const play = () => {
    setPlaying(true);
    // Defer so the <video> is mounted before we call play().
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
  };

  return (
    <DemoFrame accent={accent} badge={badge}>
      {src && playing ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster?.src}
          muted
          loop
          playsInline
          autoPlay
          controls={!autoPlay}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: fitPosition }}
        />
      ) : (
        <>
          {poster?.src ? (
            <img
              src={poster.src}
              alt={poster.alt ?? poster.label ?? ""}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: fitPosition }}
            />
          ) : (
            <MediaPlaceholder label={poster?.label ?? "video"} accent={accent} icon="movie" />
          )}

          <button
            type="button"
            onClick={play}
            aria-label="Reproducir vídeo"
            disabled={!src}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: src ? "rgba(0,0,0,0.12)" : "transparent",
              cursor: src ? "pointer" : "default",
            }}
          >
            <span
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0b0b0b",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                opacity: src ? 1 : 0.4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                play_arrow
              </span>
            </span>
          </button>
        </>
      )}
    </DemoFrame>
  );
}
