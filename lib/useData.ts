"use client";

import { useMemo } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import rawData from "./data.json";

type Locale = "es" | "en";

// Helper to extract translated value from bilingual field
function getTranslated<T extends Record<string, any>>(field: T | string | undefined, locale: Locale): any {
  if (typeof field === "string") {
    return field;
  }
  if (typeof field === "object" && field !== null) {
    return field[locale] || field["en"] || field["es"];
  }
  return field;
}

export function useData() {
  const { locale } = useLocale();

  // Get all data with translations applied (recomputed only when locale changes)
  return useMemo(() => {
    return {
      ...rawData,
      profile: {
        ...rawData.profile,
        title: getTranslated(rawData.profile.title, locale),
        motto: getTranslated(rawData.profile.motto, locale),
        bio: getTranslated(rawData.profile.bio, locale),
        achievements: rawData.profile.achievements.map((a) =>
          getTranslated(a, locale)
        ),
      },
      experience: rawData.experience.map((exp) => ({
        ...exp,
        roles: exp.roles.map((role) => ({
          ...role,
          role: getTranslated(role.role, locale),
          description: getTranslated(role.description, locale),
        })),
      })),
      education: rawData.education.map((edu) => ({
        ...edu,
        degree: getTranslated(edu.degree, locale),
        specialization: getTranslated(edu.specialization, locale),
      })),
      languages: rawData.languages.map((lang) => ({
        ...lang,
        language: getTranslated(lang.language, locale),
        note: getTranslated(lang.note, locale),
      })),
      skills: rawData.skills.map((skill) => ({
        ...skill,
        category: getTranslated(skill.category, locale),
        items: skill.items.map((item) => {
          // Si es string, devolverlo tal cual
          if (typeof item === "string") return item;
          // Si tiene propiedades como name/level, devolverlo sin procesar
          if (typeof item === "object" && ("name" in item || "level" in item)) {
            return { ...item };
          }
          // Si es objeto bilingüe, extraer la traducción
          return getTranslated(item, locale);
        }),
      })),
      howIThink: rawData.howIThink.map((block) => ({
        ...block,
        title: getTranslated(block.title, locale),
        body: getTranslated(block.body, locale),
      })),
      projects: rawData.projects.map((project) => ({
        ...project,
        client: getTranslated(project.client, locale),
        tag: getTranslated(project.tag, locale),
        description: getTranslated(project.description, locale),
        start: typeof project.start === "object" ? getTranslated(project.start, locale) : project.start,
        end: typeof project.end === "object" ? getTranslated(project.end, locale) : project.end,
      })),
      homelab: {
        ...rawData.homelab,
        description: getTranslated(rawData.homelab.description, locale),
      },
    };
  }, [locale]);
}
