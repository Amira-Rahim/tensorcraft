const SITE = "https://tensorcraft.app";

/**
 * JSON-LD builders for /learn, extracted so they are testable: async server
 * components do not render under vitest (same reason course-jsonld.ts and
 * pricing-jsonld.ts are modules, not inline page code).
 *
 * Deliberately NOT Course markup: Course objects live only on the page that
 * describes the course (/worlds/[slug]), a rule earned on 2026-07-25 when
 * five per-world Course blocks were pulled out of the root layout.
 */
export function buildLearnBreadcrumbs() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: [
      {
        "@type": "ListItem" as const,
        position: 1,
        name: "Home",
        item: SITE,
      },
      {
        "@type": "ListItem" as const,
        position: 2,
        name: "Learn",
        item: `${SITE}/learn`,
      },
    ],
  };
}

/**
 * VideoObject for the trailer: the page is video-first (owner ruling
 * 2026-08-27), so the film itself is the indexable object. Emitted only
 * when the trailer assets exist (page passes the gate through), matching
 * the visible-content rule that governs all schema here.
 */
export function buildLearnVideo() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject" as const,
    name: "How Tensorcraft works",
    description:
      "ML lessons for JavaScript developers, set aboard the research ship Archimedes. Help the crew investigate a signal while writing and running code in your browser.",
    thumbnailUrl: [`${SITE}/media/learn-trailer-poster.webp`],
    contentUrl: `${SITE}/media/learn-trailer.mp4`,
    uploadDate: "2026-08-27",
    duration: "PT1M12S",
  };
}
