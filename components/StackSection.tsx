"use client";

const stackDomains = [
  {
    domain: "Computer Vision",
    color: "var(--accent-cyan)",
    icon: "👁",
    items: ["OpenCV", "SAM", "YOLO", "FFmpeg", "Tracking multi-cámara", "Homografía", "Saliency Detection"],
  },
  {
    domain: "AI / ML",
    color: "var(--accent-purple)",
    icon: "🧠",
    items: ["PyTorch", "Whisper", "KNN", "Embeddings", "Compresión de modelos", "CompactifAI"],
  },
  {
    domain: "Infraestructura",
    color: "#22c55e",
    icon: "⚙️",
    items: ["Docker", "Proxmox", "Nginx", "WireGuard", "CI/CD"],
  },
  {
    domain: "Lenguajes",
    color: "#f59e0b",
    icon: "⌨️",
    items: ["Python", "C++", "TypeScript", "JavaScript"],
  },
];

export function StackSection() {
  return (
    <section className="section-standard">
      {/* Header */}
      <div className="section-header-compact">
        <p className="section-subtitle">// 01_EXPERTISE</p>
        <h2 className="section-title">Stack & Expertise</h2>
        <p className="section-copy">Herramientas que uso en producción real. No teoría.</p>
      </div>

      {/* Grid */}
      <div className="grid-auto-fit">
        {stackDomains.map(({ domain, color, icon, items }) => (
          <div
            key={domain}
            className="block-card"
            style={{ "--accent-color": color } as React.CSSProperties & { "--accent-color": string }}
          >
            <div className="block-card-heading">
              <span className="domain-icon">{icon}</span>
              <h3 className="block-card-title">{domain}</h3>
            </div>

            <div className="chip-list">
              {items.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
