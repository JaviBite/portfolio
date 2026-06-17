"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/i18n/LocaleContext";

interface ExperienceSectionProps {
  experience: Array<{
    company: string;
    logo?: string;
    website?: string;
    roles: Array<{
      role: { es: string; en: string } | string;
      start: string;
      end?: { es: string; en: string } | string | null;
      current?: boolean;
      description: { es: string; en: string } | string;
      stack: string[];
      location?: string;
    }>;
  }>;
  isPrint?: boolean;
  messages?: any;
}

const CHAR_LIMIT = 240;

function RoleDescription({
  text,
  fontSize,
  isPrint,
  readMore,
  readLess,
}: {
  text: string;
  fontSize: number;
  isPrint?: boolean;
  readMore: string;
  readLess: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = !isPrint && text.length > CHAR_LIMIT;
  const shown =
    needsTruncate && !expanded
      ? text.slice(0, CHAR_LIMIT).replace(/\s+\S*$/, "").trimEnd() + "… "
      : text;

  return (
    <p style={{ fontSize, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
      {shown}
      {needsTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="no-print"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "var(--accent-cyan)",
            cursor: "pointer",
            fontSize,
            fontWeight: 600,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? readLess : `${readMore}…`}
        </button>
      )}
    </p>
  );
}

export function ExperienceSection({ experience, isPrint = false, messages }: ExperienceSectionProps) {
  const { locale } = useLocale();

  const getText = (text: { es: string; en: string } | string) => {
    if (typeof text === "string") return text;
    return text[locale as keyof typeof text] || text.es;
  };

  const readMore = messages?.cv?.read_more || "Leer más";
  const readLess = messages?.cv?.read_less || "Leer menos";
  // Unified layout for web and print: left line column, logo column, content column
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Icon name="work_history" size={20} style={{ color: "var(--accent-cyan)" }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
          {messages?.cv?.experience || "Experiencia"}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {experience.map((exp, compIdx) => (
          <div key={exp.company} style={{ pageBreakInside: "avoid" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "start" }}>
              {/* Logo */}
              <div style={{ gridColumn: "1 / 2", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                {exp.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={exp.logo} alt={`${exp.company} logo`} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, zIndex: 2 }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-card)", border: "1px solid var(--surface-card-border)", zIndex: 2 }}>
                    <Icon name="business" size={16} style={{ color: "var(--accent-cyan)" }} />
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "2 / 3" }}>
                {exp.roles.length > 1 ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{exp.company}</h3>
                      {exp.website && (
                        <a href={exp.website} target="_blank" rel="noopener noreferrer" title={`Visitar ${exp.company}`} aria-label={`Visitar ${exp.company}`} style={{ textDecoration: "none", color: "var(--accent-cyan)", fontSize: 12 }}>
                          ↗
                        </a>
                      )}
                    </div>

                    <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", margin: "2px 0 4px" }}>{exp.roles[0].start} – {getText(exp.roles[exp.roles.length - 1].end || messages?.cv?.present || "Presente")}{exp.roles[0].location && ` • ${exp.roles[0].location}`}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
                      {exp.roles.map((role, idx) => (
                        <div key={`${exp.company}-${idx}`} style={{ position: "relative", paddingLeft: 0 }}>
                          {exp.roles.length > 1 && (
                            <>
                              <span style={{ position: "absolute", left: -43, top: 6, width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent-cyan)", zIndex: 2 }} />
                              {idx < exp.roles.length - 1 && (
                                <div style={{ position: "absolute", left: -40, top: 18, width: 2, height: "calc(100% - 8px)", background: "var(--accent-cyan)", zIndex: 1 }} />
                              )}
                            </>
                          )}

                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{getText(role.role)}</h4>
                            <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", margin: "2px 0" }}>{role.start} – {getText(role.end || messages?.cv?.present || "Presente")}</p>
                            <RoleDescription text={getText(role.description)} fontSize={13} isPrint={isPrint} readMore={readMore} readLess={readLess} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{getText(exp.roles[0].role)}</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "2px 0 2px" }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>{exp.company}</p>
                      {exp.website && (
                        <a href={exp.website} target="_blank" rel="noopener noreferrer" title={`Visitar ${exp.company}`} aria-label={`Visitar ${exp.company}`} style={{ textDecoration: "none", color: "var(--accent-cyan)", fontSize: 12 }}>
                          ↗
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", margin: "0 0 4px" }}>
                      {exp.roles[0].start} – {getText(exp.roles[0].end || messages?.cv?.present || "Presente")}{exp.roles[0].location && ` • ${exp.roles[0].location}`}
                    </p>
                    <RoleDescription text={getText(exp.roles[0].description)} fontSize={13} isPrint={isPrint} readMore={readMore} readLess={readLess} />
                  </>
                )}
              </div>
            </div>

            {compIdx < experience.length - 1 && <div style={{ height: 1, background: "var(--surface-card-border)", margin: "12px 0" }} />}
          </div>
        ))}
      </div>
  </section>
  );
}
