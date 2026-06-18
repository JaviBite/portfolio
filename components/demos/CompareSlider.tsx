"use client";

import { useCallback, useRef, useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoMedia } from "./types";

interface CompareSliderProps extends DemoBaseProps {
  /** Left / "before" layer (revealed on the left of the handle). */
  before: DemoMedia;
  /** Right / "after" layer (revealed on the right of the handle). */
  after: DemoMedia;
  /**
   * Optional "clean" version of the after layer (e.g. without the heatmap
   * overlay). When present, a toggle lets the viewer hide the overlay and
   * inspect the raw before/after change themselves.
   */
  afterClean?: DemoMedia;
  /** Label for the overlay toggle. Default "Ocultar heatmap". */
  toggleLabel?: string;
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
  afterClean,
  toggleLabel = "Ocultar heatmap",
  initial = 50,
  accent = "var(--accent-cyan)",
  badge = "before / after",
}: CompareSliderProps) {
  const [pos, setPos] = useState(initial);
  const [hideOverlay, setHideOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // When the overlay is hidden, the after layer shows its clean variant so the
  // viewer can inspect the raw before/after change without the heatmap.
  const activeAfter = hideOverlay && afterClean ? afterClean : after;

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
        {/* AFTER layer (full, underneath) — clean variant when the overlay is hidden */}
        <Layer media={activeAfter} accent={accent} cornerLabel={activeAfter.label} cornerSide="right" icon="auto_awesome" />

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

      {/* Overlay toggle: hide the heatmap to inspect the raw before/after. */}
      {afterClean && (
        <button
          type="button"
          onClick={() => setHideOverlay((v) => !v)}
          aria-pressed={hideOverlay}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 2,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            color: "#fff",
            cursor: "pointer",
            backgroundColor: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              border: `1.5px solid ${accent}`,
              backgroundColor: hideOverlay ? accent : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hideOverlay && (
              <span className="material-symbols-outlined" style={{ fontSize: 11, color: "#0b0b0b", fontWeight: 900 }}>
                check
              </span>
            )}
          </span>
          {/* Wrap to (up to) two lines so the pill stays narrow and clears the left badge. */}
          <span style={{ whiteSpace: "normal", maxWidth: 52, lineHeight: 1.05, textAlign: "left" }}>{toggleLabel}</span>
        </button>
      )}
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
