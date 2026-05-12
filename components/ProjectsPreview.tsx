"use client";

import Link from "next/link";

interface Project {
  id: string;
  client: string;
  tag: string;
  description: string;
  stack: string[];
  demos?: string[];
  start?: string;
  end?: string | null;
}

interface Props {
  projects: Project[];
}

const clientColors: Record<string, string> = {
  "Würth": "var(--accent-cyan)",
  "Stellantis": "var(--accent-purple)",
  "GIS Madrid": "#22c55e",
  "Administración Pública": "#f59e0b",
  "VIC, EITB": "#f97316",
};

export function ProjectsPreview({ projects }: Props) {
  return (
    <section className="section-with-borders">
      <div className="section-container">
        {/* Header */}
        <div className="section-header">
          <div>
            <p className="section-subtitle">
              {"// 02_PROYECTOS"}
            </p>
            <h2 className="section-title">
              Proyectos Destacados
            </h2>
          </div>
          <Link
            href="/projects"
            className="view-all-link"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-cyan-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Ver todos →
          </Link>
        </div>

        {/* Bento grid */}
        <div className="bento-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} color={clientColors[project.client] ?? "var(--accent-cyan)"} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, color }: { project: Project; color: string }) {
  return (
    <div
      className="project-card-split"
      style={{ "--accent-color": color } as React.CSSProperties & { "--accent-color": string }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--surface-card-border)";
      }}
    >
      {/* Left side - Info */}
      <div className="project-card-info" style={{ color }}>
        {/* Tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative", zIndex: 1 }}>
          <span className="tag-chip" style={{ color, borderColor: color }}>
            {project.tag.toUpperCase()}
          </span>
          <span className="arrow-icon">→</span>
        </div>

        {/* Client & Description */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h3 className="client-title">{project.client}</h3>
          <p className="description-text">{project.description}</p>

          {/* Stack chips */}
          <div className="stack-chips">
            {project.stack.slice(0, 3).map((tech) => (
              <span key={tech} className="stack-chip">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Demo */}
      <div className="project-card-demo">
        <div>
          <span style={{ display: "block", fontSize: 11, fontFamily: "var(--font-geist-mono)", fontWeight: 700, letterSpacing: "0.12em", color, marginBottom: 8, opacity: 0.8, textTransform: "uppercase" }}>
            Demo
          </span>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Ejemplos de funcionalidades clave demostradas en este proyecto.
          </p>
        </div>

        {/* Demo items */}
        {project.demos && project.demos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {project.demos.map((demo) => (
              <div key={demo} style={{ padding: "6px 10px", borderRadius: 4, fontSize: 12, backgroundColor: "var(--surface-card)", border: "1px solid var(--surface-card-border)", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono)", textTransform: "capitalize" }}>
                {demo.replace(/[-_]/g, " ")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
