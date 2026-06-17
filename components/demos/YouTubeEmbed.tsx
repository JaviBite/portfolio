"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoFit } from "./types";

interface YouTubeEmbedProps extends DemoBaseProps {
  /** YouTube video id (the part after `v=`). Empty → placeholder. */
  videoId?: string;
  /** Accessible title for the iframe. */
  title?: string;
  badge?: string;
  /** "cover" crops to fill the panel (no bands); "contain" fits the 16:9 video. */
  fit?: DemoFit;
}

const ASPECT = 16 / 9;

/**
 * Lite YouTube facade: shows the thumbnail with a play button and only mounts
 * the (privacy-enhanced, no-cookie) iframe after the first click, so the page
 * stays light until the user actually wants the video.
 *
 * An iframe can't use object-fit, so for "cover" we measure the panel and size
 * the iframe (kept at 16:9) to overflow and clip — robust across browsers.
 */
export function YouTubeEmbed({
  videoId,
  title = "YouTube",
  accent = "var(--accent-cyan)",
  badge = "youtube",
  fit = "cover",
}: YouTubeEmbedProps) {
  const [active, setActive] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || fit !== "cover") return;
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;
      setBox(cw / ch > ASPECT ? { w: cw, h: cw / ASPECT } : { w: ch * ASPECT, h: ch });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  if (!videoId) {
    return (
      <DemoFrame accent={accent} badge={badge}>
        <MediaPlaceholder label="Añadir ID de YouTube" accent={accent} icon="smart_display" />
      </DemoFrame>
    );
  }

  const coverStyle: React.CSSProperties =
    fit === "cover"
      ? {
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: box ? box.w : "100%",
          height: box ? box.h : "100%",
          border: "none",
        }
      : { position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" };

  return (
    <DemoFrame accent={accent} badge={badge}>
      <div ref={wrapRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {active ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={coverStyle}
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            aria-label={`Reproducir ${title}`}
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              padding: 0,
              cursor: "pointer",
              backgroundColor: "#0e1216",
            }}
          >
            {/* maxresdefault is 16:9 (no black bands); fall back to mqdefault (also
                16:9, always available) if the high-res frame doesn't exist. */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title}
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = "1";
                  img.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
                }
              }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, display: "block" }}
            />
            <span style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)" }} />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 60,
                height: 42,
                borderRadius: 10,
                backgroundColor: "#ff0000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 30, color: "#fff" }}>
                play_arrow
              </span>
            </span>
          </button>
        )}
      </div>
    </DemoFrame>
  );
}
