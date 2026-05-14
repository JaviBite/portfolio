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
      className="project-card"
      style={{ "--accent-color": color, position: "relative", overflow: "hidden" } as React.CSSProperties & { "--accent-color": string }}
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
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Left side - Info */}
      <div className="project-card-info" style={{ color, position: "relative", zIndex: 1 }}>
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


    </div>
  );
}
