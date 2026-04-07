import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/onboarding", "/settings", "/dashboard"],
    },
    sitemap: "https://tensorcraft.app/sitemap.xml",
  };
}
