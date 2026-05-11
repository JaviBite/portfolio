"use client";

import Link from "next/link";

interface Project {
  id: string;
  client: string;
  tag: string;
  description: string;
  stack: string[];
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
    <section
      style={{
        backgroundColor: "var(--bg-secondary, var(--bg))",
        borderTop: "1px solid var(--surface-card-border)",
        borderBottom: "1px solid var(--surface-card-border)",
        padding: "120px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 64,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
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
              // 02_PROYECTOS
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Proyectos Destacados
            </h2>
          </div>
          <Link
            href="/projects"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid var(--accent-cyan)",
              color: "var(--accent-cyan)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
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
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--surface-card-border)",
        borderRadius: 12,
        padding: 28,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--surface-card-border)";
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: 0.05,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Tag */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: color,
            border: `1px solid ${color}`,
            opacity: 0.8,
          }}
        >
          {project.tag.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: 20,
            fontFamily: "var(--font-geist-mono)",
            color: "var(--text-muted)",
            fontWeight: 700,
          }}
        >
          →
        </span>
      </div>

      {/* Client */}
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 8,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {project.client}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        {project.description}
      </p>

      {/* Stack chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {project.stack.slice(0, 4).map((tech) => (
          <span
            key={tech}
            style={{
              padding: "3px 8px",
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
  );
}
