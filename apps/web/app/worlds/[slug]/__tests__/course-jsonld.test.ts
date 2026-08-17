import { describe, it, expect } from "vitest";
import { PRICING } from "@tensorcraft/shared";
import { worlds } from "@tensorcraft/worlds";
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
  const jsonLd = buildCourseJsonLd(worlds["deep-orbit"]);

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

  it("never reasserts academic credits", () => {
    // numberOfCredits was deliberately removed: schema.org defines it as
    // ACADEMIC credits, and the product disclaims accreditation
    // (compare/page.tsx). Guard against it creeping back.
    expect(jsonLd).not.toHaveProperty("numberOfCredits");
  });
});
