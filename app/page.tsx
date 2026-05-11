import { HeroSection } from "@/components/HeroSection";
import { StackSection } from "@/components/StackSection";
import { ProjectsPreview } from "@/components/ProjectsPreview";
import { HowIThink } from "@/components/HowIThink";
import data from "@/lib/data.json";

export default function HomePage() {
  return (
    <main className="bg-grid" style={{ minHeight: "100vh", paddingTop: 60 }}>
      <HeroSection profile={data.profile} />
      <StackSection />
      <ProjectsPreview projects={data.projects.slice(0, 4)} />
      <HowIThink blocks={data.howIThink} />
    </main>
  );
}
