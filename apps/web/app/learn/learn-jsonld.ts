import { INTRO_VIDEO } from "@/lib/intro-video";

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
    name: INTRO_VIDEO.title,
    description:
      "Tensorcraft teaches machine learning to JavaScript developers through courses set in different story worlds. Deep Orbit is the first available world, with four more coming soon. Write and run JavaScript in your browser to help its crew investigate a signal.",
    thumbnailUrl: [`${SITE}${INTRO_VIDEO.poster}`],
    contentUrl: `${SITE}${INTRO_VIDEO.src}`,
    uploadDate: INTRO_VIDEO.uploadDate,
    duration: `PT${INTRO_VIDEO.durationSeconds}S`,
  };
}
