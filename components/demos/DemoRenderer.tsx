"use client";

import type { ReactNode } from "react";
import { CompareSlider } from "./CompareSlider";
import { ImagePanel, type DetectionBox } from "./ImagePanel";
import { MultiCamTracking } from "./MultiCamTracking";
import { NetworkGraph, type GraphEdge, type GraphNode } from "./NetworkGraph";
import { VideoPanel } from "./VideoPanel";
import { YouTubeEmbed } from "./YouTubeEmbed";
import type { DemoFit, DemoMedia } from "./types";

/**
 * Demo configuration, authored per-project in lib/data.json under `demo`.
 * `type` selects the component; `badge` is the configurable corner title; the
 * remaining fields are the asset/props for that component.
 */
export type DemoConfig =
  | { type: "youtube"; badge?: string; youtubeId?: string; title?: string; fit?: DemoFit }
  | { type: "video"; badge?: string; src?: string; poster?: DemoMedia; autoPlay?: boolean; fit?: DemoFit }
  | { type: "image"; badge?: string; image?: DemoMedia; boxes?: DetectionBox[]; placeholderIcon?: string; fit?: DemoFit }
  | { type: "compare"; badge?: string; before?: DemoMedia; after?: DemoMedia; afterClean?: DemoMedia; toggleLabel?: string; initial?: number }
  | { type: "network"; badge?: string; nodes?: GraphNode[]; edges?: GraphEdge[] }
  | { type: "multicam"; badge?: string };

/** Minimal shape the renderer needs from a project. */
interface ProjectLike {
  id: string;
  // Loose because JSON widens `type` to string; narrowed to DemoConfig inside.
  demo?: { type: string } & Record<string, unknown>;
}

/**
 * Renders a project's demo from its `demo` config in data.json. Returns null
 * when the project has no demo, so the card falls back to its chip list.
 */
export function DemoRenderer({
  project,
  accent = "var(--accent-cyan)",
}: {
  project: ProjectLike;
  accent?: string;
}): ReactNode {
  const demo = project.demo as DemoConfig | undefined;
  if (!demo) return null;

  switch (demo.type) {
    case "youtube":
      return <YouTubeEmbed videoId={demo.youtubeId} title={demo.title} fit={demo.fit} accent={accent} badge={demo.badge} />;

    case "video":
      return <VideoPanel src={demo.src} poster={demo.poster} autoPlay={demo.autoPlay} fit={demo.fit} accent={accent} badge={demo.badge} />;

    case "image":
      return (
        <ImagePanel
          image={demo.image ?? {}}
          boxes={demo.boxes}
          placeholderIcon={demo.placeholderIcon}
          fit={demo.fit}
          accent={accent}
          badge={demo.badge}
        />
      );

    case "compare":
      return (
        <CompareSlider
          before={demo.before ?? {}}
          after={demo.after ?? {}}
          afterClean={demo.afterClean}
          toggleLabel={demo.toggleLabel}
          initial={demo.initial}
          accent={accent}
          badge={demo.badge}
        />
      );

    case "network":
      return <NetworkGraph nodes={demo.nodes} edges={demo.edges} accent={accent} badge={demo.badge} />;

    case "multicam":
      return <MultiCamTracking accent={accent} badge={demo.badge} />;

    default:
      return null;
  }
}

/** Whether a project has a demo configured. */
export function hasProjectDemo(project: ProjectLike): boolean {
  return !!project.demo;
}

// Re-export generics so demos/index stays the single import surface.
export { CompareSlider, VideoPanel, YouTubeEmbed, ImagePanel, NetworkGraph, MultiCamTracking };
