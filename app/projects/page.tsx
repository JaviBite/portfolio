"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { DemoRenderer, hasProjectDemo } from "@/components/demos";
import { useLocale } from "@/i18n/LocaleContext";
import { useData } from "@/lib/useData";

const clientColors: Record<string, string> = {
  "Würth": "var(--accent-cyan)",
  "Stellantis": "var(--accent-purple)",
  "GIS Madrid": "#22c55e",
  "Administración Pública": "#f59e0b",
  "VIC, EITB": "#f97316",
  "Self-hosted Lab": "#ec4899",
};

const projectIcons: Record<string, { icon: string; fill?: boolean }> = {
  "logistics-wurth": { icon: "local_shipping", fill: false },
  "tracking-stellantis": { icon: "two_wheeler", fill: false },
  "aerial-gis-madrid": { icon: "satellite_alt", fill: false },
  "biometric-id": { icon: "person", fill: false },
  "smartcrop-autoflip": { icon: "movie", fill: false },
  "personal-selfhosted": { icon: "storage", fill: false },
};

// Constantes de estilo para el layout
const LAYOUT_CONFIG = {
  "horizontal-left": { columns: "1fr 0.85fr", rows: "1fr", areas: '"demo info"' },
  "horizontal-right": { columns: "0.85fr 1fr", rows: "1fr", areas: '"info demo"' },
  "vertical-top": { columns: "1fr", rows: "1fr 1fr", areas: '"demo""\ninfo"' },
  "vertical-bottom": { columns: "1fr", rows: "1fr 1fr", areas: '"info"\n"demo"' },
};

export default function ProjectsPage() {
  const { messages } = useLocale();
  const data = useData();
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
            {messages.projects?.header || "// PROYECTOS"}
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
          {data.projects.map((project) => {
            const color = clientColors[project.client] ?? "var(--accent-cyan)";
            const iconData = projectIcons[project.id] ?? { icon: "settings" };
            const gridSpan = (project).gridSpan ?? 5;
            const gridRowSpan = (project).gridRowSpan ?? 1;
            const demoPercentage = (project).demoPercentage ?? 50;
            const layout = (project).layout ?? "horizontal-right";
            
            // Calcular proporciones dinámicamente basadas en demoPercentage
            const infoPct = 100 - demoPercentage;
            let layoutConfig = LAYOUT_CONFIG[layout as keyof typeof LAYOUT_CONFIG];
            
            if (layout === "horizontal-left" || layout === "horizontal-right") {
              const demoCol = `${demoPercentage}%`;
              const infoCol = `${infoPct}%`;
              const columns = layout === "horizontal-left" 
                ? `${demoCol} ${infoCol}` 
                : `${infoCol} ${demoCol}`;
              const areas = layout === "horizontal-left"
                ? '"demo info"'
                : '"info demo"';
              layoutConfig = { columns, rows: "1fr", areas };
            } else {
              const demoPct = `${demoPercentage}%`;
              const infoPct = `${100 - demoPercentage}%`;
              const rows = layout === "vertical-top"
                ? `${demoPct} ${infoPct}`
                : `${infoPct} ${demoPct}`;
              const areas = layout === "vertical-top"
                ? '"demo"\n"info"'
                : '"info"\n"demo"';
              layoutConfig = { columns: "1fr", rows, areas };
            }

            const cardStyle: React.CSSProperties = {
              gridColumn: `span ${gridSpan}`,
              gridRow: `span ${gridRowSpan}`,
              backgroundColor: "var(--surface-card)",
              border: "2px solid var(--surface-card-border)",
              borderRadius: 4,
              padding: 0,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              cursor: "pointer",
              minHeight: 320,
              display: "grid",
              gridTemplateColumns: layoutConfig.columns,
              gridTemplateRows: layoutConfig.rows,
              gridTemplateAreas: layoutConfig.areas,
              gap: 0,
              boxShadow: "4px 4px 0px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
            };

            return (
              <div
                key={project.id}
                style={cardStyle}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "scale(1.02)";
                  el.style.boxShadow = "6px 6px 0px rgba(0,0,0,0.12), 0 12px 32px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "scale(1)";
                  el.style.boxShadow = "4px 4px 0px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)";
                }}
              >
                <div style={{ gridArea: "info", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px", position: "relative", overflow: "hidden" }}>
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

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 24,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            fontSize: 28,
                            padding: "8px",
                            backgroundColor: "var(--bg)",
                            borderRadius: 2,
                            border: "2px solid var(--surface-card-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 44,
                            height: 44,
                          }}
                        >
                          <Icon name={iconData.icon} size={24} style={{ color }} fill={iconData.fill} />
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              padding: "2px 8px",
                              borderRadius: 2,
                              fontSize: 10,
                              fontFamily: "var(--font-geist-mono)",
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: color,
                              border: `2px solid ${color}`,
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
                        fontSize: 22,
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
                          borderRadius: 2,
                          fontSize: 11,
                          fontFamily: "var(--font-geist-mono)",
                          color: "var(--text-muted)",
                          backgroundColor: "var(--bg)",
                          border: "2px solid var(--surface-card-border)",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {hasProjectDemo(project) ? (
                  <div
                    className="demo-cell-full"
                    style={{
                      gridArea: "demo",
                      position: "relative",
                      backgroundColor: "var(--bg)",
                      overflow: "hidden",
                    }}
                  >
                    <DemoRenderer project={project} accent={color} />
                  </div>
                ) : (
                  <div
                    style={{
                      gridArea: "demo",
                      padding: "32px",
                      borderRadius: 0,
                      backgroundColor: "var(--bg)",
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
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      {project.demos.map((demo) => (
                        <div
                          key={demo}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 2,
                            backgroundColor: "var(--surface-card)",
                            border: "2px solid var(--surface-card-border)",
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
                )}
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
