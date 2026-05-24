"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

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

const serviceIcons: Record<string, { icon: string; fill?: boolean }> = {
  WireGuard: { icon: "lock", fill: true },
  "Pi-hole": { icon: "security", fill: true },
  "Nginx Proxy Manager": { icon: "router", fill: false },
  DDNS: { icon: "public", fill: false },
  Ollama: { icon: "smart_toy", fill: false },
  Immich: { icon: "photo_library", fill: false },
  Jellyfin: { icon: "video_library", fill: false },
  Docker: { icon: "deployed_code", fill: false },
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
    <section className="home-lab-section">
      {/* Background accent */}
      <div className="home-lab-backdrop" />

      <div className="page-container">
        {/* Header */}
        <div className="section-header-compact">
          <p className="section-subtitle">// 04_HOME_LAB</p>
          <h2 className="section-title">Side Projects & Home Lab</h2>
          <p className="section-copy">{homelab.description}</p>
        </div>

        <div className="home-lab-grid">
          {/* Network diagram */}
          <div className="home-lab-panel">

            <p className="section-copy-sm">NETWORK_TOPOLOGY.json</p>

            {/* Proxmox root */}
            <div className="home-lab-node-group">
              <NodeRow
                icon={<Icon name="storage" size={18} className="home-lab-node-icon" />}
                name="Proxmox"
                tone="cyan"
                isRoot
                active={activeNode === "Proxmox"}
                onClick={() => setActiveNode(activeNode === "Proxmox" ? null : "Proxmox")}
              />

              {/* Docker branch */}
              <div className="home-lab-node-children">
                <NodeRow
                  icon={<Icon name="deployed_code" size={18} className="home-lab-node-icon" />}
                  name="Docker"
                  tone="cyan"
                  connector="├─"
                  active={activeNode === "Docker"}
                  onClick={() => setActiveNode(activeNode === "Docker" ? null : "Docker")}
                />
                <div className="home-lab-node-children-inner">
                  {node.children
                    ?.find((c) => c.name === "Docker")
                    ?.services?.map((svc, i, arr) => (
                      <NodeRow
                        key={svc}
                        icon={serviceIcons[svc] ? <Icon name={serviceIcons[svc].icon} size={16} fill={serviceIcons[svc].fill} className="home-lab-node-icon" /> : "◦"}
                        name={svc}
                        connector={i === arr.length - 1 ? "└─" : "├─"}
                        tone="purple"
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
                      icon={serviceIcons[child.name] ? <Icon name={serviceIcons[child.name].icon} size={16} fill={serviceIcons[child.name].fill} className="home-lab-node-icon" /> : "◦"}
                      name={child.name}
                      connector={i === arr.length - 1 ? "└─" : "├─"}
                      tone="purple"
                      active={activeNode === child.name}
                      onClick={() => setActiveNode(activeNode === child.name ? null : child.name)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Service details panel */}
          <div className="home-lab-details-panel">
            {activeNode && serviceDescriptions[activeNode] ? (
              <div className="home-lab-details-card">
                <div className="home-lab-details-heading">
                  <span className="home-lab-details-icon">{serviceIcons[activeNode] ?? "⚙️"}</span>
                  <div>
                    <h4 className="home-lab-details-title">{activeNode}</h4>
                    <p className="section-copy-sm">{serviceDescriptions[activeNode]}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="home-lab-details-empty">
                ← Haz clic en un nodo para ver detalles
              </div>
            )}

            {/* Service grid */}
            <div className="home-lab-service-grid">
              {allServices.map((svc) => {
                const isActive = activeNode === svc;
                return (
                  <button
                    key={svc}
                    onClick={() => setActiveNode(isActive ? null : svc)}
                    className={`home-lab-service-button ${isActive ? "active" : ""}`}
                  >
                    <span>{serviceIcons[svc] ? <Icon name={serviceIcons[svc].icon} size={16} fill={serviceIcons[svc].fill} /> : "◦"}</span>
                    <span>{svc}</span>
                  </button>
                );
              })}
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
  tone,
  connector,
  isRoot,
  active,
  onClick,
  small,
}: {
  icon: React.ReactNode | string;
  name: string;
  tone?: "cyan" | "purple";
  connector?: string;
  isRoot?: boolean;
  active?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`home-lab-node-row ${tone ? `tone-${tone}` : ""} ${active ? "active" : ""} ${isRoot ? "root" : ""} ${small ? "small" : ""}`}
    >
      {connector && <span className="home-lab-node-connector">{connector}</span>}
      <span>{icon}</span>
      <span className="home-lab-node-name">{name}</span>
      {isRoot && <span className="home-lab-node-host">HOST</span>}
    </div>
  );
}
