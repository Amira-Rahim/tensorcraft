export const SITE_URL = "https://tensorcraft.app";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function buildSiteIdentity() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Tensorcraft",
      url: SITE_URL,
      description:
        "Tensorcraft teaches machine learning to JavaScript developers through interactive stories and browser exercises.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "Tensorcraft",
      url: SITE_URL,
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID },
    },
  ];
}

/** Keep authored text inside the JSON-LD script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
