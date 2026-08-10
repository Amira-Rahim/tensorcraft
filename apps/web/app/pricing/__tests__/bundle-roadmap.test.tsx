import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PRICING } from "@tensorcraft/shared";
import { BundleRoadmap } from "../bundle-roadmap";

/**
 * BundleRoadmap is the informational replacement for the three disabled
 * bundle cards. Only `free` and `single` are buyable while one theme is
 * launched, so a five-card grid whose only live paid card was the second
 * cheapest anchored $59 as a stripped entry tier, and the dead CTAs read
 * "Available when more themes launch" — an implied schedule the 200-user
 * theme-2 gate does not promise.
 *
 * These tests pin the two properties that make the strip honest: it states
 * the ladder without selling it, and it never implies a date.
 */
describe("BundleRoadmap (bundle ladder, stated not sold)", () => {
  it("renders the three bundle prices as information", () => {
    render(<BundleRoadmap />);
    const strip = screen.getByTestId("bundle-roadmap");
    expect(strip).toHaveTextContent("$99");
    expect(strip).toHaveTextContent("$129");
    expect(strip).toHaveTextContent("$159");
  });

  it("quotes the canonical PRICING ladder, never a hardcoded literal", () => {
    render(<BundleRoadmap />);
    const strip = screen.getByTestId("bundle-roadmap");
    expect(strip).toHaveTextContent(`$${PRICING.twoBundle.price}`);
    expect(strip).toHaveTextContent(`$${PRICING.threeBundle.price}`);
    expect(strip).toHaveTextContent(`$${PRICING.allFive.price}`);
    // The anchor: the strip has to name what IS buyable, at the real price,
    // or it just lists three numbers nobody can act on. Asserted as two
    // independent facts rather than one phrase — an earlier version pinned
    // the literal wording "Deep Orbit at $59" and went red on a pure copy
    // edit that changed nothing about the guarantee.
    expect(strip).toHaveTextContent("Deep Orbit");
    expect(strip).toHaveTextContent(`$${PRICING.single.price}`);
  });

  it("offers no purchase affordance, not even a disabled one", () => {
    render(<BundleRoadmap />);
    const strip = screen.getByTestId("bundle-roadmap");
    expect(strip.querySelectorAll("button")).toHaveLength(0);
    expect(strip.querySelectorAll('a[href*="checkout"]')).toHaveLength(0);
  });

  it("does not imply a delivery schedule", () => {
    render(<BundleRoadmap />);
    expect(screen.getByTestId("bundle-roadmap")).not.toHaveTextContent(
      /coming soon|soon|shortly|next month|this year/i,
    );
  });

  it("conveys the unavailable state in text, not colour alone (WCAG 1.4.1)", () => {
    render(<BundleRoadmap />);
    const strip = screen.getByTestId("bundle-roadmap");
    for (const row of Array.from(
      strip.querySelectorAll("[data-bundle-tier]"),
    )) {
      expect(row.textContent).toMatch(/not (yet )?(for sale|available)/i);
    }
    expect(strip.querySelectorAll("[data-bundle-tier]")).toHaveLength(3);
  });
});
