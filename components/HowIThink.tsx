interface Block {
  title: string;
  body: string;
}

interface Props {
  blocks: Block[];
}

export function HowIThink({ blocks }: Props) {
  return (
    <section className="section-standard">
      {/* Header */}
      <div style={{ marginBottom: 64 }}>
        <p className="section-subtitle">
          // 03_FILOSOFÍA
        </p>
        <h2 className="section-title">
          Cómo pienso
        </h2>
      </div>

      {/* Blocks grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 2,
        }}
      >
        {blocks.map((block, i) => (
          <div
            key={block.title}
            style={{
              padding: "40px 36px",
              borderTop: "1px solid var(--surface-card-border)",
              borderLeft: i % 2 === 0 ? "none" : "1px solid var(--surface-card-border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Number */}
            <span
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 48,
                fontWeight: 800,
                color: "var(--surface-card-border)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              0{i + 1}
            </span>

            {/* Accent dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--accent-cyan)",
                marginBottom: 20,
                boxShadow: "0 0 12px var(--accent-cyan)",
              }}
            />

            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              {block.title}
            </h3>

            <p
              style={{
                fontSize: 15,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              {block.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
