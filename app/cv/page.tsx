"use client";

import Link from "next/link";
import data from "@/lib/data.json";
import { CVPrintButton } from "@/components/CVPrintButton";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Icon } from "@/components/Icon";

export default function CVPage() {
  const { profile, experience, education, languages, skills } = data;

  return (
    <main style={{ minHeight: "100vh", paddingTop: 80, paddingBottom: 120 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Actions bar */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", marginBottom: 40, borderBottom: "1px solid var(--surface-card-border)" }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
            LIVING CV — actualizado 2026
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/cv/chat" style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--accent-cyan)", backgroundColor: "var(--accent-cyan-glow)", color: "var(--accent-cyan)", fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "var(--font-geist-mono)" }}>
              Pregunta a mi CV →
            </Link>
            <CVPrintButton />
          </div>
        </div>

        {/* Header - Top Section */}
        <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "2px solid var(--surface-card-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "start" }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, textTransform: "uppercase" }}>
                {profile.name}
              </h1>
              <p style={{ fontSize: 14, color: "var(--accent-cyan)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>
                {profile.title}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 12, maxWidth: 600 }}>
                {profile.bio}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="mail" size={18} style={{ color: "var(--accent-cyan)" }} />
                  <a href={`mailto:${profile.contact.email}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {profile.contact.email}
                  </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="location_on" size={18} style={{ color: "var(--accent-cyan)" }} />
                  <span>{profile.contact.location}</span>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                  <a href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 12, fontWeight: 600 }}>
                    <Icon name="work" size={16} />
                    LinkedIn
                  </a>
                  <a href={profile.contact.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 12, fontWeight: 600 }}>
                    <Icon name="code" size={16} />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
            {/* Photo - Hidden in print */}
            <div
              className="no-print"
              style={{
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid var(--accent-cyan)",
                backgroundColor: "var(--surface-card)",
                width: 160,
                height: 160,
                boxShadow: "0 0 24px rgba(6, 182, 212, 0.3)",
                flexShrink: 0,
              }}
            >
              <img
                src={profile.portrait}
                alt={`Portrait of ${profile.name}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
          {/* Motto */}
          <div className="no-print" style={{ marginTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", fontFamily: "var(--font-geist-mono)" }}>
              "{profile.motto}"
            </p>
          </div>
        </header>

        {/* Single Column Layout - Experiencia Full Width First */}
        <div style={{ marginBottom: 32 }}>
          <ExperienceSection experience={experience} />
        </div>

        {/* Secondary Content - Education, Languages, Skills, Achievements */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {/* LEFT COLUMN - Education & Languages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Education */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Icon name="school" size={20} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Formación
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ paddingBottom: 12, borderBottom: idx < education.length - 1 ? "1px solid var(--surface-card-border)" : "none" }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{edu.degree}</h4>
                    <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", marginBottom: 4 }}>
                      {edu.institution}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                      {edu.start} – {edu.end}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Languages */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Icon name="translate" size={20} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Idiomas
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {languages.map((lang, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{lang.language}</span>
                    </div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: i < lang.level ? "var(--accent-cyan)" : "var(--surface-card-border)",
                          }}
                        />
                      ))}
                    </div>
                    {lang.note && <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{lang.note}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - Skills & Achievements */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Skills */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Icon name="build" size={20} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Skills
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {skills.map((skillGroup, idx) => (
                  <div key={idx}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-cyan)", marginBottom: 8, textTransform: "uppercase", fontFamily: "var(--font-geist-mono)" }}>
                      {skillGroup.category}
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Array.isArray(skillGroup.items)
                        ? skillGroup.items.map((item: any) => (
                            <span key={typeof item === "string" ? item : item.name} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "var(--font-geist-mono)", color: "var(--text-secondary)", backgroundColor: "var(--surface-card)", border: "1px solid var(--surface-card-border)" }}>
                              {typeof item === "string" ? item : item.name}
                            </span>
                          ))
                        : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Achievements */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Icon name="star" size={20} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  Logros
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {profile.achievements.map((achievement, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Icon name="check_circle" size={16} style={{ color: "var(--accent-cyan)", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>{achievement}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          main {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          
          main > div {
            max-width: 100% !important;
            padding: 12mm 15mm !important;
            margin: 0 !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          header {
            margin-bottom: 16px !important;
            padding-bottom: 12px !important;
            page-break-inside: avoid;
          }
          
          header h1 {
            font-size: 22px !important;
            margin-bottom: 4px !important;
          }
          
          header p {
            font-size: 10px !important;
            margin-bottom: 6px !important;
          }
          
          /* First section (Experience) stays on page 1 */
          header + div {
            page-break-after: auto;
            margin-bottom: 16px !important;
          }
          
          header + div section {
            page-break-inside: avoid;
          }
          
          section {
            page-break-inside: avoid;
            margin-bottom: 16px !important;
          }
          
          section div[style*="gridTemplateColumns"] {
            display: block !important;
            margin-bottom: 0 !important;
          }
          
          h2 {
            font-size: 11px !important;
            margin-bottom: 12px !important;
          }
          
          h3, h4 {
            font-size: 10px !important;
            margin-bottom: 4px !important;
          }
          
          p {
            font-size: 9px !important;
            margin: 0 !important;
            line-height: 1.3 !important;
          }
          
          span {
            font-size: 8px !important;
          }
          
          /* Optimize spacing for experience items */
          div[style*="gap: 24px"] {
            gap: 16px !important;
          }
          
          div[style*="gap: 32px"] {
            gap: 16px !important;
          }
          
          div[style*="gap: 40px"] {
            gap: 20px !important;
          }
          
          /* Reduce gaps in secondary content */
          div[style*="gridTemplateColumns: \"1fr 1fr\""] {
            gap: 20px !important;
          }
          
          /* Tech stack badges smaller */
          span[style*="padding: \"2px 8px\""] {
            padding: 2px 6px !important;
            font-size: 7px !important;
          }
        }
      `}</style>
    </main>
  );
}
