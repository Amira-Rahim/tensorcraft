import type { MetadataRoute } from "next";
import { worldSlugs } from "@tensorcraft/worlds";
import { isLaunched } from "@tensorcraft/shared";
import { getWorldLessons, getModules, getPosts } from "@tensorcraft/content";
import { buildLearnVideo } from "./learn/learn-jsonld";
import { GUIDES } from "@/lib/guides";
import { SITE_URL } from "@/lib/site-identity";

// Include public, canonical pages that a signed-out visitor can read.
// Paid lessons redirect to pricing, and capstones require a session, so
// neither belongs here. A larger sitemap cannot make those pages indexable.
// Omit lastModified when the content has no recorded update date. Build
// time would falsely describe every deployment as a content change.
export default function sitemap(): MetadataRoute.Sitemap {
  const introduction = buildLearnVideo();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
    },
    {
      url: `${SITE_URL}/pricing`,
    },
    {
      url: `${SITE_URL}/worlds`,
    },
    {
      url: `${SITE_URL}/learn`,
      // Video-first page (2026-08-27): surface the trailer to video
      // search alongside the page's VideoObject JSON-LD.
      videos: [
        {
          title: introduction.name,
          thumbnail_loc: introduction.thumbnailUrl[0],
          description: introduction.description,
          content_loc: introduction.contentUrl,
        },
      ],
    },
    {
      url: `${SITE_URL}/blog`,
    },
    { url: `${SITE_URL}/guides` },
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}${guide.path}`,
      lastModified: new Date(guide.updatedAt),
    })),
    ...getPosts().map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
    })),
    {
      url: `${SITE_URL}/about`,
    },
    {
      url: `${SITE_URL}/compare`,
    },
    {
      url: `${SITE_URL}/terms`,
    },
    {
      url: `${SITE_URL}/privacy`,
    },
  ];

  // Coming-soon worlds have public teaser pages and waitlist forms, so
  // their canonical pages remain discoverable alongside the launched world.
  // Course pages primarily describe the curriculum. Their optional trailer
  // stays on the page, while /learn is the primary video watch destination.
  const worldRoutes: MetadataRoute.Sitemap = worldSlugs.map((slug) => ({
    url: `${SITE_URL}/worlds/${slug}`,
  }));

  // Module 1 is fully accessible without a session or purchase. Keep this
  // selection aligned with the access checks in the lesson page.
  const freeModuleLessonRoutes: MetadataRoute.Sitemap = worldSlugs
    .filter((slug) => isLaunched(slug))
    .flatMap((slug) => {
      const freeModule = getModules(slug).find((m) => m.order === 1);
      if (!freeModule) return [];
      return getWorldLessons(slug)
        .filter((lesson) => lesson.moduleId === freeModule.slug)
        .map((lesson) => ({
          url: `${SITE_URL}/worlds/${slug}/${lesson.moduleId}/${lesson.slug}`,
        }));
    });

  return [...staticRoutes, ...worldRoutes, ...freeModuleLessonRoutes];
}
