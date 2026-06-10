import type { MetadataRoute } from "next";
import { themeSlugs } from "@tensorcraft/themes";
import { BRIDGES, isLaunched } from "@tensorcraft/shared";
import { getThemeLessons, getPosts } from "@tensorcraft/content";

const BASE_URL = "https://tensorcraft.app";

// Phased sitemap to address "Discovered, currently not indexed" in Search
// Console (414 URLs as of 2026-04-27). New domains have small crawl budgets;
// listing 400+ URLs causes Google to defer most. Phase "core" lists ~22
// high-value URLs so the budget concentrates on landing/theme/index pages.
// Flip to "full" after Search Console shows the core set indexed.
// Lessons/glossary/bridge-concept pages stay reachable via internal links -
// only their sitemap inclusion is deferred.
const SITEMAP_PHASE: "core" | "full" = "core";

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
    ...getPosts().map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/glossary`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/extras`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
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

  // Theme pages: launched themes carry a higher priority; coming-soon stubs
  // (which render a teaser + waitlist form) get a lower priority so the
  // launched theme outranks them in search budget allocation.
  const themeRoutes: MetadataRoute.Sitemap = themeSlugs.map((slug) => ({
    url: `${BASE_URL}/themes/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: isLaunched(slug) ? 0.9 : 0.4,
  }));

  // Capstone pages exist only for launched themes, coming-soon routes 404.
  const capstoneRoutes: MetadataRoute.Sitemap = themeSlugs
    .filter((slug) => isLaunched(slug))
    .map((slug) => ({
      url: `${BASE_URL}/themes/${slug}/capstone`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  if (SITEMAP_PHASE === "core") {
    return [...staticRoutes, ...themeRoutes, ...capstoneRoutes];
  }

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

  // Lesson pages exist only for launched themes, coming-soon routes 404.
  const lessonRoutes: MetadataRoute.Sitemap = themeSlugs
    .filter((slug) => isLaunched(slug))
    .flatMap((slug) =>
      getThemeLessons(slug).map((lesson) => ({
        url: `${BASE_URL}/themes/${slug}/${lesson.moduleId}/${lesson.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );

  // Extras lessons (math-deep-dive + classical-ml + ethics + python-bridge)
  const extrasRoutes: MetadataRoute.Sitemap = getThemeLessons("shared").map(
    (lesson) => ({
      url: `${BASE_URL}/extras/${lesson.moduleId}/${lesson.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    }),
  );

  return [
    ...staticRoutes,
    ...themeRoutes,
    ...capstoneRoutes,
    ...lessonRoutes,
    ...extrasRoutes,
    ...glossaryRoutes,
  ];
}
