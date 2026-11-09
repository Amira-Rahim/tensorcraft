import type { MetadataRoute } from "next";
import { worldSlugs, worlds } from "@tensorcraft/worlds";
import { isLaunched } from "@tensorcraft/shared";
import { getWorldLessons, getModules, getPosts } from "@tensorcraft/content";
import { worldTrailer } from "@/lib/world-trailer";
import { buildWorldVideoJsonLd } from "./worlds/[slug]/world-video-jsonld";
import { buildLearnVideo } from "./learn/learn-jsonld";

const BASE_URL = "https://tensorcraft.app";

// Phased sitemap to address "Discovered, currently not indexed" in Search
// Console (414 URLs as of 2026-04-27). New domains have small crawl budgets;
// listing 400+ URLs causes Google to defer most. Phase "core" lists ~22
// high-value URLs so the budget concentrates on landing/world/index pages.
// Flip to "full" after Search Console shows the core set indexed.
// Lesson pages stay reachable via internal links -
// only their sitemap inclusion is deferred.
const SITEMAP_PHASE: "core" | "full" = "core";

export default function sitemap(): MetadataRoute.Sitemap {
  const introduction = buildLearnVideo();
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
      url: `${BASE_URL}/worlds`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      // Video-first page (2026-08-27): surface the trailer to video
      // search alongside the page's VideoObject JSON-LD.
      videos: [
        {
          title: introduction.name,
          thumbnail_loc: introduction.thumbnailUrl[0],
          description: introduction.description,
        },
      ],
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

  // World pages: launched worlds carry a higher priority; coming-soon stubs
  // (which render a teaser + waitlist form) get a lower priority so the
  // launched world outranks them in search budget allocation.
  const worldRoutes: MetadataRoute.Sitemap = worldSlugs.map((slug) => {
    // A world's own trailer surfaces to video search beside the page's
    // VideoObject JSON-LD, mirroring /learn's entry. Reading the fields
    // from the JSON-LD builder keeps the identity signals byte-identical,
    // and the same asset gate as the page means the sitemap never
    // advertises a film that is not deployed.
    const trailer = worldTrailer(slug);
    const video = trailer
      ? buildWorldVideoJsonLd(worlds[slug], trailer)
      : undefined;
    return {
      url: `${BASE_URL}/worlds/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: isLaunched(slug) ? 0.9 : 0.4,
      ...(video
        ? {
            videos: [
              {
                title: video.name,
                thumbnail_loc: video.thumbnailUrl[0],
                description: video.description,
              },
            ],
          }
        : {}),
    };
  });

  // Capstone pages are deliberately NOT listed.
  //
  // They exist only for launched worlds, but capstone/page.tsx redirects any
  // request without a session to /auth - which is itself `noindex` AND
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
  // world - no crawl-budget cost worth deferring. Paid lessons stay in the
  // "full" phase per the crawl-budget note above.
  const freeModuleLessonRoutes: MetadataRoute.Sitemap = worldSlugs
    .filter((slug) => isLaunched(slug))
    .flatMap((slug) => {
      const freeModule = getModules(slug).find((m) => m.order === 1);
      if (!freeModule) return [];
      return getWorldLessons(slug)
        .filter((lesson) => lesson.moduleId === freeModule.slug)
        .map((lesson) => ({
          url: `${BASE_URL}/worlds/${slug}/${lesson.moduleId}/${lesson.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    });

  if (SITEMAP_PHASE === "core") {
    return [
      ...staticRoutes,
      ...worldRoutes,
      ...capstoneRoutes,
      ...freeModuleLessonRoutes,
    ];
  }

  // Lesson pages exist only for launched worlds, coming-soon routes 404.
  const lessonRoutes: MetadataRoute.Sitemap = worldSlugs
    .filter((slug) => isLaunched(slug))
    .flatMap((slug) =>
      getWorldLessons(slug).map((lesson) => ({
        url: `${BASE_URL}/worlds/${slug}/${lesson.moduleId}/${lesson.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    );

  return [...staticRoutes, ...worldRoutes, ...capstoneRoutes, ...lessonRoutes];
}
