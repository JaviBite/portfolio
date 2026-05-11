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
    <section
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "120px 24px",
      }}
    >
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
          // 01_EXPERTISE
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Stack & Expertise
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 480 }}>
          Herramientas que uso en producción real. No teoría.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {stackDomains.map(({ domain, color, icon, items }) => (
          <div
            key={domain}
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--surface-card-border)",
              borderRadius: 12,
              padding: 28,
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                `0 12px 40px rgba(0,0,0,0.2)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: color,
                opacity: 0.7,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-geist-mono)",
                  color: color,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {domain}
              </h3>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map((item) => (
                <span
                  key={item}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono)",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--bg-secondary, var(--bg))",
                    border: "1px solid var(--surface-card-border)",
                  }}
                >
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
