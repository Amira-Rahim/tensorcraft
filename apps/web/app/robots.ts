import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // `/certificates/` is intentionally NOT disallowed — share pages are
  // public, JSON-LD-decorated `EducationalOccupationalCredential` records
  // that should be crawlable for SEO. Admin + auth + dashboard surfaces
  // are gated so they never enter the index.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
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
