import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // `/certificates/` is intentionally NOT disallowed, share pages are
  // public, JSON-LD-decorated `EducationalOccupationalCredential` records
  // that should be crawlable for SEO. Admin + auth + dashboard surfaces
  // are gated so they never enter the index.
  return {
    rules: {
      userAgent: "*",
      // `/api/og` must be allowed explicitly. Every OG and Twitter card image
      // on the site is generated at `/api/og?...` (root layout, pricing,
      // privacy, terms, learn, blog, themes, capstone, lessons, extras,
      // certificates), so the blanket `/api/` disallow below was telling
      // every crawler and social scraper not to fetch any of them — every
      // share card sitewide would render imageless. More specific Allow rules
      // win over broader Disallow rules in Google's and Bing's matchers.
      allow: ["/", "/api/og"],
      disallow: [
        "/api/",
        "/auth/",
        "/onboarding",
        "/settings",
        "/dashboard",
        "/admin",
      ],
    },
    sitemap: "https://tensorcraft.app/sitemap.xml",
  };
}
