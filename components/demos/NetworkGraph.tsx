"use client";

import { useMemo, useState } from "react";
import { DemoFrame } from "./DemoFrame";
import type { DemoBaseProps } from "./types";

export interface GraphNode {
  id: string;
  label: string;
  /** Position as a percentage of the frame (0–100). */
  x: number;
  y: number;
  /** Visual group → drives the node color. */
  group?: "host" | "runtime" | "app" | "service";
}

export type GraphEdge = [string, string];

const GROUP_COLORS: Record<string, string> = {
  host: "#4bc4d9",
  runtime: "#c578c6",
  app: "#22c55e",
  service: "#f59e0b",
};

// Default topology mirrors lib/data.json `homelab`:
// Proxmox → { Docker → (WireGuard, Pi-hole, Nginx PM, DDNS), Ollama, Immich, Jellyfin }
const DEFAULT_NODES: GraphNode[] = [
  { id: "proxmox", label: "Proxmox", x: 13, y: 50, group: "host" },
  { id: "docker", label: "Docker", x: 42, y: 20, group: "runtime" },
  { id: "ollama", label: "Ollama", x: 44, y: 50, group: "app" },
  { id: "immich", label: "Immich", x: 42, y: 70, group: "app" },
  { id: "jellyfin", label: "Jellyfin", x: 38, y: 88, group: "app" },
  { id: "wireguard", label: "WireGuard", x: 76, y: 8, group: "service" },
  { id: "pihole", label: "Pi-hole", x: 80, y: 24, group: "service" },
  { id: "npm", label: "Nginx PM", x: 80, y: 40, group: "service" },
  { id: "ddns", label: "DDNS", x: 76, y: 56, group: "service" },
];

const DEFAULT_EDGES: GraphEdge[] = [
  ["proxmox", "docker"],
  ["proxmox", "ollama"],
  ["proxmox", "immich"],
  ["proxmox", "jellyfin"],
  ["docker", "wireguard"],
  ["docker", "pihole"],
  ["docker", "npm"],
  ["docker", "ddns"],
];

interface NetworkGraphProps extends DemoBaseProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  badge?: string;
}

/**
 * Generic interactive network graph. Hovering (or focusing) a node lights up the
 * node, its edges and its direct neighbours while dimming the rest — good for
 * showing an infrastructure topology. Ships with a default self-hosted layout
 * and is fully driven by the `nodes`/`edges` props.
 */
export function NetworkGraph({
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES,
  accent = "var(--accent-cyan)",
  badge = "topology",
}: NetworkGraphProps) {
  const [active, setActive] = useState<string | null>(null);

  const pos = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const neighbors = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    nodes.forEach((n) => (m[n.id] = new Set()));
    edges.forEach(([a, b]) => {
      m[a]?.add(b);
      m[b]?.add(a);
    });
    return m;
  }, [nodes, edges]);

  const nodeLit = (id: string) => !active || active === id || !!neighbors[active]?.has(id);
  const edgeLit = ([a, b]: GraphEdge) => !active || a === active || b === active;

  return (
    <DemoFrame accent={accent} badge={badge}>
      {/* edges */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {edges.map(([a, b], i) => {
          const A = pos[a];
          const B = pos[b];
          if (!A || !B) return null;
          const lit = edgeLit([a, b]);
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke={lit ? accent : "var(--text-muted)"}
              strokeWidth={lit ? 0.5 : 0.3}
              opacity={lit ? 0.75 : 0.12}
              style={{ transition: "opacity 0.2s ease, stroke 0.2s ease" }}
            />
          );
        })}
      </svg>

      {/* nodes */}
      {nodes.map((n) => {
        const lit = nodeLit(n.id);
        const color = GROUP_COLORS[n.group ?? ""] ?? accent;
        const isActive = active === n.id;
        return (
          <button
            key={n.id}
            type="button"
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive((cur) => (cur === n.id ? null : cur))}
            onFocus={() => setActive(n.id)}
            onBlur={() => setActive((cur) => (cur === n.id ? null : cur))}
            style={{
              position: "absolute",
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.08 : 1})`,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: 11,
              fontFamily: "var(--font-geist-mono)",
              color: "var(--text-primary)",
              backgroundColor: "var(--surface-card)",
              border: `1.5px solid ${lit ? color : "var(--surface-card-border)"}`,
              boxShadow: isActive ? `0 0 0 4px ${color}33, 0 4px 12px rgba(0,0,0,0.18)` : "0 1px 4px rgba(0,0,0,0.1)",
              opacity: lit ? 1 : 0.32,
              zIndex: isActive ? 5 : 2,
              transition: "opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
            {n.label}
          </button>
        );
      })}
    </DemoFrame>
  );
}
