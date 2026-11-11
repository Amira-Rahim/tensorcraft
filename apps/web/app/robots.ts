import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Crawlers must reach HTML pages to read their noindex metadata.
  // Authentication and purchase checks control access to private content.
  // robots.txt controls crawling and cannot guarantee removal from an index.
  return {
    rules: {
      userAgent: "*",
      // `/api/og` must be allowed explicitly. Every OG and Twitter card image
      // on the site is generated at `/api/og?...` (root layout, pricing,
      // privacy, terms, learn, blog, worlds, capstone, lessons,
      // certificates), so the blanket `/api/` disallow below was telling
      // every crawler and social scraper not to fetch any of them - every
      // share card sitewide would render imageless. More specific Allow rules
      // win over broader Disallow rules in Google's and Bing's matchers.
      allow: ["/", "/api/og"],
      disallow: ["/api/"],
    },
    sitemap: "https://tensorcraft.app/sitemap.xml",
  };
}
