"use client";

import data from "@/lib/data.json";
import Link from "next/link";

const clientColors: Record<string, string> = {
  "Würth": "var(--accent-cyan)",
  "Stellantis": "var(--accent-purple)",
  "GIS Madrid": "#22c55e",
  "Administración Pública": "#f59e0b",
  "VIC, EITB": "#f97316",
  "Self-hosted Lab": "#ec4899",
};

const projectIcons: Record<string, string> = {
  "logistics-wurth": "📦",
  "tracking-stellantis": "🚗",
  "aerial-gis-madrid": "🛰️",
  "biometric-id": "👤",
  "smartcrop-autoflip": "🎬",
  "personal-selfhosted": "🖥️",
};

export default function ProjectsPage() {
  return (
    <main style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 120 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 64, paddingTop: 40 }}>
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
            // PROYECTOS
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Proyectos Enterprise
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 560 }}>
            Sistemas de visión artificial y AI deployados en producción real, más un proyecto self-hosted que muestra infraestructura propia en  producción.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 16,
          }}
        >
          {data.projects.map((project, i) => {
            const color = clientColors[project.client] ?? "var(--accent-cyan)";
            const icon = projectIcons[project.id] ?? "⚙️";
            const layout = project.layout ?? (i % 2 === 0 ? "horizontal-right" : "horizontal-left");
            const demoLeft = layout === "horizontal-left";
            const demoRight = layout === "horizontal-right";
            const verticalTop = layout === "vertical-top";
            const verticalBottom = layout === "vertical-bottom";
            const cardColumns = demoLeft || demoRight ? "0.95fr 0.55fr" : "1fr";
            const cardRows = verticalTop || verticalBottom ? "1fr 1fr" : "1fr";
            const gridAreas = demoLeft
              ? '"demo info"'
              : demoRight
              ? '"info demo"'
              : verticalTop
              ? '"demo" "info"'
              : '"info" "demo"';
            const cardStyle: React.CSSProperties = {
              gridColumn: i === 0 || i === 3 ? "span 7" : i === 1 ? "span 12" : "span 5",
              gridRow: i === 1 ? "span 2" : undefined,
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--surface-card-border)",
              borderRadius: 16,
              padding: 32,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.25s ease",
              cursor: "pointer",
              minHeight: i === 1 ? 680 : 320,
              display: "grid",
              gridTemplateColumns: cardColumns,
              gridTemplateRows: cardRows,
              gridTemplateAreas: gridAreas,
              gap: 24,
            };

            return (
              <div
                key={project.id}
                style={cardStyle}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.borderColor = color;
                  el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.2)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(0)";
                  el.style.borderColor = "var(--surface-card-border)";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Ambient glow */}
                <div
                  style={{
                    position: "absolute",
                    top: -60,
                    right: -60,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    backgroundColor: color,
                    opacity: 0.06,
                    filter: "blur(40px)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ gridArea: "info", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: verticalTop ? "32px 32px 0 32px" : verticalBottom ? "0 32px 32px 32px" : "0" }}>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 24,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            fontSize: 28,
                            padding: "8px",
                            backgroundColor: "var(--bg)",
                            borderRadius: 10,
                            border: "1px solid var(--surface-card-border)",
                          }}
                        >
                          {icon}
                        </span>
                        <div>
                          <span
                            style={{
                              display: "block",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 10,
                              fontFamily: "var(--font-geist-mono)",
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: color,
                              border: `1px solid ${color}`,
                              opacity: 0.8,
                              marginBottom: 4,
                              width: "fit-content",
                            }}
                          >
                            {project.tag.toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--font-geist-mono)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {project.start} — {project.end}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h2
                      style={{
                        fontSize: i === 0 || i === 3 ? 28 : 22,
                        fontWeight: 700,
                        marginBottom: 12,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {project.client}
                    </h2>

                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        lineHeight: 1.7,
                        marginBottom: 24,
                      }}
                    >
                      {project.description}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: "var(--font-geist-mono)",
                          color: "var(--text-muted)",
                          backgroundColor: "var(--bg)",
                          border: "1px solid var(--surface-card-border)",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    gridArea: "demo",
                    padding: verticalTop ? "32px 32px 0 32px" : verticalBottom ? "0 32px 32px 32px" : demoLeft ? "32px 0 32px 32px" : demoRight ? "32px 32px 32px 0" : "32px",
                    borderRadius: 0,
                    backgroundColor: "var(--bg)",
                    border: "none",
                    borderLeft: demoRight ? "2px solid var(--surface-card-border)" : undefined,
                    borderRight: demoLeft ? "2px solid var(--surface-card-border)" : undefined,
                    borderTop: verticalBottom ? "2px solid var(--surface-card-border)" : undefined,
                    borderBottom: verticalTop ? "2px solid var(--surface-card-border)" : undefined,
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        display: "inline-block",
                        marginBottom: 16,
                        fontSize: 11,
                        fontFamily: "var(--font-geist-mono)",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: color,
                      }}
                    >
                      Demo Panel
                    </span>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                      Espacio reservado para una demo interactiva en la tarjeta. Ya está preparado para mostrar contenido en un panel separado.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                    {project.demos.map((demo) => (
                      <div
                        key={demo}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          backgroundColor: "var(--surface-card)",
                          border: "1px solid var(--surface-card-border)",
                          fontSize: 11,
                          fontFamily: "var(--font-geist-mono)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {demo.replace(/[-_]/g, " ")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <div style={{ marginTop: 80, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              fontFamily: "var(--font-geist-mono)",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
