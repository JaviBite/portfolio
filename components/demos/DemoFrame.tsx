"use client";

import type { CSSProperties, ReactNode } from "react";

interface DemoFrameProps {
  children: ReactNode;
  /** Accent color inherited from the card. */
  accent?: string;
  /** Tiny monospace label shown top-left (e.g. "LIVE", "BEFORE / AFTER"). */
  badge?: string;
  /** Caption rendered below the frame. */
  caption?: string;
  /** Aspect ratio of the media area, e.g. "16 / 9". Default "16 / 10". */
  ratio?: string;
  style?: CSSProperties;
}

/**
 * Shared chrome for every demo: a bordered, rounded media area with an optional
 * corner badge and a caption underneath. Keeps all demos visually consistent
 * with the bento cards regardless of what they render inside.
 */
export function DemoFrame({
  children,
  accent = "var(--accent-cyan)",
  badge,
  caption,
  ratio = "16 / 10",
  style,
}: DemoFrameProps) {
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, ...style }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: ratio,
          borderRadius: 4,
          overflow: "hidden",
          border: "2px solid var(--surface-card-border)",
          backgroundColor: "var(--bg-secondary)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        {children}

        {badge && (
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 3,
              padding: "3px 8px",
              borderRadius: 2,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              fontFamily: "var(--font-geist-mono)",
              textTransform: "uppercase",
              color: accent,
              backgroundColor: "rgba(0,0,0,0.45)",
              border: `1px solid ${accent}`,
              backdropFilter: "blur(4px)",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {caption && (
        <figcaption
          style={{
            fontSize: 12,
            fontFamily: "var(--font-geist-mono)",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * A labelled gradient placeholder used whenever a demo has no real asset yet,
 * so the layout renders today and assets can be dropped in later.
 */
export function MediaPlaceholder({
  label,
  accent = "var(--accent-cyan)",
  icon = "image",
}: {
  label?: string;
  accent?: string;
  icon?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundImage: `
          linear-gradient(135deg, ${accent}14 0%, transparent 60%),
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 24px 24px, 24px 24px",
        color: "var(--text-muted)",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 28, color: accent, opacity: 0.7 }}>
        {icon}
      </span>
      {label && (
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
