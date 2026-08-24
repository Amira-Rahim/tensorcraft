import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

// Stub next/link so render works without the Next router.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const COMING_SOON = [
  { slug: "neon-protocol", name: "Neon Protocol" },
  { slug: "signal-ward", name: "Signal Ward" },
  { slug: "nova-canvas", name: "Nova Canvas" },
  { slug: "terra-grid", name: "Terra Grid" },
];

describe("LearnPage world links", () => {
  it("links the launched world", () => {
    render(<LearnPage />);
    expect(screen.getByRole("link", { name: "Deep Orbit" })).toHaveAttribute(
      "href",
      "/worlds/deep-orbit",
    );
  });

  it("lists coming-soon worlds as plain text, never links", () => {
    const { container } = render(<LearnPage />);
    for (const world of COMING_SOON) {
      // Name is present for SEO copy but carries no link.
      expect(screen.getByText(world.name)).toBeInTheDocument();
      expect(
        container.querySelector(`a[href="/worlds/${world.slug}"]`),
      ).toBeNull();
    }
  });
});

/* 2026-08-24 redesign coverage. The two suites above are the invariants the
   redesign must never break; everything below pins what it added. */

const FREE_LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

describe("LearnPage free-lesson CTAs", () => {
  it("renders the three tracked free-lesson CTAs", () => {
    // Hero, road (step 03), footer. The v2 mid-demo inline CTA was cut in
    // the busy-page pass (2026-08-24): the demo's own closing line hands
    // off to the road, which holds the button.
    render(<LearnPage />);
    for (const id of [
      "learn-cta-hero",
      "learn-cta-start-free",
      "learn-cta-footer",
    ]) {
      expect(screen.getByTestId(id)).toHaveAttribute("href", FREE_LESSON);
    }
  });
});

describe("LearnPage SEO payload", () => {
  it("keeps the query-cluster H1", () => {
    render(<LearnPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Learn Machine Learning with JavaScript/,
      }),
    ).toBeInTheDocument();
  });

  it("keeps the audit-mandated coming-soon literal", () => {
    // "No release dates announced yet" resolved the 2026-08-19 prelesson
    // audit's "ship in waves" tease finding; the literal must survive.
    const { container } = render(<LearnPage />);
    expect(container.textContent).toContain("No release dates announced yet");
  });

  it("keeps the gate-backed bridges claim", () => {
    // bridge-breaks.test.ts pins the corpus this sentence promises.
    const { container } = render(<LearnPage />);
    expect(container.textContent).toContain("where the analogy breaks");
  });

  it("emits BreadcrumbList, ItemList, and FAQPage JSON-LD", () => {
    const { container } = render(<LearnPage />);
    const types = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).map((script) => JSON.parse(script.innerHTML)["@type"]);
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("ItemList");
    expect(types).toContain("FAQPage");
  });

  it("renders the FAQ band", () => {
    render(<LearnPage />);
    expect(screen.getByTestId("learn-faq")).toBeInTheDocument();
  });
});

describe("LearnPage gateway bands", () => {
  it("teaches one real bridge, breaks panel included", () => {
    const { container } = render(<LearnPage />);
    const bridge = screen.getByTestId("learn-taught-bridge");
    expect(bridge).toBeInTheDocument();
    expect(bridge.textContent).toContain("Component state");
    expect(container.textContent).toContain("where it breaks");
  });

  it("renders the full course map with the free door on module 1", () => {
    const { container } = render(<LearnPage />);
    expect(screen.getByTestId("learn-course-map")).toBeInTheDocument();
    const rows = container.querySelectorAll(
      '[data-testid^="learn-map-module-"]',
    );
    // The map is the real curriculum, same source as /pricing; a count
    // drift here means the content package and the marketing map split.
    expect(rows.length).toBeGreaterThanOrEqual(11);
    expect(
      container.querySelector(
        '[data-testid="learn-map-module-foundations"] a[href="/worlds/deep-orbit/foundations/introduction-to-tensors"]',
      ),
    ).not.toBeNull();
  });

  it("renders the crew strip", () => {
    render(<LearnPage />);
    expect(screen.getByTestId("learn-crew-strip")).toBeInTheDocument();
  });
});

describe("LearnPage demo band", () => {
  it("stays on the static placeholder without IntersectionObserver", () => {
    // jsdom has no IO; the tfjs demo must never mount here (the IO gate is
    // the page's script-budget defence, see demo-band.tsx).
    render(<LearnPage />);
    expect(screen.getByTestId("learn-demo-placeholder")).toBeInTheDocument();
  });
});
