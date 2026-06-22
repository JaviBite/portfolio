"use client";

import { ReactNode, useState } from "react";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/i18n/LocaleContext";

// Wraps its children in a link to the company website when one exists, otherwise
// renders them untouched. Keeps the original colour (the title/logo look the same)
// and just adds a pointer cursor to signal it's clickable.
function MaybeLink({
  href,
  company,
  children,
  style,
}: {
  href?: string;
  company: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  if (!href) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Visitar ${company}`}
      aria-label={`Visitar ${company}`}
      style={{ textDecoration: "none", color: "inherit", cursor: "pointer", ...style }}
    >
      {children}
    </a>
  );
}

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
  printBudget?: number;
  messages?: any;
}

const CHAR_LIMIT = 240;

// Maps "Mes Año" labels (the format used in data.json) to a month index.
// Both Spanish and English month names are accepted so the parser keeps working
// regardless of which locale string is passed in.
const MONTH_INDEX: Record<string, number> = {
  enero: 0, january: 0,
  febrero: 1, february: 1,
  marzo: 2, march: 2,
  abril: 3, april: 3,
  mayo: 4, may: 4,
  junio: 5, june: 5,
  julio: 6, july: 6,
  agosto: 7, august: 7,
  septiembre: 8, setiembre: 8, september: 8,
  octubre: 9, october: 9,
  noviembre: 10, november: 10,
  diciembre: 11, december: 11,
};

function parseMonthYear(value: string): { year: number; month: number } | null {
  const match = value.trim().toLowerCase().match(/^([a-záéíóúñ]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTH_INDEX[match[1]];
  if (month === undefined) return null;
  return { year: Number(match[2]), month };
}

// Inclusive tenure between two "Mes Año" labels (e.g. "Febrero 2022" → "Enero 2026").
// A null/absent end means "until now". Returns "" if a date can't be parsed.
function formatDuration(start: string, end: string | null | undefined, locale: string): string {
  const from = parseMonthYear(start);
  if (!from) return "";
  let toYear: number;
  let toMonth: number;
  if (end) {
    const to = parseMonthYear(end);
    if (!to) return "";
    toYear = to.year;
    toMonth = to.month;
  } else {
    const now = new Date();
    toYear = now.getFullYear();
    toMonth = now.getMonth();
  }
  let months = (toYear - from.year) * 12 + (toMonth - from.month) + 1;
  if (months < 1) months = 1;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const isEs = locale !== "en";
  const yWord = isEs ? (years === 1 ? "año" : "años") : years === 1 ? "year" : "years";
  const mWord = isEs ? (rem === 1 ? "mes" : "meses") : rem === 1 ? "month" : "months";
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${yWord}`);
  if (rem > 0) parts.push(`${rem} ${mWord}`);
  if (parts.length === 0) parts.push(isEs ? "1 mes" : "1 month");
  return parts.join(isEs ? " y " : " ");
}

// start/end may be a plain string or a {es,en} object; tenure is always parsed
// from the Spanish label since MONTH_INDEX covers both.
function rawDate(value: { es: string; en: string } | string | null | undefined): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : value.es;
}

// Bullets are authored with a " - " marker (space-dash-space). A description like
// "Intro. - Punto uno. - Punto dos." becomes a lead paragraph + a bullet list.
// The marker is unambiguous: hyphenated words (on-edge, multi-agente) have no
// surrounding spaces, and date ranges use an en-dash (–), not a hyphen.
const BULLET_SPLIT = /\s+-\s+/;

function parseDescription(text: string): { lead: string; bullets: string[] } {
  const trimmed = text.trim();
  // A leading "- " marks a first bullet with no lead paragraph.
  const normalized = trimmed.startsWith("- ") ? ` ${trimmed}` : trimmed;
  const segments = normalized
    .split(BULLET_SPLIT)
    .map((s) => s.trim())
    .filter((s, i) => s.length > 0 || i === 0);
  if (segments.length <= 1) return { lead: trimmed, bullets: [] };
  const [lead, ...bullets] = segments;
  return { lead, bullets: bullets.filter(Boolean) };
}

function ReadToggle({
  expanded,
  setExpanded,
  fontSize,
  readMore,
  readLess,
}: {
  expanded: boolean;
  setExpanded: (fn: (v: boolean) => boolean) => void;
  fontSize: number;
  readMore: string;
  readLess: string;
}) {
  return (
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
  );
}

function RoleDescription({
  text,
  fontSize,
  isPrint,
  printBudget,
  readMore,
  readLess,
}: {
  text: string;
  fontSize: number;
  isPrint?: boolean;
  printBudget?: number;
  readMore: string;
  readLess: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { lead, bullets } = parseDescription(text);

  // Print: render bullets like the web, but truncated to a per-role character
  // budget. The lead and at least one bullet are always kept; remaining bullets
  // are dropped whole (never cut mid-sentence) so the print auto-fit on the page
  // can grow or shrink the budget cleanly to fill the available space.
  if (isPrint) {
    const budget = printBudget ?? Infinity;
    if (bullets.length === 0) {
      const shown =
        budget < lead.length ? lead.slice(0, budget).replace(/\s+\S*$/, "").trimEnd() + "…" : lead;
      return <p style={{ fontSize, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>{shown}</p>;
    }
    const shownBullets: string[] = [];
    let used = lead.length;
    for (const b of bullets) {
      if (shownBullets.length >= 1 && used + b.length > budget) break;
      shownBullets.push(b);
      used += b.length;
    }
    return (
      <div style={{ fontSize, color: "var(--text-secondary)", lineHeight: 1.4 }}>
        {lead && <p style={{ margin: 0 }}>{lead}</p>}
        <ul style={{ margin: lead ? "3px 0 0" : 0, paddingLeft: 14, listStyleType: "disc" }}>
          {shownBullets.map((b, i) => (
            <li key={i} style={{ color: "var(--accent-cyan)", marginBottom: 2 }}>
              <span style={{ color: "var(--text-secondary)" }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Web without bullets: flowing prose with a read-more toggle.
  if (bullets.length === 0) {
    const needsTruncate = text.length > CHAR_LIMIT;
    const shown =
      needsTruncate && !expanded ? text.slice(0, CHAR_LIMIT).replace(/\s+\S*$/, "").trimEnd() + "… " : text;

    return (
      <p style={{ fontSize, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
        {shown}
        {needsTruncate && (
          <ReadToggle expanded={expanded} setExpanded={setExpanded} fontSize={fontSize} readMore={readMore} readLess={readLess} />
        )}
      </p>
    );
  }

  // Web with bullets: lead paragraph + bullet list, truncated by character budget
  // so collapsed cards stay compact (always shows at least one bullet).
  const total = [lead, ...bullets].join(" ").length;
  const needsTruncate = total > CHAR_LIMIT;
  let shownBullets = bullets;
  if (needsTruncate && !expanded) {
    shownBullets = [];
    let used = lead.length;
    for (const b of bullets) {
      if (shownBullets.length >= 1 && used + b.length > CHAR_LIMIT) break;
      shownBullets.push(b);
      used += b.length;
    }
  }

  return (
    <div style={{ fontSize, color: "var(--text-secondary)", lineHeight: 1.55 }}>
      {lead && <p style={{ margin: 0 }}>{lead}</p>}
      <ul style={{ margin: lead ? "4px 0 0" : 0, paddingLeft: 18, listStyleType: "disc" }}>
        {shownBullets.map((b, i) => (
          <li key={i} style={{ color: "var(--accent-cyan)", marginBottom: 3 }}>
            <span style={{ color: "var(--text-secondary)" }}>{b}</span>
          </li>
        ))}
      </ul>
      {needsTruncate && (
        <ReadToggle expanded={expanded} setExpanded={setExpanded} fontSize={fontSize} readMore={readMore} readLess={readLess} />
      )}
    </div>
  );
}

export function ExperienceSection({ experience, isPrint = false, printBudget, messages }: ExperienceSectionProps) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isPrint ? 12 : 20 }}>
        <Icon name="work_history" size={20} style={{ color: "var(--accent-cyan)" }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
          {messages?.cv?.experience || "Experiencia"}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: isPrint ? 9 : 18 }}>
        {experience.map((exp, compIdx) => {
          const firstRole = exp.roles[0];
          const lastRole = exp.roles[exp.roles.length - 1];
          // Roles are authored newest-first, so the company spans from the last
          // role's start to the first role's end (null end → ongoing).
          const companyStart = lastRole.start;
          const companyEnd = rawDate(firstRole.end);
          const companyDuration = formatDuration(companyStart, companyEnd, locale);
          return (
          <div key={exp.company} style={{ pageBreakInside: "avoid" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "start" }}>
              {/* Logo */}
              <div style={{ gridColumn: "1 / 2", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                <MaybeLink href={exp.website} company={exp.company} style={{ display: "flex" }}>
                  {exp.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={exp.logo} alt={`${exp.company} logo`} style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, zIndex: 2 }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-card)", border: "1px solid var(--surface-card-border)", zIndex: 2 }}>
                      <Icon name="business" size={16} style={{ color: "var(--accent-cyan)" }} />
                    </div>
                  )}
                </MaybeLink>
              </div>

              <div style={{ gridColumn: "2 / 3" }}>
                {exp.roles.length > 1 ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                        <MaybeLink href={exp.website} company={exp.company}>{exp.company}</MaybeLink>
                      </h3>
                      {exp.website && (
                        <a href={exp.website} target="_blank" rel="noopener noreferrer" title={`Visitar ${exp.company}`} aria-label={`Visitar ${exp.company}`} style={{ textDecoration: "none", color: "var(--accent-cyan)", fontSize: 12 }}>
                          ↗
                        </a>
                      )}
                    </div>

                    <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", margin: "2px 0 4px" }}>{companyStart} – {getText(firstRole.end || messages?.cv?.present || "Presente")}{companyDuration && <span style={{ opacity: 0.75 }}> · ({companyDuration})</span>}{firstRole.location && ` • ${firstRole.location}`}</p>

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
                            <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)", margin: "2px 0" }}>{role.start} – {getText(role.end || messages?.cv?.present || "Presente")}{(() => { const d = formatDuration(role.start, rawDate(role.end), locale); return d ? <span style={{ opacity: 0.75 }}> · ({d})</span> : null; })()}</p>
                            <RoleDescription text={getText(role.description)} fontSize={isPrint ? 10.5 : 13} isPrint={isPrint} printBudget={printBudget} readMore={readMore} readLess={readLess} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
                        <MaybeLink href={exp.website} company={exp.company}>{getText(exp.roles[0].role)}</MaybeLink>
                      </h3>
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
                      {exp.roles[0].start} – {getText(exp.roles[0].end || messages?.cv?.present || "Presente")}{companyDuration && <span style={{ opacity: 0.75 }}> · ({companyDuration})</span>}{exp.roles[0].location && ` • ${exp.roles[0].location}`}
                    </p>
                    <RoleDescription text={getText(exp.roles[0].description)} fontSize={isPrint ? 10.5 : 13} isPrint={isPrint} printBudget={printBudget} readMore={readMore} readLess={readLess} />
                  </>
                )}
              </div>
            </div>

            {compIdx < experience.length - 1 && <div style={{ height: 1, background: "var(--surface-card-border)", margin: isPrint ? "5px 0" : "12px 0" }} />}
          </div>
          );
        })}
      </div>
  </section>
  );
}
