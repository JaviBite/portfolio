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

const projectColors: Record<string, string> = {
  "logistics-wurth": "var(--accent-cyan)",
  "tracking-stellantis": "var(--accent-purple)",
  "aerial-gis-madrid": "#22c55e",
  "biometric-id": "#f59e0b",
  "smartcrop-autoflip": "#f97316",
  "personal-selfhosted": "#ec4899",
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
              <ProjectCard project={project} color={projectColors[project.id] ?? "var(--accent-cyan)"} messages={messages} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function ProjectCard({ project, color, messages }: { project: Project; color: string; messages: any }) {
  return (
    <div className="project-card" style={{ "--accent-color": color } as React.CSSProperties & { "--accent-color": string }}>

      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Left side - Info */}
      <div className="project-card-info" style={{ color }}>
        {/* Tag */}
        <div className="project-card-header">
          <span className="tag-chip" style={{ color, borderColor: color }}>
            {(project.tag || messages.projects?.tag_enterprise || "ENTERPRISE").toUpperCase()}
          </span>
          <span className="arrow-icon">→</span>
        </div>

        {/* Client & Description */}
        <div className="project-card-content">
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
