"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoBaseProps, Homography } from "./types";

interface MultiCamTrackingProps extends DemoBaseProps {
  /** Per-camera homography matrices (world → camera image). Keyed by camera id. */
  matrices?: Record<string, Homography>;
}

/** A tracked target moving across the shared world plane (coords in [0,1]). */
interface Target {
  id: string;
  lane: number; // 0..1 vertical position of the lane
  phase: number; // 0..1 starting offset along the lane
  speed: number; // laps per second
  color: string;
}

const DEFAULT_MATRICES: Record<string, Homography> = {
  cam_a: [
    [1.2, 0.2, 100],
    [0.1, 1.1, 50],
    [0, 0, 1],
  ],
  cam_b: [
    [0.9, -0.1, 200],
    [0.05, 1, 30],
    [0, 0, 1],
  ],
};

// Deterministic targets (no Math.random → stable across SSR/CSR).
const TARGETS: Target[] = [
  { id: "V-01", lane: 0.22, phase: 0.0, speed: 0.12, color: "#4bc4d9" },
  { id: "V-02", lane: 0.5, phase: 0.35, speed: 0.16, color: "#c578c6" },
  { id: "V-03", lane: 0.78, phase: 0.6, speed: 0.1, color: "#f59e0b" },
  { id: "V-04", lane: 0.5, phase: 0.82, speed: 0.16, color: "#22c55e" },
];

/** Apply a 3x3 homography to a point. */
function applyH(H: Homography, x: number, y: number): [number, number] {
  const d = H[2][0] * x + H[2][1] * y + H[2][2] || 1;
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / d, (H[1][0] * x + H[1][1] * y + H[1][2]) / d];
}

/**
 * Project a world point [0,1]² into a camera viewport [0,1]² by warping with the
 * camera's homography and normalising to the projected image bounds, so any
 * matrix fits the preview while still skewing the view per camera.
 */
function projectToView(H: Homography, x: number, y: number): [number, number] {
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([cx, cy]) => applyH(H, cx, cy));
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const [px, py] = applyH(H, x, y);
  return [(px - minX) / (maxX - minX || 1), (py - minY) / (maxY - minY || 1)];
}

/** World x for a target at time t (wraps 0→1). */
function worldX(target: Target, t: number): number {
  return (target.phase + target.speed * t) % 1;
}

export function MultiCamTracking({
  matrices = DEFAULT_MATRICES,
  accent = "var(--accent-cyan)",
  caption,
}: MultiCamTrackingProps) {
  const [t, setT] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // a static, representative frame (deferred to avoid sync setState in effect)
      const id = requestAnimationFrame(() => setT(2.5));
      return () => cancelAnimationFrame(id);
    }
    const loop = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      setT((now - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const camIds = Object.keys(matrices).slice(0, 2);

  return (
    <figure
      style={{
        margin: 0,
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 10,
        padding: 16,
        overflow: "hidden",
      }}
    >
      {/* Camera viewports */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {camIds.map((id, idx) => (
          <CameraView key={id} id={id} H={matrices[id]} t={t} accent={accent} label={`CAM ${String.fromCharCode(65 + idx)}`} />
        ))}
      </div>

      {/* Unified top-down map */}
      <FloorPlan t={t} accent={accent} />

      <figcaption style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", lineHeight: 1.5 }}>
        {caption ?? "2 cámaras → proyección a plano 2D unificado mediante homografía"}
      </figcaption>
    </figure>
  );
}

function CameraView({ id, H, t, accent, label }: { id: string; H: Homography; t: number; accent: string; label: string }) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "4 / 3",
        borderRadius: 4,
        overflow: "hidden",
        border: "2px solid var(--surface-card-border)",
        backgroundColor: "#0e1216",
      }}
    >
      <svg viewBox="0 0 100 75" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* perspective floor grid */}
        {Array.from({ length: 6 }).map((_, i) => {
          const u = i / 5;
          const [, ay] = projectToView(H, u, 0);
          const [, by] = projectToView(H, u, 1);
          const [ax] = projectToView(H, u, 0);
          const [bx] = projectToView(H, u, 1);
          return <line key={`v${i}`} x1={ax * 100} y1={ay * 75} x2={bx * 100} y2={by * 75} stroke="rgba(255,255,255,0.07)" strokeWidth={0.4} />;
        })}
        {Array.from({ length: 4 }).map((_, i) => {
          const v = i / 3;
          const [ax, ay] = projectToView(H, 0, v);
          const [bx, by] = projectToView(H, 1, v);
          return <line key={`h${i}`} x1={ax * 100} y1={ay * 75} x2={bx * 100} y2={by * 75} stroke="rgba(255,255,255,0.07)" strokeWidth={0.4} />;
        })}

        {/* tracked targets as bounding boxes */}
        {TARGETS.map((tg) => {
          const wx = worldX(tg, t);
          const [vx, vy] = projectToView(H, wx, tg.lane);
          const cx = vx * 100;
          const cy = vy * 75;
          return (
            <g key={tg.id}>
              <rect x={cx - 6} y={cy - 5} width={12} height={10} fill="none" stroke={tg.color} strokeWidth={0.8} />
              <rect x={cx - 6} y={cy - 9} width={12} height={3.4} fill={tg.color} opacity={0.9} />
              <text x={cx} y={cy - 6.4} fontSize={2.6} textAnchor="middle" fill="#0b0b0b" fontFamily="monospace">
                {tg.id}
              </text>
            </g>
          );
        })}
      </svg>

      <span style={cornerBadge(accent, "left")}>{label}</span>
      <span style={{ ...cornerBadge("rgba(255,255,255,0.6)", "right"), border: "none", color: "rgba(255,255,255,0.6)" }}>{id}</span>
    </div>
  );
}

function FloorPlan({ t, accent }: { t: number; accent: string }) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: 4,
        overflow: "hidden",
        border: `2px solid ${accent}`,
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <svg viewBox="0 0 160 90" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* floor grid */}
        {Array.from({ length: 17 }).map((_, i) => (
          <line key={`gx${i}`} x1={i * 10} y1={0} x2={i * 10} y2={90} stroke="var(--grid-line)" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`gy${i}`} x1={0} y1={i * 10} x2={160} y2={i * 10} stroke="var(--grid-line)" strokeWidth={0.5} />
        ))}

        {/* assembly lanes */}
        {[0.22, 0.5, 0.78].map((lane, i) => (
          <line key={i} x1={0} y1={lane * 90} x2={160} y2={lane * 90} stroke={accent} strokeWidth={0.4} strokeDasharray="3 3" opacity={0.35} />
        ))}

        {/* tracked targets + trails */}
        {TARGETS.map((tg) => {
          const wx = worldX(tg, t);
          const cx = wx * 160;
          const cy = tg.lane * 90;
          const trail = Array.from({ length: 6 }).map((_, k) => ((wx - k * 0.02 + 1) % 1) * 160);
          return (
            <g key={tg.id}>
              {trail.map((tx, k) => (
                <circle key={k} cx={tx} cy={cy} r={2.4 - k * 0.32} fill={tg.color} opacity={0.18 - k * 0.025} />
              ))}
              <circle cx={cx} cy={cy} r={2.8} fill={tg.color} />
              <circle cx={cx} cy={cy} r={4.6} fill="none" stroke={tg.color} strokeWidth={0.5} opacity={0.5} />
              <text x={cx} y={cy - 5.5} fontSize={3} textAnchor="middle" fill="var(--text-secondary)" fontFamily="monospace">
                {tg.id}
              </text>
            </g>
          );
        })}
      </svg>

      <span style={cornerBadge(accent, "left")}>2D · world plane</span>
    </div>
  );
}

function cornerBadge(color: string, side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: 8,
    [side]: 8,
    padding: "2px 7px",
    borderRadius: 2,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.1em",
    fontFamily: "var(--font-geist-mono)",
    textTransform: "uppercase",
    color,
    backgroundColor: "rgba(0,0,0,0.5)",
    border: `1px solid ${color}`,
  };
}
