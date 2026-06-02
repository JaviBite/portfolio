"use client";

import { HeroSection } from "@/components/HeroSection";
import { StackSection } from "@/components/StackSection";
import { ProjectsPreview } from "@/components/ProjectsPreview";
import { HowIThink } from "@/components/HowIThink";
import { useData } from "@/lib/useData";

export default function HomePage() {
  const data = useData();

  return (
    <main className="bg-grid main-layout">
      <HeroSection profile={data.profile} />
      <StackSection />
      <ProjectsPreview projects={data.projects.slice(0, 3)} />
      <HowIThink blocks={data.howIThink} />
    </main>
  );
}
