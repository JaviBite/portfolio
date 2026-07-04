"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { DemoFrame, MediaPlaceholder } from "./DemoFrame";
import type { DemoBaseProps, DemoFit, DemoMedia } from "./types";

interface SlideshowProps extends DemoBaseProps {
  /** Ordered slides. Each may point to a real asset or fall back to a labelled placeholder. */
  images?: DemoMedia[];
  badge?: string;
  /** "cover" crops each slide to fill the panel; "contain" fits the whole image. Default "cover". */
  fit?: DemoFit;
  /** Auto-advance interval in ms. Default 2800. */
  interval?: number;
  /** Icon shown by the placeholder for slides without a real asset. */
  placeholderIcon?: string;
}

/**
 * Generic cross-fading slideshow used inside a bento demo cell. Slides are stacked
 * and cross-faded; dot controls let the visitor jump between them and pause the
 * auto-advance. Renders a labelled placeholder per slide until real screenshots are
 * dropped in, so the layout (and the cycling) works today.
 *
 * Reduced motion (and the visual tests) freeze on the first slide with no timer,
 * so screenshots stay deterministic.
 */
export function Slideshow({
  images = [],
  accent = "var(--accent-cyan)",
  badge,
  fit = "cover",
  interval = 2800,
  placeholderIcon = "image",
}: SlideshowProps) {
  const slides = images.length > 0 ? images : [{}];
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // A manual jump briefly suspends the auto-advance so the chosen slide lingers.
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = (i: number) => (i + slides.length) % slides.length;

  useEffect(() => {
    if (reduce || paused || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => clamp(i + 1)), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, paused, slides.length, interval]);

  useEffect(() => () => {
    if (holdRef.current) clearTimeout(holdRef.current);
  }, []);

  const goTo = (i: number) => {
    setIndex(clamp(i));
    setPaused(true);
    if (holdRef.current) clearTimeout(holdRef.current);
    // Resume the loop after a beat so a click doesn't stop it forever.
    holdRef.current = setTimeout(() => setPaused(false), interval * 2);
  };

  return (
    <DemoFrame accent={accent} badge={badge}>
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={i}
            aria-hidden={!active}
            style={{
              position: "absolute",
              inset: 0,
              opacity: active ? 1 : 0,
              transition: reduce ? "none" : "opacity 0.6s ease",
              pointerEvents: "none",
            }}
          >
            {slide.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.src}
                alt={slide.alt ?? slide.label ?? ""}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit }}
              />
            ) : (
              <MediaPlaceholder label={slide.label} accent={accent} icon={placeholderIcon} />
            )}
          </div>
        );
      })}

      {slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            zIndex: 3,
            display: "flex",
            justifyContent: "center",
            gap: 7,
          }}
        >
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                aria-current={active}
                style={{
                  width: active ? 18 : 7,
                  height: 7,
                  padding: 0,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: active ? accent : "rgba(255,255,255,0.45)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                  transition: "width 0.35s ease, background-color 0.35s ease",
                }}
              />
            );
          })}
        </div>
      )}
    </DemoFrame>
  );
}
