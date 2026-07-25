import type { MetadataRoute } from "next";
import { themeSlugs } from "@tensorcraft/themes";
import { isLaunched } from "@tensorcraft/shared";
import { getThemeLessons, getModules, getPosts } from "@tensorcraft/content";

const BASE_URL = "https://tensorcraft.app";

// Phased sitemap to address "Discovered, currently not indexed" in Search
// Console (414 URLs as of 2026-04-27). New domains have small crawl budgets;
// listing 400+ URLs causes Google to defer most. Phase "core" lists ~22
// high-value URLs so the budget concentrates on landing/theme/index pages.
// Flip to "full" after Search Console shows the core set indexed.
// Lesson pages stay reachable via internal links -
// only their sitemap inclusion is deferred.
const SITEMAP_PHASE: "core" | "full" = "core";

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
      url: `${BASE_URL}/journey`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
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

  // Capstone pages are deliberately NOT listed.
  //
  // They exist only for launched themes, but capstone/page.tsx redirects any
  // request without a session to /auth — which is itself `noindex` AND
  // Disallow'd in robots.ts. So every crawler hitting a sitemap-listed
  // capstone URL got a 307 into a blocked page, which Google records as "Page
  // with redirect" and drops. Listing a URL that cannot be indexed spends
  // crawl budget to earn a penalty.
  //
  // Re-add these only if the capstone gains a public, signed-out preview.
  const capstoneRoutes: MetadataRoute.Sitemap = [];

  // FREE-module lessons join even the core phase (fresh-eyes rerun T3-32:
  // "treat the sitemap as the acquisition product"). They are the only
  // lesson pages fully readable signed-out, they are the pages organic
  // visitors can actually convert from, and there are only ~5 per launched
  // theme — no crawl-budget cost worth deferring. Paid lessons stay in the
  // "full" phase per the crawl-budget note above.
  const freeModuleLessonRoutes: MetadataRoute.Sitemap = themeSlugs
    .filter((slug) => isLaunched(slug))
    .flatMap((slug) => {
      const freeModule = getModules(slug).find((m) => m.order === 1);
      if (!freeModule) return [];
      return getThemeLessons(slug)
        .filter((lesson) => lesson.moduleId === freeModule.slug)
        .map((lesson) => ({
          url: `${BASE_URL}/themes/${slug}/${lesson.moduleId}/${lesson.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    });

  if (SITEMAP_PHASE === "core") {
    return [
      ...staticRoutes,
      ...themeRoutes,
      ...capstoneRoutes,
      ...freeModuleLessonRoutes,
    ];
  }

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
  ];
}
