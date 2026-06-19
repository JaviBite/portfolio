"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { DemoRenderer, hasProjectDemo } from "@/components/demos";
import { VideoLightbox } from "@/components/VideoLightbox";
import { useLocale } from "@/i18n/LocaleContext";
import { useData } from "@/lib/useData";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

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

type ProjectItem = ReturnType<typeof useData>["projects"][number];

type SectionKey = "empresa" | "personal";

const SECTION_TABS: { key: SectionKey; label: string }[] = [
  { key: "empresa", label: "Empresa" },
  { key: "personal", label: "Personal" },
];

/**
 * Segmented control with a sliding active pill. Stateless — driven by `active`
 * and `onSelect` — so it can be rendered in several places (top + bottom) and
 * every instance stays in sync with the same state.
 */
function SectionNav({ active, onSelect }: { active: SectionKey; onSelect: (key: SectionKey) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Secciones de proyectos"
      style={{
        position: "relative",
        display: "inline-flex",
        padding: 4,
        borderRadius: 999,
        border: "2px solid var(--surface-card-border)",
        backgroundColor: "var(--surface-card)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}
    >
      {/* sliding active pill */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 4,
          width: "calc(50% - 4px)",
          borderRadius: 999,
          backgroundColor: active === "personal" ? "var(--accent-purple)" : "var(--accent-cyan)",
          transform: active === "personal" ? "translateX(100%)" : "translateX(0)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1), background-color 0.4s ease",
        }}
      />
      {SECTION_TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.key)}
            style={{
              position: "relative",
              zIndex: 1,
              flex: 1,
              minWidth: 104,
              padding: "8px 20px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textAlign: "center",
              color: isActive ? "#0b0b0b" : "var(--text-secondary)",
              transition: "color 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectItem }) {
  const color = clientColors[project.client] ?? "var(--accent-cyan)";
  const iconData = projectIcons[project.id] ?? { icon: "settings" };
  const gridSpan = project.gridSpan ?? 5;
  const gridRowSpan = project.gridRowSpan ?? 1;
  const demoPercentage = project.demoPercentage ?? 50;
  const layout = project.layout ?? "horizontal-right";
  const showDemo = hasProjectDemo(project);
  const isWip = (project as { status?: string }).status === "wip";
  const { locale } = useLocale();
  const videoId = (project as { video?: string }).video;
  const [videoOpen, setVideoOpen] = useState(false);

  // "Working on it" placeholder: translucent, ghosted card for upcoming work.
  if (isWip) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 320,
          borderRadius: 4,
          border: "2px dashed var(--surface-card-border)",
          backgroundColor: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 32,
          textAlign: "center",
          opacity: 0.72,
          transition: "opacity 0.35s ease, border-color 0.35s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.borderColor = "var(--accent-purple)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.72";
          e.currentTarget.style.borderColor = "var(--surface-card-border)";
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "2px dashed var(--surface-card-border)",
            color: "var(--text-muted)",
          }}
        >
          <Icon name="construction" size={28} />
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "3px 10px",
            borderRadius: 2,
            fontSize: 10,
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent-purple)",
            border: "2px solid var(--accent-purple)",
            opacity: 0.85,
          }}
        >
          <span className="hero-badge-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent-purple)" }} />
          {project.tag}
        </span>
        <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-secondary)" }}>
          {project.client}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 280 }}>
          {project.description}
        </p>
      </div>
    );
  }

  // Calcular proporciones dinámicamente basadas en demoPercentage
  const infoPct = 100 - demoPercentage;
  let layoutConfig = LAYOUT_CONFIG[layout as keyof typeof LAYOUT_CONFIG];

  if (layout === "horizontal-left" || layout === "horizontal-right") {
    const demoCol = `${demoPercentage}%`;
    const infoCol = `${infoPct}%`;
    const columns = layout === "horizontal-left" ? `${demoCol} ${infoCol}` : `${infoCol} ${demoCol}`;
    const areas = layout === "horizontal-left" ? '"demo info"' : '"info demo"';
    layoutConfig = { columns, rows: "1fr", areas };
  } else {
    const demoPct = `${demoPercentage}%`;
    const infoPctStr = `${100 - demoPercentage}%`;
    const rows = layout === "vertical-top" ? `${demoPct} ${infoPctStr}` : `${infoPctStr} ${demoPct}`;
    const areas = layout === "vertical-top" ? '"demo"\n"info"' : '"info"\n"demo"';
    layoutConfig = { columns: "1fr", rows, areas };
  }

  const cardStyle: React.CSSProperties = {
    flex: 1,
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
    gridTemplateColumns: showDemo ? layoutConfig.columns : "1fr",
    gridTemplateRows: showDemo ? layoutConfig.rows : "1fr",
    gridTemplateAreas: showDemo ? layoutConfig.areas : '"info"',
    gap: 0,
    boxShadow: "4px 4px 0px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
  };

  return (
    <div
      className="projects-bento-card"
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

          {videoId && (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 13px",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: color,
                backgroundColor: "transparent",
                border: `2px solid ${color}`,
                cursor: "pointer",
                width: "fit-content",
                transition: "background-color 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color;
                e.currentTarget.style.color = "#0b0b0b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = color;
              }}
            >
              <Icon name="play_circle" size={18} />
              {locale === "en" ? "Watch promo video" : "Ver vídeo promocional"}
            </button>
          )}
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

      {showDemo && (
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
      )}

      {videoOpen && videoId && (
        <VideoLightbox
          youtubeId={videoId}
          title={project.client}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const { messages } = useLocale();
  const data = useData();
  const enterprise = data.projects.filter((p) => (p.category ?? "enterprise") === "enterprise");
  const personal = data.projects.filter((p) => p.category === "personal");

  const empresaRef = useRef<HTMLElement>(null);
  const personalRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<SectionKey>("empresa");
  // While a click-scroll is in flight we ignore the observer so the pill doesn't
  // flicker back and forth on the way to the target section.
  const lockRef = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Highlight the section currently in view (the shortcuts don't hide anything).
  useEffect(() => {
    const targets = [empresaRef.current, personalRef.current].filter(Boolean) as HTMLElement[];
    if (targets.length < 2) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target === personalRef.current ? "personal" : "empresa");
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [personal.length]);

  const goTo = (key: SectionKey) => {
    setActive(key); // move the pill immediately on click
    lockRef.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      lockRef.current = false;
    }, 700);
    const ref = key === "personal" ? personalRef : empresaRef;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 120 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Enterprise header + section shortcuts */}
        <section ref={empresaRef} style={{ scrollMarginTop: 96 }}>
        <Reveal>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginBottom: 64, paddingTop: 40 }}>
          <div style={{ flex: "1 1 420px", minWidth: 280 }}>
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
              Sistemas de visión artificial y AI desplegados en producción real para clientes enterprise.
            </p>
          </div>

          {personal.length > 0 && <SectionNav active={active} onSelect={goTo} />}
        </div>
        </Reveal>

        {/* Enterprise bento */}
        <Stagger className="projects-bento" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
          {enterprise.map((project) => (
            <StaggerItem key={project.id} style={{ gridColumn: `span ${project.gridSpan ?? 5}`, gridRow: `span ${project.gridRowSpan ?? 1}`, display: "flex", flexDirection: "column" }}>
              <ProjectCard project={project} />
            </StaggerItem>
          ))}
        </Stagger>
        </section>

        {/* Personal section */}
        {personal.length > 0 && (
          <section ref={personalRef} style={{ scrollMarginTop: 96 }}>
            <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginTop: 96, marginBottom: 64 }}>
              <div style={{ flex: "1 1 420px", minWidth: 280 }}>
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 11,
                    color: "var(--accent-purple)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  {"// PERSONAL"}
                </p>
                <h2
                  style={{
                    fontSize: "clamp(32px, 4.5vw, 56px)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    marginBottom: 12,
                  }}
                >
                  Proyectos Personales
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 560 }}>
                  Infraestructura self-hosted propia: experimentación con servicios en producción real sobre hardware doméstico.
                </p>
              </div>

              <SectionNav active={active} onSelect={goTo} />
            </div>
            </Reveal>

            <Stagger className="projects-bento" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
              {personal.map((project) => (
                <StaggerItem key={project.id} style={{ gridColumn: `span ${project.gridSpan ?? 5}`, gridRow: `span ${project.gridRowSpan ?? 1}`, display: "flex", flexDirection: "column" }}>
                  <ProjectCard project={project} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        )}

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
