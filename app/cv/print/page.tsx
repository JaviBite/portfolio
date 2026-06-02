"use client";

import { ExperienceSection } from "@/components/ExperienceSection";
import { Icon } from "@/components/Icon";
import { useData } from "@/lib/useData";

export default function CVPrintPage() {
  const data = useData();
  const { profile, experience, education, languages, skills } = data;

  return (
    <main style={{ minHeight: "100vh", paddingTop: 0, paddingBottom: 0 }}>
      <div style={{ maxWidth: "100%", margin: 0, padding: "12mm 15mm" }}>
        {/* Header - Top Section */}
        <header style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid var(--surface-card-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, textTransform: "uppercase" }}>
                {profile.name}
              </h1>
              <p style={{ fontSize: 12, color: "var(--accent-cyan)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
                {profile.title}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10, maxWidth: 500 }}>
                {profile.bio}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10, color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="mail" size={12} style={{ color: "var(--accent-cyan)" }} />
                  <span style={{ fontSize: 9, fontWeight: 600, minWidth: 60 }}>EMAIL:</span>
                  <a href={`mailto:${profile.contact.email}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {profile.contact.email}
                  </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="location_on" size={12} style={{ color: "var(--accent-cyan)" }} />
                  <span style={{ fontSize: 9, fontWeight: 600, minWidth: 60 }}>UBICACIÓN:</span>
                  <span>{profile.contact.location}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <a href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 10, fontWeight: 600 }}>
                    <Icon name="work" size={14} />
                    LinkedIn
                  </a>
                  <a href={profile.contact.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 10, fontWeight: 600 }}>
                    <Icon name="code" size={14} />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
            
            {/* Portrait */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {profile.portrait && (
                <img src={profile.portrait} alt="Portrait" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-secondary)", textAlign: "center", maxWidth: 140 }}>
                "No veo problemas, solo soluciones."
              </p>
            </div>
          </div>
        </header>

        {/* Two Column Layout - Page 1 Optimized */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 20, pageBreakAfter: "auto", alignItems: "start" }}>
          {/* LEFT COLUMN - Experience */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%" }}>
            <ExperienceSection experience={experience} isPrint={true} />
          </div>

          {/* RIGHT COLUMN - Education, Languages, Skills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Education */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name="school" size={18} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Formación
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ paddingBottom: 8, borderBottom: idx < education.length - 1 ? "0.5px solid var(--surface-card-border)" : "none" }}>
                    <h4 style={{ fontSize: 9, fontWeight: 600, marginBottom: 2 }}>{edu.degree}</h4>
                    <p style={{ fontSize: 8, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", marginBottom: 2 }}>
                      {edu.institution}
                    </p>
                    <p style={{ fontSize: 7, color: "var(--text-secondary)" }}>
                      {edu.start} – {edu.end}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name="translate" size={18} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Idiomas
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {languages.map((lang, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 600 }}>{lang.language}</span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: i < lang.level ? "var(--accent-cyan)" : "var(--surface-card-border)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name="build" size={18} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Skills
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {skills.map((skillGroup, idx) => (
                  <div key={idx}>
                    <h4 style={{ fontSize: 8, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 4, textTransform: "uppercase", fontFamily: "var(--font-geist-mono)" }}>
                      {skillGroup.category}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {Array.isArray(skillGroup.items)
                        ? skillGroup.items.slice(0, 8).map((item: any) => (
                            <span key={typeof item === "string" ? item : item.name} style={{ padding: "2px 5px", borderRadius: 2, fontSize: 7, fontFamily: "var(--font-geist-mono)", color: "var(--text-secondary)", backgroundColor: "var(--surface-card)", border: "0.5px solid var(--surface-card-border)" }}>
                              {typeof item === "string" ? item : item.name}
                            </span>
                          ))
                        : null}
                      {Array.isArray(skillGroup.items) && skillGroup.items.length > 8 && (
                        <span style={{ fontSize: 7, color: "var(--text-muted)" }}>+{skillGroup.items.length - 8}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name="star" size={18} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Logros
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {profile.achievements.map((achievement, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Icon name="check_circle" size={14} style={{ color: "var(--accent-cyan)", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 8, color: "var(--text-secondary)", lineHeight: 1.3 }}>{achievement}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @page {
          size: A4;
          margin: 0;
          padding: 0;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          main {
            padding: 0;
            margin: 0;
            background: white;
          }
          main > div {
            max-width: 100%;
            padding: 12mm 15mm;
            margin: 0;
          }
          header {
            page-break-inside: avoid;
            margin-bottom: 12px;
            padding-bottom: 12px;
          }
          section {
            page-break-inside: avoid;
          }
          h1, h2, h3, h4 {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
    </main>
  );
}
