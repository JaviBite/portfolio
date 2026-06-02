"use client";

import { HeroSection } from "@/components/HeroSection";
import { StackSection } from "@/components/StackSection";
import { ProjectsPreview } from "@/components/ProjectsPreview";
import { HowIThink } from "@/components/HowIThink";
import data from "@/lib/data.json";

export default function HomePage() {
  return (
    <main className="bg-grid main-layout">
      <HeroSection profile={data.profile} />
      <StackSection />
      <ProjectsPreview projects={data.projects.slice(0, 3)} />
      <HowIThink blocks={data.howIThink} />
    </main>
  );
}
