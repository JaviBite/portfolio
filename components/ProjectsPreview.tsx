"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleContext";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

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

type ProjectMessages = { projects?: Record<string, string | undefined> };

const projectColors: Record<string, string> = {
  "logistics-wurth": "var(--accent-cyan)",
  "tracking-stellantis": "var(--accent-purple)",
  "aerial-gis-madrid": "#22c55e",
  "biometric-id": "#f59e0b",
  "smartcrop-autoflip": "#f97316",
  "personal-selfhosted": "#ec4899",
};

// Imagen estática que asoma por la esquina de la tarjeta como "sneak peek"
// de la demo real que el visitante encontrará en /projects.
const projectPreviews: Record<string, string> = {
  "logistics-wurth": "/demos/logistics-wurth/conveyor-atasco.webp",
  "tracking-stellantis": "/demos/multicam-tracking/topdown-day.jpg",
  "aerial-gis-madrid": "/demos/gis-madrid/plaza-espana-2023-heatmap.jpg",
  "smartcrop-autoflip": "/demos/smartcrop-autoflip/autoflip-poster.jpg",
};

export function ProjectsPreview({ projects }: Props) {
  const { messages } = useLocale();
  return (
    <section className="section-with-borders">
      <div className="section-container">
        {/* Header */}
        <Reveal className="section-header">
          <div>
            <p className="section-subtitle">{messages.projects?.header || "// 02_PROYECTOS"}</p>
            <h2 className="section-title">{messages.projects?.title || "Proyectos Destacados"}</h2>
          </div>
          <Link href="/projects" className="view-all-link">
            {messages.projects?.view_all || "Ver todos →"}
          </Link>
        </Reveal>

        {/* Bento grid */}
        <Stagger className="bento-grid">
          {projects.map((project) => (
            <StaggerItem key={project.id}>
              <ProjectCard
                project={project}
                color={projectColors[project.id] ?? "var(--accent-cyan)"}
                preview={projectPreviews[project.id]}
                messages={messages}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  color,
  preview,
  messages,
}: {
  project: Project;
  color: string;
  preview?: string;
  messages: ProjectMessages;
}) {
  const demoLabel = messages.projects?.demo || "Ver demo";
  const stackChips = project.stack.slice(0, 3).map((tech) => (
    <span key={tech} className="stack-chip">
      {tech}
    </span>
  ));
  return (
    <Link
      href={`/projects#${project.id}`}
      className="project-card project-card--linked"
      style={{ "--accent-color": color } as React.CSSProperties & { "--accent-color": string }}
      aria-label={`${project.client} — ${demoLabel}`}
    >
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Texto arriba */}
      <div className="project-card-info" style={{ color }}>
        {/* Tag + "Ver demo" */}
        <div className="project-card-header">
          <span className="tag-chip" style={{ color, borderColor: color }}>
            {(project.tag || messages.projects?.tag_enterprise || "ENTERPRISE").toUpperCase()}
          </span>
          <span className="project-card-cta" style={{ color }}>
            <span className="project-card-cta-label">{demoLabel}</span>
            <span className="arrow-icon" style={{ color }}>→</span>
          </span>
        </div>

        {/* Client & Description */}
        <div className="project-card-content">
          <h3 className="client-title">{project.client}</h3>
          <p className="description-text">{project.description}</p>

          {/* Sin preview: los chips van bajo el texto como siempre */}
          {!preview && <div className="stack-chips">{stackChips}</div>}
        </div>
      </div>

      {/* Sneak peek: banda de imagen real de la demo abajo, con los badges
          de tecnologías y el "Ver demo" superpuestos encima. */}
      {preview && (
        <div className="project-peek">
          <img src={preview} alt="" loading="lazy" decoding="async" />
          <div className="project-peek-overlay">
            <div className="stack-chips">{stackChips}</div>
          </div>
        </div>
      )}
    </Link>
  );
}
