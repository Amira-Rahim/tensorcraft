import { PRICING } from "@tensorcraft/shared";
import type { WorldManifest } from "@tensorcraft/worlds";
import { ORGANIZATION_ID } from "@/lib/site-identity";

/**
 * Course structured data for a launched world's detail page, including
 * online delivery, estimated workload, and the current paid offer.
 * The coming-soon stub omits delivery information for unreleased content.
 *
 * Extracted from page.tsx (2026-08-17) for the same reason as
 * pricing/pricing-jsonld.ts: the object needs regression tests, and the
 * async server component around it does not render under vitest.
 */
export function buildCourseJsonLd(
  world: WorldManifest,
  opts: {
    /** Lesson + exercise estimatedMinutes for the whole world, summed by the
     *  caller on the same basis as the on-page module map. */
    totalMinutes: number;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `https://tensorcraft.app/worlds/${world.slug}#course`,
    name: `${world.displayName}: ${world.specialization}`,
    // Plain-language description: search snippets reach strangers with no
    // story context, so the manifest's story hook stays off structured data.
    description: `${world.displayName} is a story-driven machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Module 1 is free.`,
    provider: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
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
      // This offer describes the paid course. The pricing page describes
      // the free first module separately in its OfferCatalog.
      category: "Paid",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: "https://tensorcraft.app/pricing",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // Whole hours, ISO 8601 duration form, from the corpus at build time.
      // A hardcoded "PT27H" sat here from 2026-09-05 and drifted (the corpus
      // measured 1,654 minutes, 28 hours, by 2026-09-13) because the test
      // only checked the format; the value now follows the same sum the
      // module map shows and the test compares it against that sum.
      courseWorkload: `PT${Math.round(opts.totalMinutes / 60)}H`,
    },
  };
}
