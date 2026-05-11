"use client";

import { useState } from "react";

interface HomelabNode {
  name: string;
  children?: Array<{
    name: string;
    services?: string[];
  }>;
}

interface Homelab {
  description: string;
  nodes: HomelabNode[];
}

interface Props {
  homelab: Homelab;
}

const serviceIcons: Record<string, string> = {
  WireGuard: "🔐",
  "Pi-hole": "🛡️",
  "Nginx Proxy Manager": "🔀",
  DDNS: "🌐",
  Ollama: "🤖",
  Immich: "📷",
  Jellyfin: "🎬",
  Docker: "🐳",
};

const serviceDescriptions: Record<string, string> = {
  WireGuard: "VPN self-hosted",
  "Pi-hole": "DNS ad blocker",
  "Nginx Proxy Manager": "Reverse proxy con SSL",
  DDNS: "DNS dinámico",
  Ollama: "LLMs locales",
  Immich: "Google Photos alternativo",
  Jellyfin: "Media server",
  Docker: "Orquestación de contenedores",
};

export function HomeLab({ homelab }: Props) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const node = homelab.nodes[0];

  const allServices = [
    ...(node.children?.find((c) => c.name === "Docker")?.services ?? []),
    ...(node.children?.filter((c) => c.name !== "Docker").map((c) => c.name) ?? []),
  ];

  return (
    <section
      style={{
        borderTop: "1px solid var(--surface-card-border)",
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          backgroundColor: "var(--accent-purple)",
          opacity: 0.04,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <p
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11,
              color: "var(--accent-cyan)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            // 04_HOME_LAB
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Side Projects & Home Lab
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 520 }}>
            {homelab.description}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* Network diagram */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--surface-card-border)",
              borderRadius: 12,
              padding: 32,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                marginBottom: 24,
              }}
            >
              NETWORK_TOPOLOGY.json
            </p>

            {/* Proxmox root */}
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}>
              <NodeRow
                icon="🖥️"
                name="Proxmox"
                color="var(--accent-cyan)"
                isRoot
                active={activeNode === "Proxmox"}
                onClick={() => setActiveNode(activeNode === "Proxmox" ? null : "Proxmox")}
              />

              {/* Docker branch */}
              <div style={{ marginLeft: 24, marginTop: 8 }}>
                <NodeRow
                  icon="🐳"
                  name="Docker"
                  color="var(--accent-cyan)"
                  connector="├─"
                  active={activeNode === "Docker"}
                  onClick={() => setActiveNode(activeNode === "Docker" ? null : "Docker")}
                />
                <div style={{ marginLeft: 20, marginTop: 6 }}>
                  {node.children
                    ?.find((c) => c.name === "Docker")
                    ?.services?.map((svc, i, arr) => (
                      <NodeRow
                        key={svc}
                        icon={serviceIcons[svc] ?? "◦"}
                        name={svc}
                        connector={i === arr.length - 1 ? "└─" : "├─"}
                        color="var(--accent-purple)"
                        active={activeNode === svc}
                        onClick={() => setActiveNode(activeNode === svc ? null : svc)}
                        small
                      />
                    ))}
                </div>

                {/* Other services */}
                {node.children
                  ?.filter((c) => c.name !== "Docker")
                  .map((child, i, arr) => (
                    <NodeRow
                      key={child.name}
                      icon={serviceIcons[child.name] ?? "◦"}
                      name={child.name}
                      connector={i === arr.length - 1 ? "└─" : "├─"}
                      color="var(--accent-purple)"
                      active={activeNode === child.name}
                      onClick={() => setActiveNode(activeNode === child.name ? null : child.name)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Service details panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeNode && serviceDescriptions[activeNode] ? (
              <div
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--accent-cyan)",
                  borderRadius: 12,
                  padding: 28,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{serviceIcons[activeNode] ?? "⚙️"}</span>
                  <div>
                    <h4
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--accent-cyan)",
                      }}
                    >
                      {activeNode}
                    </h4>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {serviceDescriptions[activeNode]}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  border: "1px dashed var(--surface-card-border)",
                  borderRadius: 12,
                  color: "var(--text-muted)",
                  fontSize: 13,
                  fontFamily: "var(--font-geist-mono)",
                  marginBottom: 16,
                }}
              >
                ← Haz clic en un nodo para ver detalles
              </div>
            )}

            {/* Service grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}
            >
              {allServices.map((svc) => (
                <button
                  key={svc}
                  onClick={() => setActiveNode(activeNode === svc ? null : svc)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: activeNode === svc ? "var(--accent-cyan)" : "var(--surface-card-border)",
                    backgroundColor: activeNode === svc ? "var(--accent-cyan-glow)" : "var(--surface-card)",
                    color: activeNode === svc ? "var(--accent-cyan)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono)",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{serviceIcons[svc] ?? "◦"}</span>
                  <span>{svc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NodeRow({
  icon,
  name,
  color,
  connector,
  isRoot,
  active,
  onClick,
  small,
}: {
  icon: string;
  name: string;
  color: string;
  connector?: string;
  isRoot?: boolean;
  active?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 8px",
        borderRadius: 6,
        cursor: "pointer",
        backgroundColor: active ? "var(--accent-cyan-glow)" : "transparent",
        transition: "all 0.15s ease",
        marginBottom: 4,
        color: active ? "var(--accent-cyan)" : "var(--text-secondary)",
        fontSize: small ? 12 : 13,
      }}
    >
      {connector && (
        <span style={{ color: "var(--text-muted)", userSelect: "none" }}>{connector}</span>
      )}
      <span>{icon}</span>
      <span
        style={{
          fontWeight: isRoot ? 700 : 500,
          color: active ? color : "inherit",
        }}
      >
        {name}
      </span>
      {isRoot && (
        <span
          style={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 3,
            backgroundColor: "var(--accent-cyan-glow)",
            color: "var(--accent-cyan)",
            marginLeft: 4,
          }}
        >
          HOST
        </span>
      )}
    </div>
  );
}
