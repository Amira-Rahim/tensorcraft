import { describe, it, expect } from "vitest";
import { PRICING } from "@tensorcraft/shared";
import { worlds } from "@tensorcraft/worlds";
import { getWorldLessons, getLessonTotalMinutes } from "@tensorcraft/content";
import { buildCourseJsonLd } from "../course-jsonld";

/**
 * First coverage of the launched-world Course JSON-LD (2026-08-17), extracted
 * from page.tsx the same way pricing-jsonld.ts was: inline structured data in
 * an async server component had no tests, and that is how the pricing offers
 * shipped PreOrder for months.
 *
 * The trigger was a Search Console audit: the page emitted an otherwise valid
 * Course while missing offers.category, the one field Google's Course-info
 * rich result requires beyond the offer itself, so the page was ineligible
 * and GSC showed zero enhancements sitewide.
 */
describe("buildCourseJsonLd", () => {
  // The same basis page.tsx sums for the module map: lesson minutes plus
  // the minutes of every exercise embedded in the lesson.
  const totalMinutes = getWorldLessons("deep-orbit").reduce(
    (n, lesson) => n + getLessonTotalMinutes(lesson),
    0,
  );
  const jsonLd = buildCourseJsonLd(worlds["deep-orbit"], { totalMinutes });

  it("keeps the offer rich-result eligible: category is required by Google", () => {
    expect(jsonLd.offers.category).toBe("Paid");
    expect(jsonLd.offers["@type"]).toBe("Offer");
  });

  it("prices the offer from the single-world tier, as a string per schema.org", () => {
    expect(jsonLd.offers.price).toBe(String(PRICING.single.price));
    expect(jsonLd.offers.priceCurrency).toBe("USD");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });

  it("addresses the world detail page and the pricing page on the canonical host", () => {
    expect(jsonLd.url).toBe("https://tensorcraft.app/worlds/deep-orbit");
    expect(jsonLd.offers.url).toBe("https://tensorcraft.app/pricing");
  });

  it("carries a CourseInstance, unlike the coming-soon stub's Course", () => {
    // The stub omits hasCourseInstance on purpose (no schedule exists for
    // unshipped content). The launched world must keep one: it is the other
    // Course-info eligibility requirement alongside offers.category.
    expect(jsonLd.hasCourseInstance["@type"]).toBe("CourseInstance");
    expect(jsonLd.hasCourseInstance.courseMode).toBe("online");
    expect(jsonLd.hasCourseInstance.courseWorkload).toMatch(/^PT\d+H$/);
  });

  it("states the workload from the corpus, not a hardcode", () => {
    // "PT27H" sat hardcoded here for eight days while the corpus measured
    // 28 hours; the format-only assertion above let it drift (round 7,
    // 2026-09-13). The value must follow the summed minutes.
    expect(totalMinutes).toBeGreaterThan(0);
    expect(jsonLd.hasCourseInstance.courseWorkload).toBe(
      `PT${Math.round(totalMinutes / 60)}H`,
    );
  });

  it("states the audience for the 2026-08 rebrand: JavaScript developers", () => {
    // Query-register noun ("developers", not "engineers") per the house
    // vocabulary in docs/writing-quality-rubric.md: schema.org audience
    // fields match search phrasing.
    expect(jsonLd.audience).toEqual({
      "@type": "EducationalAudience",
      audienceType: "JavaScript developers",
    });
  });

  it("never reasserts academic credits", () => {
    // numberOfCredits was deliberately removed: schema.org defines it as
    // ACADEMIC credits, and the product disclaims accreditation
    // (compare/page.tsx). Guard against it creeping back.
    expect(jsonLd).not.toHaveProperty("numberOfCredits");
  });
});
