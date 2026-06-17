"use client";

import type { CSSProperties, ReactNode } from "react";

interface DemoFrameProps {
  children: ReactNode;
  /** Accent color inherited from the card. */
  accent?: string;
  /** Tiny monospace label overlaid top-left (e.g. "LIVE", "BEFORE / AFTER"). */
  badge?: string;
  style?: CSSProperties;
}

/**
 * Full-bleed chrome for every demo: fills its (position:relative) parent
 * edge-to-edge with no border or radius — the owning card already clips and
 * rounds the corners. Optionally overlays a small corner badge.
 */
export function DemoFrame({ children, accent = "var(--accent-cyan)", badge, style }: DemoFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: "var(--bg-secondary)",
        ...style,
      }}
    >
      {children}

      {badge && (
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
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
