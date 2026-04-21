import type { MetadataRoute } from "next";
import { themeSlugs } from "@tensorcraft/themes";
import { BRIDGES } from "@tensorcraft/shared";
import { getThemeLessons } from "@tensorcraft/content";

const BASE_URL = "https://tensorcraft.app";

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/themes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const themeRoutes: MetadataRoute.Sitemap = themeSlugs.map((slug) => ({
    url: `${BASE_URL}/themes/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Glossary term pages (both FE and ML terms)
  const glossarySlugs = new Set<string>();
  for (const b of BRIDGES) {
    glossarySlugs.add(slugify(b.mlConcept));
    glossarySlugs.add(slugify(b.feConcept));
  }
  const glossaryRoutes: MetadataRoute.Sitemap = Array.from(glossarySlugs).map(
    (term) => ({
      url: `${BASE_URL}/glossary/${term}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }),
  );

  // Bridge concept pages (one per bridge, keyed by ML concept)
  const bridgeRoutes: MetadataRoute.Sitemap = BRIDGES.map((b) => ({
    url: `${BASE_URL}/bridges/${slugify(b.mlConcept)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Individual lesson pages (55 lessons per theme × 5 themes = 275 total)
  const lessonRoutes: MetadataRoute.Sitemap = themeSlugs.flatMap((slug) =>
    getThemeLessons(slug).map((lesson) => ({
      url: `${BASE_URL}/themes/${slug}/${lesson.moduleId}/${lesson.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );

  // Capstone pages (one per theme)
  const capstoneRoutes: MetadataRoute.Sitemap = themeSlugs.map((slug) => ({
    url: `${BASE_URL}/themes/${slug}/capstone`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    {
      url: `${BASE_URL}/bridges`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...themeRoutes,
    ...lessonRoutes,
    ...capstoneRoutes,
    ...glossaryRoutes,
    ...bridgeRoutes,
  ];
}
