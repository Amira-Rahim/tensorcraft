import { describe, it, expect, vi } from "vitest";

// Mock next/font so layout doesn't try to load Google fonts at test time
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter-test" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono-test" }),
}));

// Mock all layout-level children components (RootLayout renders a tree of
// components with their own heavy imports — we only care about the <body>).
vi.mock("./components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("./components/nav", () => ({ Nav: () => null }));
vi.mock("./components/ticker", () => ({ Ticker: () => null }));
vi.mock("./components/cookie-consent", () => ({
  CookieConsent: () => null,
}));
vi.mock("./components/report-issue-button", () => ({
  ReportIssueButton: () => null,
}));
vi.mock("./components/site-footer", () => ({ SiteFooter: () => null }));
vi.mock("./components/analytics-provider", () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("./components/plausible-script", () => ({
  PlausibleScript: () => null,
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
});
