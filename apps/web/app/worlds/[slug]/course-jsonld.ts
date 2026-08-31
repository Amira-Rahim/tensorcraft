import { PRICING } from "@tensorcraft/shared";
import type { WorldManifest } from "@tensorcraft/worlds";

/**
 * Course structured data for a LAUNCHED world's detail page. The coming-soon
 * stub builds its own Course object without hasCourseInstance on purpose: an
 * instance would assert a schedule for content that has not shipped.
 *
 * Extracted from page.tsx (2026-08-17) for the same reason as
 * pricing/pricing-jsonld.ts: the object needs regression tests, and the
 * async server component around it does not render under vitest.
 */
export function buildCourseJsonLd(world: WorldManifest) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${world.displayName}: ${world.specialization}`,
    // Plain-language description: search snippets reach strangers with no
    // story context, so the manifest's story hook stays off structured data.
    description: `${world.displayName} is a story-driven machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Module 1 is free.`,
    provider: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    url: `https://tensorcraft.app/worlds/${world.slug}`,
    educationalLevel: "Intermediate",
    programmingLanguage: ["JavaScript", "TypeScript"],
    audience: {
      "@type": "EducationalAudience",
      audienceType: "JavaScript developers",
    },
    // `numberOfCredits: worldModules.length` was removed here. In schema.org
    // that property denotes ACADEMIC credits, so publishing 11 asserted an
    // accreditation this product explicitly disclaims elsewhere ("a completion
    // record, not an accreditation", compare/page.tsx:219-221). Module count
    // is already conveyed by the on-page content and courseWorkload.
    teaches: world.specialization,
    offers: {
      "@type": "Offer",
      // Google's Course-info rich result requires offers.category; every
      // other field here can be valid and the page is still ineligible
      // without it (confirmed against the live page, 2026-08-17). "Paid",
      // not "Partially Free": the $50 purchase IS the course, and module 1
      // is framed product-wide as a free preview with its own $0 offer in
      // the /pricing OfferCatalog.
      category: "Paid",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://tensorcraft.app/pricing",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // Sum of lesson + exercise estimatedMinutes frontmatter (1,729 min
      // as of 2026-07-19: 975 lesson + 754 exercise). Recompute when
      // minutes change: sum lesson+exercise estimatedMinutes / 60, round.
      courseWorkload: "PT29H",
    },
  };
}
