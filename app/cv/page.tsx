import Link from "next/link";
import data from "@/lib/data.json";
import { CVPrintButton } from "@/components/CVPrintButton";

export default function CVPage() {
  const { profile, experience, education } = data;

  const stackAll = [
    "Python","C++","TypeScript","JavaScript","OpenCV","PyTorch","SAM","YOLO",
    "Whisper","FFmpeg","Docker","Proxmox","Nginx","WireGuard","CompactifAI",
    "KNN","Face Recognition","Background Subtraction","Homografía","Saliency Detection",
    "Musician",
  ];

  return (
    <main style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 120 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        {/* Actions bar */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", marginBottom: 40, borderBottom: "1px solid var(--surface-card-border)" }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            LIVING CV — actualizado 2025
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/cv/chat" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--accent-cyan)", backgroundColor: "var(--accent-cyan-glow)", color: "var(--accent-cyan)", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-geist-mono)" }}>
              Pregunta a mi CV →
            </Link>
            <CVPrintButton />
          </div>
        </div>

        {/* Header */}
        <header
          style={{
            marginBottom: 60,
            display: "grid",
            gridTemplateColumns: "1fr minmax(180px, 180px)",
            gap: 32,
            alignItems: "start",
          }}
        >
          <div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
              {profile.name}
            </h1>
            <p style={{ fontSize: 18, color: "var(--accent-cyan)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.05em", marginBottom: 16 }}>
              {profile.title}
            </p>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 600, marginBottom: 20 }}>
              {profile.bio}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <a href={`mailto:${profile.contact.email}`} style={chipStyle}><span>✉️</span><span>{profile.contact.email}</span></a>
              <a href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" style={chipStyle}><span>💼</span><span>LinkedIn</span></a>
              <a href={profile.contact.github} target="_blank" rel="noopener noreferrer" style={chipStyle}><span>🐙</span><span>GitHub</span></a>
              <span style={chipStyle}><span>📍</span><span>{profile.contact.location}</span></span>
            </div>
          </div>
          <div
            style={{
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid var(--accent-cyan)",
              backgroundColor: "var(--surface-card)",
              width: 180,
              height: 180,
              boxShadow: "0 0 24px rgba(6, 182, 212, 0.2)",
            }}
          >
            <img
              src={profile.portrait}
              alt={`Portrait of ${profile.name}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </header>

        {/* Experience */}
        <Section title="Experiencia">
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {experience.map((exp) => (
              <div key={exp.company}>
                {exp.roles.map((role, roleIdx) => (
                  <div key={`${exp.company}-${roleIdx}`} style={{ paddingLeft: 20, borderLeft: "2px solid var(--surface-card-border)", position: "relative", marginBottom: roleIdx < exp.roles.length - 1 ? 24 : 0 }}>
                    <div style={{ position: "absolute", left: -5, top: 6, width: 8, height: 8, borderRadius: "50%", backgroundColor: role.current ? "var(--accent-cyan)" : "var(--text-muted)", boxShadow: role.current ? "0 0 8px var(--accent-cyan)" : "none" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, letterSpacing: "-0.01em" }}>{role.role}</h3>
                        <p style={{ fontSize: 14, fontFamily: "var(--font-geist-mono)", color: "var(--accent-cyan)" }}>{exp.company}</p>
                      </div>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", padding: "3px 10px", borderRadius: 4, border: "1px solid var(--surface-card-border)", height: "fit-content" }}>
                        {role.start} — {role.current ? "Presente" : role.end}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 14 }}>{role.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {role.stack.map((tech) => (
                        <span key={tech} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", border: "1px solid var(--surface-card-border)" }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section title="Formación">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {education.map((edu) => (
              <div key={edu.degree} style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--surface-card-border)", borderRadius: 10, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{edu.degree}</h3>
                  <p style={{ fontSize: 13, fontFamily: "var(--font-geist-mono)", color: "var(--accent-cyan)" }}>{edu.institution}</p>
                </div>
                <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)" }}>{edu.start} — {edu.end}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills Técnicos">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stackAll.map((tech) => {
              const isMusician = tech === "Musician";
              return (
                <span
                  key={tech}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono)",
                    color: isMusician ? "var(--accent-purple)" : "var(--text-secondary)",
                    backgroundColor: "var(--surface-card)",
                    border: isMusician ? "1px solid var(--accent-purple)" : "1px solid var(--surface-card-border)",
                    animation: isMusician ? "skillVibe 3s ease-in-out infinite" : "none",
                  }}
                  title={isMusician ? "Musician - subtle vibe" : undefined}
                >
                  {tech}
                </span>
              );
            })}
          </div>
          <style>{`
            @keyframes skillVibe {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </Section>
      </div>
    </main>
  );
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px",
  borderRadius: 6, border: "1px solid var(--surface-card-border)",
  backgroundColor: "var(--surface-card)", fontSize: 13, color: "var(--text-secondary)",
  textDecoration: "none", fontFamily: "var(--font-geist-mono)",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, backgroundColor: "var(--surface-card-border)" }} />
      </div>
      {children}
    </section>
  );
}
