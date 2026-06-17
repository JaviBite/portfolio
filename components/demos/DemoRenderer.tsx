"use client";

import type { ReactNode } from "react";
import { CompareSlider } from "./CompareSlider";
import { HotspotImage } from "./HotspotImage";
import { MultiCamTracking } from "./MultiCamTracking";
import { VideoPanel } from "./VideoPanel";
import type { Homography } from "./types";

/** Minimal shape the renderer needs from a project. */
interface ProjectLike {
  id: string;
  matrices?: Record<string, Homography>;
}

/**
 * Maps a demo id (from data.json `demos[]`) to a concrete demo component.
 * Each entry receives the owning project and the card accent color and returns
 * the element to render. Unknown ids return null so the card can fall back to
 * its chip list.
 */
const REGISTRY: Record<string, (project: ProjectLike, accent: string) => ReactNode> = {
  // ── Concrete demos ──────────────────────────────────────────────
  "multicam-homography": (project, accent) => (
    <MultiCamTracking matrices={project.matrices} accent={accent} />
  ),

  // ── Generic before/after sliders ────────────────────────────────
  "congestion-overlay": (_p, accent) => (
    <CompareSlider
      accent={accent}
      badge="raw / detección"
      before={{ label: "Raw feed" }}
      after={{ label: "Congestion mask" }}
      caption="Wipe para comparar el feed con la máscara de congestión"
    />
  ),
  "capacity-slider": (_p, accent) => (
    <CompareSlider
      accent={accent}
      badge="vacío / lleno"
      before={{ label: "Zona vacía" }}
      after={{ label: "Zona al 80%" }}
      caption="Ocupación estimada por zona de almacén"
    />
  ),
  "heatmap-slider": (_p, accent) => (
    <CompareSlider
      accent={accent}
      badge="t0 / t1"
      before={{ label: "Imagen aérea t0" }}
      after={{ label: "Heatmap de cambios" }}
      caption="Detección de cambios urbanos por similitud de embeddings"
    />
  ),
  "saliency-slider": (_p, accent) => (
    <CompareSlider
      accent={accent}
      badge="original / crop"
      before={{ label: "Frame 16:9" }}
      after={{ label: "Saliency + crop 9:16" }}
      caption="Reencuadre automático guiado por saliency"
    />
  ),
};

export function DemoRenderer({
  demoId,
  project,
  accent = "var(--accent-cyan)",
}: {
  demoId: string;
  project: ProjectLike;
  accent?: string;
}): ReactNode {
  const render = REGISTRY[demoId];
  return render ? render(project, accent) : null;
}

/** Whether a demo id has a concrete renderer registered. */
export function hasDemo(demoId: string): boolean {
  return demoId in REGISTRY;
}

// Re-export generics so demos/index stays the single import surface.
export { CompareSlider, VideoPanel, HotspotImage, MultiCamTracking };
