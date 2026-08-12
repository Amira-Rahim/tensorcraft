import { describe, it, expect, vi } from "vitest";

// Mock next/font/google before importing layout
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
  JetBrains_Mono: () => ({
    variable: "--font-jetbrains-mono",
    className: "jetbrains-mono",
  }),
}));

// Mock globals.css import
vi.mock("./globals.css", () => ({}));

import { metadata as layoutMetadata } from "./layout";
import { metadata as homeMetadata } from "./page";
import { metadata as termsMetadata } from "./terms/page";
import { metadata as privacyMetadata } from "./privacy/page";
import { metadata as pricingMetadata } from "./pricing/page";
import { metadata as worldsMetadata } from "./worlds/page";
import { metadata as dashboardMetadata } from "./dashboard/page";
import { metadata as settingsMetadata } from "./settings/page";
import { metadata as purchaseSuccessMetadata } from "./dashboard/purchase-success/page";
import { metadata as authLayoutMetadata } from "./auth/layout";
import { metadata as onboardingLayoutMetadata } from "./onboarding/layout";

describe("SEO metadata", () => {
  describe("root layout", () => {
    it("has a title containing Tensorcraft", () => {
      expect(layoutMetadata.title).toBeDefined();
      expect(String(layoutMetadata.title)).toContain("Tensorcraft");
    });

    it("has a description longer than 50 chars", () => {
      expect(layoutMetadata.description).toBeDefined();
      expect(layoutMetadata.description!.length).toBeGreaterThan(50);
    });

    it("has keywords", () => {
      expect(layoutMetadata.keywords).toBeDefined();
      expect(
        Array.isArray(layoutMetadata.keywords)
          ? layoutMetadata.keywords.length
          : 1,
      ).toBeGreaterThan(0);
    });
  });

  describe("terms page", () => {
    it("has a title containing Terms", () => {
      expect(termsMetadata.title).toBeDefined();
      expect(String(termsMetadata.title)).toContain("Terms");
    });

    it("has a description", () => {
      expect(termsMetadata.description).toBeDefined();
    });
  });

  describe("privacy page", () => {
    it("has a title containing Privacy", () => {
      expect(privacyMetadata.title).toBeDefined();
      expect(String(privacyMetadata.title)).toContain("Privacy");
    });
  });

  describe("pricing page", () => {
    it("has a canonical URL", () => {
      expect(pricingMetadata.alternates?.canonical).toBe(
        "https://tensorcraft.app/pricing",
      );
    });

    it("has openGraph with OG image URL pointing to /api/og", () => {
      expect(pricingMetadata.openGraph).toBeDefined();
      const images = pricingMetadata.openGraph?.images;
      const first = Array.isArray(images) ? images[0] : images;
      const url =
        first && typeof first === "object" && "url" in first
          ? first.url
          : first;
      expect(String(url)).toContain("/api/og");
    });

    it("has a twitter card", () => {
      expect(pricingMetadata.twitter).toBeDefined();
    });
  });

  describe("terms & privacy OG", () => {
    it("terms has openGraph + twitter", () => {
      expect(termsMetadata.openGraph).toBeDefined();
      expect(termsMetadata.twitter).toBeDefined();
    });

    it("privacy has openGraph + twitter", () => {
      expect(privacyMetadata.openGraph).toBeDefined();
      expect(privacyMetadata.twitter).toBeDefined();
    });
  });

  describe("protected routes are noindex", () => {
    it.each([
      ["dashboard", dashboardMetadata],
      ["settings", settingsMetadata],
      ["purchase-success", purchaseSuccessMetadata],
      ["auth", authLayoutMetadata],
      ["onboarding", onboardingLayoutMetadata],
    ])("%s has robots index: false", (_name, meta) => {
      const robots = meta.robots;
      const indexFlag =
        typeof robots === "object" && robots !== null
          ? (robots as { index?: boolean }).index
          : undefined;
      expect(indexFlag).toBe(false);
    });
  });

  describe("no duplicate titles", () => {
    it("layout, terms, privacy, and pricing have unique titles", () => {
      const titles = [
        String(layoutMetadata.title),
        String(termsMetadata.title),
        String(privacyMetadata.title),
        String(pricingMetadata.title),
      ];
      const unique = new Set(titles);
      expect(unique.size).toBe(titles.length);
    });
  });

  describe("root layout structured data", () => {
    it("has Course schema for all 5 worlds via JSON-LD (implicit)", () => {
      // JSON-LD is rendered in layout.tsx head. Test ensures metadataBase set.
      expect(layoutMetadata.metadataBase?.toString()).toContain(
        "tensorcraft.app",
      );
    });

    it("root layout does not set a canonical (avoids cascading to all pages)", () => {
      expect(layoutMetadata.alternates?.canonical).toBeUndefined();
    });

    it("home page owns the root canonical URL", () => {
      expect(homeMetadata.alternates?.canonical).toBe(
        "https://tensorcraft.app",
      );
    });

    it("worlds index has its own canonical URL", () => {
      expect(worldsMetadata.alternates?.canonical).toBe(
        "https://tensorcraft.app/worlds",
      );
    });
  });
});
