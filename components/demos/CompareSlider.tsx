"use client";

import { useCallback, useRef, useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoMedia } from "./types";

interface CompareSliderProps extends DemoBaseProps {
  /** Left / "before" layer (revealed on the left of the handle). */
  before: DemoMedia;
  /** Right / "after" layer (revealed on the right of the handle). */
  after: DemoMedia;
  /** Initial handle position as a percentage 0–100. Default 50. */
  initial?: number;
  badge?: string;
}

/**
 * Generic before/after comparison slider. Drag (or use the arrow keys) to wipe
 * between two images — ideal for raw-vs-processed overlays (heatmaps, saliency,
 * congestion masks, capacity fills). Falls back to labelled placeholders when an
 * image has no `src` yet.
 */
export function CompareSlider({
  before,
  after,
  initial = 50,
  accent = "var(--accent-cyan)",
  badge = "before / after",
}: CompareSliderProps) {
  const [pos, setPos] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
  };

  return (
    <DemoFrame accent={accent} badge={badge}>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="slider"
        aria-label="Comparar antes y después"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ position: "absolute", inset: 0, cursor: "ew-resize", touchAction: "none", userSelect: "none" }}
      >
        {/* AFTER layer (full, underneath) */}
        <Layer media={after} accent={accent} cornerLabel={after.label} cornerSide="right" icon="auto_awesome" />

        {/* BEFORE layer (clipped to the left of the handle) */}
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Layer media={before} accent={accent} cornerLabel={before.label} cornerSide="left" icon="image" />
        </div>

        {/* Handle */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, backgroundColor: accent, transform: "translateX(-1px)", pointerEvents: "none", zIndex: 4 }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              color: "#0b0b0b",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              drag_indicator
            </span>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

function Layer({
  media,
  accent,
  cornerLabel,
  cornerSide,
  icon,
}: {
  media: DemoMedia;
  accent: string;
  cornerLabel?: string;
  cornerSide: "left" | "right";
  icon: string;
}) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {media.src ? (
        <img
          src={media.src}
          alt={media.alt ?? media.label ?? ""}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <MediaPlaceholder label={media.label} accent={accent} icon={icon} />
      )}
      {cornerLabel && media.src && (
        <span
          style={{
            position: "absolute",
            bottom: 10,
            [cornerSide]: 10,
            padding: "2px 7px",
            borderRadius: 2,
            fontSize: 10,
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          {cornerLabel}
        </span>
      )}
    </div>
  );
}
