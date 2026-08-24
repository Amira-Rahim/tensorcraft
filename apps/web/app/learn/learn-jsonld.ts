import { worlds } from "@tensorcraft/worlds";
import { WORLD_SLUGS, isLaunched } from "@tensorcraft/shared";

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
 * ItemList of the five courses. `item.url` mirrors the on-page link policy:
 * launched worlds link to their world page, coming-soon worlds are inert
 * everywhere (world-cards-grid precedent, pinned by page.test.tsx), so their
 * list entries carry a name and nothing else. Membership is derived from
 * `isLaunched`, so a world launch flips its url on without an edit here.
 */
export function buildLearnCourseList() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList" as const,
    name: "Tensorcraft courses",
    itemListElement: WORLD_SLUGS.map((slug, index) => {
      const world = worlds[slug];
      const name = world
        ? `${world.displayName}: ${world.specialization}`
        : slug;
      return {
        "@type": "ListItem" as const,
        position: index + 1,
        name,
        ...(isLaunched(slug) ? { url: `${SITE}/worlds/${slug}` } : {}),
      };
    }),
  };
}
