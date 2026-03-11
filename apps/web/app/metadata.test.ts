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
import { metadata as termsMetadata } from "./terms/page";
import { metadata as privacyMetadata } from "./privacy/page";

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

  describe("no duplicate titles", () => {
    it("layout, terms, and privacy have unique titles", () => {
      const titles = [
        String(layoutMetadata.title),
        String(termsMetadata.title),
        String(privacyMetadata.title),
      ];
      const unique = new Set(titles);
      expect(unique.size).toBe(titles.length);
    });
  });
});
