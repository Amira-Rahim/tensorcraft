import { describe, it, expect, vi } from "vitest";

// Mock next/font so layout doesn't try to load Google fonts at test time
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter-test" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono-test" }),
}));

// Mock all layout-level children components (RootLayout renders a tree of
// components with their own heavy imports, we only care about the <body>).
vi.mock("./components/world-provider", () => ({
  WorldProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("./components/nav", () => ({ Nav: () => null }));
vi.mock("./components/cookie-consent", () => ({
  CookieConsent: () => null,
}));
vi.mock("./components/consent-sync", () => ({ ConsentSync: () => null }));
vi.mock("./components/report-issue-button", () => ({
  ReportIssueButton: () => null,
}));
vi.mock("./components/site-footer", () => ({ SiteFooter: () => null }));
vi.mock("./components/analytics-provider", () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("../lib/supabase/session-listener", () => ({
  SessionListener: () => null,
}));
vi.mock("./components/session-toast", () => ({ SessionToast: () => null }));

describe("RootLayout", () => {
  it("renders body with font-sans class (Inter default) and html with font variables", async () => {
    const { default: RootLayout } = await import("./layout");
    const tree = RootLayout({ children: null });

    // tree is a React element: html > head/body
    // Find the body element in its children
    expect(tree.type).toBe("html");
    const htmlClassName = tree.props.className as string;
    expect(htmlClassName).toMatch(/--font-inter-test/);
    expect(htmlClassName).toMatch(/--font-jetbrains-mono-test/);

    // Walk children to find <body>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bodyEl = (tree.props.children as any[]).find(
      (c: { type?: string }) => c?.type === "body",
    );
    expect(bodyEl).toBeDefined();
    const bodyClass = bodyEl.props.className as string;
    expect(bodyClass).toMatch(/font-sans/);
    expect(bodyClass).toMatch(/min-h-screen/);
    expect(bodyClass).toMatch(/flex-col/);
  });

  // Google derives the SERP site-name line from three signals: the
  // WebSite JSON-LD, og:site_name, and the application-name meta. If any
  // drifts, search results show the bare domain "tensorcraft.app" instead
  // of "Tensorcraft". All three are invisible in the UI, so this test is
  // the only gate.
  it("carries all three site-name signals as 'Tensorcraft'", async () => {
    const { metadata, default: RootLayout } = await import("./layout");

    expect(metadata.applicationName).toBe("Tensorcraft");
    expect(metadata.openGraph?.siteName).toBe("Tensorcraft");

    const tree = RootLayout({ children: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headEl = (tree.props.children as any[]).find(
      (c: { type?: string }) => c?.type === "head",
    );
    expect(headEl).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonLdScript = (headEl.props.children as any[]).find(
      (c: { props?: { type?: string } }) =>
        c?.props?.type === "application/ld+json",
    );
    expect(jsonLdScript).toBeDefined();
    const graph = JSON.parse(
      jsonLdScript.props.dangerouslySetInnerHTML.__html as string,
    ) as Array<{ "@type": string; name?: string; url?: string }>;
    const webSite = graph.find((node) => node["@type"] === "WebSite");
    expect(webSite).toBeDefined();
    expect(webSite?.name).toBe("Tensorcraft");
    // Apex host, not www: the site-name lookup keys off the canonical
    // homepage (www 308s to apex since 2026-08-17).
    expect(webSite?.url).toBe("https://tensorcraft.app");
  });
});
