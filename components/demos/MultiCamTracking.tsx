"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { DemoFrame } from "./DemoFrame";
import type { DemoBaseProps, Homography, MulticamScene, SceneCamera } from "./types";
import sceneData from "./multicam-scene.json";

/**
 * Interactive multi-camera tracking via a real planar homography.
 *
 * The scene (a fictional parking lot) is rendered offline from cameras of known
 * pose by scripts/demo-assets/multicam, so each camera's ground→image homography
 * `H` (and its inverse) is exact. The viewer drags a single ground point in ANY
 * view; the SAME homography places it in every other view — exactly the
 * technique behind the real Stellantis multi-camera tracking (per-camera views →
 * one unified 2D world plane). Day/night backgrounds swap with the theme; the
 * matrices are shared.
 */
const scene = sceneData as unknown as MulticamScene;

/** Apply a 3x3 homography to a point. */
function applyH(H: Homography, x: number, y: number): [number, number] {
  const d = H[2][0] * x + H[2][1] * y + H[2][2] || 1;
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / d, (H[1][0] * x + H[1][1] * y + H[1][2]) / d];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

interface MultiCamTrackingProps extends DemoBaseProps {
  badge?: string;
}

export function MultiCamTracking({ accent = "var(--accent-cyan)", badge, caption }: MultiCamTrackingProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // World-plane point in [0,1]² — the single source of truth shared by all views.
  const [pt, setPt] = useState({ x: 0.5, y: 0.56 });
  // The hint disappears for good the moment the viewer drives the point.
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mount we render the light asset (the SSR default) to avoid a hydration
  // mismatch on the <img src>, then swap once the theme is known.
  const bgKey: "light" | "dark" = mounted && resolvedTheme === "dark" ? "dark" : "light";

  const obliques = scene.cameras.filter((c) => c.kind !== "ortho");
  const top = scene.cameras.find((c) => c.kind === "ortho");
  const markInteracted = () => setInteracted(true);

  const nudge = (dx: number, dy: number) => {
    markInteracted();
    setPt((p) => ({ x: clamp01(p.x + dx), y: clamp01(p.y + dy) }));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.025;
    if (e.key === "ArrowLeft") { nudge(-step, 0); e.preventDefault(); }
    else if (e.key === "ArrowRight") { nudge(step, 0); e.preventDefault(); }
    else if (e.key === "ArrowUp") { nudge(0, -step); e.preventDefault(); }
    else if (e.key === "ArrowDown") { nudge(0, step); e.preventDefault(); }
  };

  return (
    <DemoFrame accent={accent} badge={badge}>
      <div
        role="group"
        aria-label="Tracking multicámara: arrastra el punto en cualquier vista para reproyectarlo en las demás"
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gridTemplateRows: "minmax(0, 42fr) minmax(0, 58fr)",
          gap: 2,
          // The 2px gaps reveal this accent background as interior dividers; the
          // panels run edge to edge so no card background ever shows through.
          backgroundColor: accent,
          overflow: "hidden",
          outline: "none",
        }}
      >
        {obliques.map((cam, i) => (
          <Panel key={cam.id} cam={cam} pt={pt} setPt={setPt} accent={accent} bgKey={bgKey} label={`CAM ${String.fromCharCode(65 + i)}`} onInteract={markInteracted} />
        ))}

        {top && <Panel cam={top} pt={pt} setPt={setPt} accent={accent} bgKey={bgKey} label="2D · plano unificado" onInteract={markInteracted} wide />}

        {/* One-time hint, styled like a tooltip; fades out the moment the viewer interacts. */}
        <div
          role="status"
          aria-hidden={interacted}
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            borderRadius: 999,
            fontSize: 11,
            fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.03em",
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            opacity: interacted ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            open_with
          </span>
          {caption ?? "Arrastra el punto en cualquier vista"}
        </div>
      </div>
    </DemoFrame>
  );
}

function Panel({
  cam,
  pt,
  setPt,
  accent,
  bgKey,
  label,
  onInteract,
  wide = false,
}: {
  cam: SceneCamera;
  pt: { x: number; y: number };
  setPt: (p: { x: number; y: number }) => void;
  accent: string;
  bgKey: "light" | "dark";
  label: string;
  onInteract: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClient = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Client → image pixels → world plane via this camera's inverse homography.
    const u = ((clientX - r.left) / r.width) * cam.imgW;
    const v = ((clientY - r.top) / r.height) * cam.imgH;
    const [wx, wy] = applyH(cam.Hinv, u, v);
    setPt({ x: clamp01(wx), y: clamp01(wy) });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    onInteract();
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClient(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromClient(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  // Place the shared world point in THIS view via the forward homography.
  const [u, v] = applyH(cam.H, pt.x, pt.y);
  const leftPct = (u / cam.imgW) * 100;
  const topPct = (v / cam.imgH) * 100;
  const inView = leftPct >= -1 && leftPct <= 101 && topPct >= -1 && topPct <= 101;

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        gridColumn: wide ? "1 / 3" : "auto",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        cursor: "crosshair",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <img
        src={cam.bg[bgKey]}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }}
      />

      {inView && <Marker leftPct={leftPct} topPct={topPct} accent={accent} />}

      <span style={cornerBadge(accent)}>{label}</span>

      {!inView && (
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "2px 7px",
            borderRadius: 2,
            fontSize: 9,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-geist-mono)",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          fuera de campo
        </span>
      )}
    </div>
  );
}

function Marker({ leftPct, topPct, accent }: { leftPct: number; topPct: number; accent: string }) {
  return (
    <div style={{ position: "absolute", left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 3 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid #fff",
          backgroundColor: accent,
          boxShadow: `0 0 0 2px ${accent}, 0 0 10px ${accent}, 0 1px 4px rgba(0,0,0,0.5)`,
        }}
      />
    </div>
  );
}

function cornerBadge(color: string): React.CSSProperties {
  return {
    position: "absolute",
    // Bottom-left so it never collides with the DemoFrame badge (always top-left).
    bottom: 7,
    left: 7,
    padding: "2px 6px",
    borderRadius: 2,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    fontFamily: "var(--font-geist-mono)",
    textTransform: "uppercase",
    color,
    backgroundColor: "rgba(0,0,0,0.5)",
  };
}
