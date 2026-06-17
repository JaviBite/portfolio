"use client";

import { useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoMedia } from "./types";

export interface Hotspot {
  /** Position as percentages of the frame. */
  x: number;
  y: number;
  /** Short title shown in the tooltip. */
  label: string;
  /** Optional longer detail. */
  detail?: string;
}

interface HotspotImageProps extends DemoBaseProps {
  image: DemoMedia;
  hotspots: Hotspot[];
  badge?: string;
  ratio?: string;
}

/**
 * Generic annotated image: drops numbered markers over a still and reveals a
 * tooltip on hover/focus. Good for calling out detections, regions of interest
 * or pipeline outputs on a single frame.
 */
export function HotspotImage({
  image,
  hotspots,
  accent = "var(--accent-cyan)",
  badge = "detections",
  caption,
  ratio,
}: HotspotImageProps) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <DemoFrame accent={accent} badge={badge} caption={caption} ratio={ratio}>
      {image.src ? (
        <img
          src={image.src}
          alt={image.alt ?? image.label ?? ""}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <MediaPlaceholder label={image.label} accent={accent} icon="scatter_plot" />
      )}

      {hotspots.map((h, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
          onFocus={() => setActive(i)}
          onBlur={() => setActive((cur) => (cur === i ? null : cur))}
          aria-label={h.label}
          style={{
            position: "absolute",
            left: `${h.x}%`,
            top: `${h.y}%`,
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            backgroundColor: active === i ? accent : "rgba(0,0,0,0.5)",
            color: active === i ? "#0b0b0b" : accent,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-geist-mono)",
            cursor: "pointer",
            zIndex: active === i ? 5 : 3,
            boxShadow: `0 0 0 4px ${accent}22`,
            transition: "background-color 0.15s ease, color 0.15s ease",
          }}
        >
          {i + 1}
          {active === i && (
            <span
              style={{
                position: "absolute",
                bottom: "130%",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                maxWidth: 220,
                padding: "6px 10px",
                borderRadius: 4,
                backgroundColor: "rgba(0,0,0,0.82)",
                color: "#fff",
                textAlign: "left",
                pointerEvents: "none",
              }}
            >
              <span style={{ display: "block", fontSize: 11, fontWeight: 700 }}>{h.label}</span>
              {h.detail && (
                <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.7)", whiteSpace: "normal" }}>
                  {h.detail}
                </span>
              )}
            </span>
          )}
        </button>
      ))}
    </DemoFrame>
  );
}
