"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Icon } from "@/components/Icon";
import { useData } from "@/lib/useData";
import { useLocale } from "@/i18n/LocaleContext";

// Auto-fit tuning. The container is pinned to the A4 width and the print spacing
// rules are applied on screen too (see the <style> block), so the measured height
// equals the printed height — measurements are in true page pixels.
const PAGE_MM = 297; // A4 height
// We grow the experience column to fill the space the rest of the page leaves
// free, stopping this many pixels short of the page bottom. The fit targets the
// experience column directly (not the whole page) because the right column alone
// nearly fills the page — measuring the total height leaves no usable margin.
const SAFETY_PX = 10;
const SEARCH_STEP = 12; // binary-search stops once the budget window is this tight
const MAX_ITERS = 16;

// Run before paint in the browser (avoids a content flash), but fall back to a
// passive effect during SSR so React doesn't warn about useLayoutEffect.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function CVPrintPage() {
  const data = useData();
  const { profile, experience, education, languages, skills } = data;
  const { locale } = useLocale();

  const LABELS: Record<string, { email: string; location: string }> = {
    es: { email: "EMAIL:", location: "UBICACIÓN:" },
    en: { email: "EMAIL:", location: "LOCATION:" },
  };

  const HEADERS: Record<string, { education: string; languages: string; skills: string; achievements: string }> = {
    es: { education: "Formación", languages: "Idiomas", skills: "Skills", achievements: "Logros" },
    en: { education: "Education", languages: "Languages", skills: "Skills", achievements: "Achievements" },
  };

  const labels = LABELS[(locale as string) || "es"];
  const headers = HEADERS[(locale as string) || "es"];

  // Longest role description (current locale) → an upper bound for the budget:
  // any budget at/above this shows every bullet of every role.
  const fullBudget = useMemo(() => {
    const pick = (t: { es: string; en: string } | string) =>
      typeof t === "string" ? t : t[(locale as keyof typeof t)] || t.es;
    let max = 0;
    for (const exp of experience) {
      for (const role of exp.roles) max = Math.max(max, pick(role.description).length);
    }
    return Math.max(max, 1);
  }, [experience, locale]);

  // `budget` = max characters of description shown per role. Start at fullBudget
  // (everything visible); the auto-fit below shrinks it only if the page overflows.
  const [budget, setBudget] = useState(fullBudget);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Binary-search state machine driven across re-renders by the layout effect.
  const fit = useRef({ done: false, mode: "full" as "full" | "search", lo: 1, hi: fullBudget, iters: 0, chrome: null as number | null });

  const signalReady = () => {
    // The opener (CVPrintButton) waits for this flag before calling print(), so
    // printing happens only after the page has settled on its final layout.
    (window as unknown as { __cvPrintReady?: boolean }).__cvPrintReady = true;
  };

  // Measure only once web fonts are loaded — otherwise the fallback font's metrics
  // make the fit measure the wrong height and the print can overflow.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    const fonts = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    if (!fonts) {
      setFontsReady(true);
      return;
    }
    let cancelled = false;
    fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useIsoLayoutEffect(() => {
    const f = fit.current;
    if (f.done || !fontsReady) return;
    const container = containerRef.current;
    const ruler = rulerRef.current;
    const grid = gridRef.current;
    if (!container || !ruler || !grid) return;

    if (f.iters++ > MAX_ITERS) {
      f.done = true;
      signalReady();
      return;
    }

    const pxPerMm = ruler.getBoundingClientRect().height / 100;
    const pageH = pxPerMm * PAGE_MM;
    const expSection = grid.firstElementChild?.querySelector("section");
    const expH = expSection ? expSection.getBoundingClientRect().height : 0;

    // Chrome = everything on the page that isn't the two-column grid (header,
    // paddings, margins). It's constant, so capture it once. The experience
    // column can grow until it fills the page minus that chrome (and a safety gap).
    if (f.chrome == null) f.chrome = container.getBoundingClientRect().height - grid.getBoundingClientRect().height;
    const expBudgetPx = pageH - f.chrome - SAFETY_PX;

    if (f.mode === "full") {
      // Measured with every bullet visible.
      if (expH <= expBudgetPx) {
        f.done = true; // Everything already fits — keep all bullets.
        signalReady();
      } else {
        // Too tall: trim the least-important trailing bullets until the
        // experience column fills (but doesn't exceed) the space available to it.
        // We always aim for a single full page — a 2-column print layout doesn't
        // paginate cleanly onto a second.
        f.mode = "search";
        f.lo = 1; // floor: each role keeps its lead + at least one bullet
        f.hi = fullBudget;
        setBudget(Math.round((f.lo + f.hi) / 2));
      }
      return;
    }

    // mode === "search": converge on the largest budget that still fits the column.
    if (expH <= expBudgetPx) f.lo = budget;
    else f.hi = budget;

    if (f.hi - f.lo <= SEARCH_STEP) {
      if (budget !== f.lo) setBudget(f.lo); // settle on the largest fitting budget
      f.done = true;
      signalReady();
      return;
    }
    setBudget(Math.round((f.lo + f.hi) / 2));
  }, [budget, fullBudget, fontsReady]);

  return (
    <main style={{ minHeight: "100vh", paddingTop: 0, paddingBottom: 0 }}>
      {/* Invisible 100mm ruler: converts mm → px for the page-height math above. */}
      <div ref={rulerRef} aria-hidden style={{ position: "absolute", top: 0, left: 0, height: "100mm", width: 0, visibility: "hidden", pointerEvents: "none" }} />
      {/* Fixed to the A4 page width so the on-screen layout (and therefore the
          measured height) wraps exactly like the printed page — independent of
          the preview window width. box-sizing:border-box keeps padding inside. */}
      <div ref={containerRef} style={{ width: "210mm", maxWidth: "100%", margin: "0 auto", padding: "12mm 15mm" }}>
        {/* Header - Top Section */}
        <header style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid var(--surface-card-border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
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
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="mail" size={12} style={{ color: "var(--accent-cyan)" }} />
                    <span style={{ fontSize: 9, fontWeight: 600 }}>{labels.email}</span>
                    <a href={`mailto:${profile.contact.email}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {profile.contact.email}
                    </a>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="location_on" size={12} style={{ color: "var(--accent-cyan)" }} />
                    <span style={{ fontSize: 9, fontWeight: 600 }}>{labels.location}</span>
                    <span>{profile.contact.location}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 4 }}>
                  <a href={profile.contact.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 10, fontWeight: 600 }}>
                    <Icon name="work" size={14} />
                    LinkedIn
                  </a>
                  <a href={profile.contact.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 10, fontWeight: 600 }}>
                    <Icon name="code" size={14} />
                    GitHub
                  </a>
                  {profile.contact.website && (
                    <a href={profile.contact.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--accent-cyan)", fontSize: 10, fontWeight: 600 }}>
                      <Icon name="language" size={14} />
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            {/* Portrait */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {profile.portrait && (
                <img src={profile.portrait} alt="Portrait" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover" }} />
              )}
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-secondary)", textAlign: "center", maxWidth: 140 }}>
                {profile.motto}
              </p>
            </div>
          </div>
        </header>

        {/* Two Column Layout - Page 1 Optimized */}
        <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 20, pageBreakAfter: "auto", alignItems: "start" }}>
          {/* LEFT COLUMN - Experience */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: "100%" }}>
            <ExperienceSection experience={experience} isPrint={true} printBudget={budget} />
          </div>

          {/* RIGHT COLUMN - Education, Languages, Skills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Education */}
            <section style={{ pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Icon name="school" size={18} style={{ color: "var(--accent-cyan)" }} />
                <h3 style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                  {headers.education}
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
                  {headers.languages}
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
                  {headers.skills}
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
                  {headers.achievements}
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
        /* These spacing rules are applied on screen AND in print so the on-screen
           preview height equals the printed height — that's what lets the auto-fit
           above measure the real page and decide 1 vs 2 pages accurately. */
        header {
          margin-bottom: 7px !important;
          padding-bottom: 7px !important;
        }
        p {
          line-height: 1.35 !important;
          margin: 1px 0 !important;
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
            /* Drop the on-screen min-height:100vh so the printed document is
               exactly as tall as its content — otherwise the leftover space
               below the content spills into blank trailing pages. */
            min-height: 0 !important;
          }
          header {
            page-break-inside: avoid;
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
