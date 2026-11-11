import { describe, it, expect } from "vitest";
import { PRICING } from "@tensorcraft/shared";
import { worlds } from "@tensorcraft/worlds";
import { getWorldLessons, getLessonTotalMinutes } from "@tensorcraft/content";
import { buildCourseJsonLd } from "../course-jsonld";
import { FAQ_ITEMS } from "../../../faq-data";

/**
 * The launched-world Course description must agree with the current offer,
 * audience, and estimated workload shown to learners.
 */
describe("buildCourseJsonLd", () => {
  // The same basis page.tsx sums for the module map: lesson minutes plus
  // the minutes of every exercise embedded in the lesson.
  const totalMinutes = getWorldLessons("deep-orbit").reduce(
    (n, lesson) => n + getLessonTotalMinutes(lesson),
    0,
  );
  const jsonLd = buildCourseJsonLd(worlds["deep-orbit"], { totalMinutes });

  it("describes the full course as a paid offer", () => {
    expect(jsonLd.offers.category).toBe("Paid");
    expect(jsonLd.offers["@type"]).toBe("Offer");
  });

  it("prices the offer from the single-world tier", () => {
    expect(jsonLd.offers.price).toBe(String(PRICING.single.price));
    expect(jsonLd.offers.priceCurrency).toBe("USD");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
  });

  it("addresses the world detail page and the pricing page on the canonical host", () => {
    expect(jsonLd.url).toBe("https://tensorcraft.app/worlds/deep-orbit");
    expect(jsonLd.offers.url).toBe("https://tensorcraft.app/pricing");
  });

  it("describes online delivery and an estimated workload", () => {
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

  it("the FAQ quotes the same hours as the JSON-LD", () => {
    // The FAQ carried "about 27 hours" as a literal while the JSON-LD moved
    // to the computed 28 (round 7b, 2026-09-14). A prospect reads both.
    const hours = Math.round(totalMinutes / 60);
    const faq = FAQ_ITEMS.find((f) =>
      /How long does Deep Orbit take/.test(f.q),
    );
    expect(faq, "the duration FAQ exists").toBeDefined();
    expect(faq?.a).toContain(`about ${hours} hours`);
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
