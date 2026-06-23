interface Block {
  title: string;
  body: string;
}

interface Props {
  blocks: Block[];
}

import { useLocale } from "@/i18n/LocaleContext";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

export function HowIThink({ blocks }: Props) {
  const { messages } = useLocale();
  return (
    <section className="section-standard">
      {/* Header */}
      <Reveal className="section-header-compact">
        <p className="section-subtitle">{messages.think?.header || "// 03_FILOSOFÍA"}</p>
        <h2 className="section-title">{messages.think?.title || "Cómo pienso"}</h2>
      </Reveal>

      {/* Blocks grid */}
      <Stagger className="think-grid">
        {blocks.map((block, i) => (
          <StaggerItem key={i} className="think-card">
            {/* Number */}
            <span className="think-card-number">0{i + 1}</span>

            {/* Accent dot */}
            <div className="think-card-dot" />

            <h3 className="think-card-title">{block.title}</h3>
            <p className="think-card-copy">{block.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
