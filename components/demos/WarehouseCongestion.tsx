"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import sceneData from "./wurth-scene.json";
import type { DemoBaseProps, WarehouseScene } from "./types";

const scene = sceneData as WarehouseScene;

/** Jam / alert colour for stopped objects and over-capacity zones. */
const RED = "#ef4444";
/** ROI border colour — matches the green box drawn by the real algorithm. */
const GREEN = "#22c55e";
/** Auto-advance between scenes every N ms (paused on hover / off-screen). */
const CYCLE_MS = 5000;

type SceneKey = "yard" | "conveyor";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Map a box given in % of the source frame to pixel coordinates over an
 * `object-fit: cover` image, so overlays stay pinned to image content at any
 * container aspect ratio (cover crops the frame, so plain container-% drifts).
 */
function coverRect(b: Rect, cw: number, ch: number, iw: number, ih: number) {
  const scale = Math.max(cw / iw, ch / ih);
  const dispW = iw * scale;
  const dispH = ih * scale;
  const offX = (cw - dispW) / 2;
  const offY = (ch - dispH) / 2;
  return {
    left: offX + (b.x / 100) * dispW,
    top: offY + (b.y / 100) * dispH,
    width: (b.w / 100) * dispW,
    height: (b.h / 100) * dispH,
  };
}

/** Keep `setNat`-style updates referentially stable so a ref callback can't loop. */
type Size = { w: number; h: number };
const sameSize = (prev: Size, w: number, h: number) =>
  prev.w === w && prev.h === h ? prev : { w, h };

interface WarehouseCongestionProps extends DemoBaseProps {
  badge?: string;
}

/**
 * Würth logistics demo. Two scenes share one card and cross-fade on a timer
 * (paused while the cursor is over the demo, or when it's off-screen):
 *  - "Capacidad" (yard): the outbound-staging frame with the SAM free-space mask
 *    wiped in + the real algorithm score counting up on reveal.
 *  - "Atasco" (conveyor): the roller-conveyor frame with the stationary tote
 *    flagged by a red "ATASCO" box.
 * Both layers stay mounted (so the cross-fade is seamless); overlays are mapped
 * onto the cover-cropped image so they track content at any aspect ratio.
 */
export function WarehouseCongestion({ accent = "var(--accent-cyan)", badge }: WarehouseCongestionProps) {
  const [active, setActive] = useState<SceneKey>("yard");
  const [inView, setInView] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [natYard, setNatYard] = useState<Size>({ w: 0, h: 0 });
  const [natConveyor, setNatConveyor] = useState<Size>({ w: 0, h: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const inViewRef = useRef(false);

  const { conveyor, yard } = scene;
  const revealed = active === "yard" && inView;
  const boxesOn = active === "conveyor" && inView;

  // Reveal trigger: observe the card so the ROI / boxes animate in when it scrolls
  // into view (and re-animate each time a scene becomes active).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        inViewRef.current = e.isIntersecting;
        setInView(e.isIntersecting);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Track the container size so overlays follow the cover-cropped image.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-advance between scenes; skip while hovered or off-screen.
  useEffect(() => {
    const id = setInterval(() => {
      if (!inViewRef.current || hoveredRef.current) return;
      setActive((a) => (a === "yard" ? "conveyor" : "yard"));
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Count the real score (0.443621 → 44%) up from zero on reveal; reset so it
  // replays every time the "Capacidad" scene comes back round.
  useEffect(() => {
    if (!revealed) {
      setDisplayScore(0);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const dur = 1100;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(yard.score * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, yard.score]);

  const mappedYard = size.w > 0 && natYard.w > 0;
  const mappedConveyor = size.w > 0 && natConveyor.w > 0;

  const layerStyle = (on: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    opacity: on ? 1 : 0,
    pointerEvents: on ? "auto" : "none",
    transition: "opacity 0.6s ease",
  });

  return (
    <DemoFrame accent={accent} badge={badge}>
      <div
        ref={rootRef}
        onMouseEnter={() => (hoveredRef.current = true)}
        onMouseLeave={() => (hoveredRef.current = false)}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* ===== Capacidad (yard) ===== */}
        <div style={layerStyle(active === "yard")}>
          <SceneImage src={yard.src} label={yard.label} accent={accent} onNatural={(w, h) => setNatYard((p) => sameSize(p, w, h))} />

          {/* Full-frame SAM mask; wiped in left→right on reveal. */}
          {yard.mask && (
            <img
              src={yard.mask}
              alt=""
              aria-hidden
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                clipPath: revealed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: "clip-path 1s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          )}

          {/* Green ROI bounding box around the measured area. */}
          {mappedYard &&
            (() => {
              const r = coverRect(yard.roi, size.w, size.h, natYard.w, natYard.h);
              return (
                <div
                  style={{
                    position: "absolute",
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                    border: `3px solid ${GREEN}`,
                    borderRadius: 2,
                    opacity: revealed ? 1 : 0,
                    transition: "opacity 0.5s ease 0.25s",
                    pointerEvents: "none",
                  }}
                />
              );
            })()}

          {/* Score readout. */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              zIndex: 4,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "8px 11px",
              borderRadius: 3,
              minWidth: 116,
              backgroundColor: "rgba(0,0,0,0.55)",
              border: `1px solid ${GREEN}`,
              backdropFilter: "blur(4px)",
              color: "#fff",
            }}
          >
            <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: GREEN }}>
                {Math.round(displayScore * 100)}%
              </span>
              <span style={{ fontSize: 9, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85 }}>
                {yard.scoreLabel}
              </span>
            </span>
            <span style={{ position: "relative", height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" }}>
              <span style={{ position: "absolute", inset: 0, width: `${displayScore * 100}%`, borderRadius: 2, backgroundColor: GREEN }} />
            </span>
          </div>

          <SceneCaption text="Medición de espacio libre · ROI" />
        </div>

        {/* ===== Atasco (conveyor) ===== */}
        <div style={layerStyle(active === "conveyor")}>
          <SceneImage src={conveyor.src} label={conveyor.label} accent={accent} onNatural={(w, h) => setNatConveyor((p) => sameSize(p, w, h))} />

          {mappedConveyor &&
            conveyor.boxes.map((b, i) => {
              const isStop = b.state === "stop";
              const c = isStop ? RED : accent;
              const r = coverRect(b, size.w, size.h, natConveyor.w, natConveyor.h);
              return (
                <div
                  key={b.id}
                  style={{
                    position: "absolute",
                    left: r.left,
                    top: r.top,
                    width: r.width,
                    height: r.height,
                    border: `2px solid ${c}`,
                    borderRadius: 2,
                    backgroundColor: isStop ? "rgba(239,68,68,0.12)" : "transparent",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                    opacity: boxesOn ? 1 : 0,
                    transform: boxesOn ? "scale(1)" : "scale(0.92)",
                    transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.4,0.64,1)",
                    transitionDelay: `${i * 110}ms`,
                    animation: isStop && boxesOn ? "wurth-alert 1.6s ease-in-out infinite" : undefined,
                    pointerEvents: "none",
                  }}
                >
                  {b.label && (
                    <span
                      style={{
                        position: "absolute",
                        top: -17,
                        left: -2,
                        padding: "1px 6px",
                        fontSize: 9,
                        fontWeight: 700,
                        fontFamily: "var(--font-geist-mono)",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        color: isStop ? "#fff" : "#0b0b0b",
                        backgroundColor: c,
                      }}
                    >
                      {b.label}
                    </span>
                  )}
                </div>
              );
            })}

          <SceneCaption text="Background subtraction · estacionario → atasco" />
        </div>

        {/* ===== Scene toggle (shared) ===== */}
        <div
          role="tablist"
          aria-label="Escena de la demo"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 5,
            display: "flex",
            gap: 4,
            padding: 3,
            borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(4px)",
          }}
        >
          {([
            { key: "yard", label: "Capacidad" },
            { key: "conveyor", label: "Atasco" },
          ] as const).map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(t.key)}
                style={{
                  padding: "4px 9px",
                  borderRadius: 2,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-geist-mono)",
                  color: on ? "#0b0b0b" : "rgba(255,255,255,0.78)",
                  backgroundColor: on ? accent : "transparent",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </DemoFrame>
  );
}

function SceneCaption({ text }: { text: string }) {
  return (
    <span
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        zIndex: 4,
        maxWidth: "55%",
        textAlign: "right",
        fontSize: 9,
        fontFamily: "var(--font-geist-mono)",
        letterSpacing: "0.05em",
        lineHeight: 1.3,
        color: "rgba(255,255,255,0.82)",
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        pointerEvents: "none",
      }}
    >
      {text}
    </span>
  );
}

function SceneImage({
  src,
  label,
  accent,
  onNatural,
}: {
  src?: string;
  label?: string;
  accent: string;
  onNatural?: (w: number, h: number) => void;
}) {
  const [err, setErr] = useState(false);
  const report = (img: HTMLImageElement | null) => {
    if (img && img.naturalWidth) onNatural?.(img.naturalWidth, img.naturalHeight);
  };
  return (
    <>
      {(!src || err) && <MediaPlaceholder label={label} accent={accent} icon="warehouse" />}
      {src && !err && (
        <img
          src={src}
          alt={label ?? ""}
          draggable={false}
          ref={(el) => {
            if (el && el.complete) report(el);
          }}
          onLoad={(e) => report(e.currentTarget)}
          onError={() => setErr(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </>
  );
}
