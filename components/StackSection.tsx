"use client";

import { useLocale } from "@/i18n/LocaleContext";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

export function StackSection() {
  const { messages } = useLocale();

  const stackDomains = [
    {
      key: "vision",
      color: "var(--accent-cyan)",
      icon: "👁",
    },
    {
      key: "ai",
      color: "var(--accent-purple)",
      icon: "🧠",
    },
    {
      key: "infra",
      color: "#22c55e",
      icon: "⚙️",
    },
    {
      key: "languages",
      color: "#f59e0b",
      icon: "⌨️",
    },
  ];
  return (
    <section className="section-standard">
      {/* Header */}
      <Reveal className="section-header-compact">
        <p className="section-subtitle">{messages.stack?.expertise_header || "// 01_EXPERTISE"}</p>
        <h2 className="section-title">{messages.stack?.title || "Stack & Expertise"}</h2>
        <p className="section-copy">{messages.stack?.subtitle || "Herramientas que uso en producción real. No teoría."}</p>
      </Reveal>

      {/* Grid */}
      <Stagger className="grid-auto-fit">
        {stackDomains.map(({ key, color, icon }) => {
          const domain = messages.stack?.domains?.[key as keyof typeof messages.stack.domains];
          const items = messages.stack?.items?.[key as keyof typeof messages.stack.items] || [];

          return (
            <StaggerItem
              key={key}
              className="block-card"
              style={{ "--accent-color": color } as React.CSSProperties & { "--accent-color": string }}
            >
              <div className="block-card-heading">
                <span className="domain-icon">{icon}</span>
                <h3 className="block-card-title">{domain}</h3>
              </div>

              <div className="chip-list">
                {items.map((item: string) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
