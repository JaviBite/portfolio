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
      <div className="section-header-compact">
        <p className="section-subtitle">// 03_FILOSOFÍA</p>
        <h2 className="section-title">Cómo pienso</h2>
      </div>

      {/* Blocks grid */}
      <div className="think-grid">
        {blocks.map((block, i) => (
          <div key={block.title} className="think-card" data-card-index={i}>
            {/* Number */}
            <span className="think-card-number">0{i + 1}</span>

            {/* Accent dot */}
            <div className="think-card-dot" />

            <h3 className="think-card-title">{block.title}</h3>
            <p className="think-card-copy">{block.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
