import { describe, expect, it, vi } from "vitest";
import robots from "./robots";
import { metadata as dashboardMetadata } from "./dashboard/layout";
import { metadata as adminMetadata } from "./admin/digest/page";
import { generateMetadata as capstoneMetadata } from "./worlds/[slug]/capstone/page";
import config from "../next.config";

vi.mock("@next/bundle-analyzer", () => ({
  default: () => (config: unknown) => config,
}));
vi.mock("@sentry/nextjs/config", () => ({
  withSentryConfig: (config: unknown) => config,
}));

describe("crawler access and indexing policy", () => {
  it("lets crawlers read noindex directives and fetch social card images", () => {
    const policy = robots();
    expect(policy.sitemap).toBe("https://tensorcraft.app/sitemap.xml");
    expect(policy.rules).toEqual({
      userAgent: "*",
      allow: ["/", "/api/og"],
      disallow: ["/api/"],
    });
  });

  it.each([
    ["dashboard", dashboardMetadata],
    ["admin", adminMetadata],
  ])("keeps %s out of search", (_name, metadata) => {
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("keeps the authenticated capstone out of search", async () => {
    const metadata = await capstoneMetadata({
      params: Promise.resolve({ slug: "deep-orbit" }),
    });
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("sends noindex for static previews while keeping campaign cases indexable", async () => {
    const headers = await config.headers!();
    const noindexRules = headers.filter((rule) =>
      rule.headers.some(
        (header) =>
          header.key.toLowerCase() === "x-robots-tag" &&
          header.value.includes("noindex"),
      ),
    );
    for (const source of ["/design-previews/:path*", "/design/:path*"]) {
      expect(noindexRules.some((rule) => rule.source === source)).toBe(true);
    }
    expect(
      noindexRules.some((rule) =>
        ["/(.*)", "/:path*", "/cases/:path*"].includes(rule.source),
      ),
    ).toBe(false);
  });
});
