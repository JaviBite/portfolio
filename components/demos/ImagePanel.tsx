"use client";

import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoFit, DemoMedia } from "./types";

/** An optional rectangular overlay (e.g. a face bounding box), in % of frame. */
export interface DetectionBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

interface ImagePanelProps extends DemoBaseProps {
  image: DemoMedia;
  /** Optional detection boxes drawn over the image. */
  boxes?: DetectionBox[];
  badge?: string;
  /** "cover" crops to fill the panel (no bands); "contain" fits the whole image. */
  fit?: DemoFit;
  placeholderIcon?: string;
}

/**
 * Generic full-bleed still image with optional labelled detection boxes drawn on
 * top — used here for the facial-detection demo, but reusable for any annotated
 * frame. Shows a placeholder until the real image is dropped in.
 */
export function ImagePanel({
  image,
  boxes = [],
  accent = "var(--accent-cyan)",
  badge,
  fit = "cover",
  placeholderIcon = "image",
}: ImagePanelProps) {
  return (
    <DemoFrame accent={accent} badge={badge}>
      {image.src ? (
        <img
          src={image.src}
          alt={image.alt ?? image.label ?? ""}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit }}
        />
      ) : (
        <MediaPlaceholder label={image.label} accent={accent} icon={placeholderIcon} />
      )}

      {boxes.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.w}%`,
            height: `${b.h}%`,
            border: `2px solid ${accent}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.3)`,
            borderRadius: 2,
          }}
        >
          {b.label && (
            <span
              style={{
                position: "absolute",
                top: -18,
                left: -2,
                padding: "1px 6px",
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.06em",
                color: "#0b0b0b",
                backgroundColor: accent,
                whiteSpace: "nowrap",
              }}
            >
              {b.label}
            </span>
          )}
        </div>
      ))}
    </DemoFrame>
  );
}
