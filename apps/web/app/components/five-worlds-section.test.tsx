import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FiveWorldsSection } from "./five-worlds-section";

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

// framer-motion's motion.div just needs to pass children through; the
// motion-only props are stripped so they don't land on the DOM node.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({
          children,
          initial: _initial,
          whileInView: _whileInView,
          viewport: _viewport,
          transition: _transition,
          ...props
        }: {
          children?: React.ReactNode;
          initial?: unknown;
          whileInView?: unknown;
          viewport?: unknown;
          transition?: unknown;
        }) => <div {...props}>{children}</div>,
    },
  ),
}));

// Canvas effects draw via rAF on a real 2d context; stub to markers.
vi.mock("@tensorcraft/ui/effects", () => ({
  OrbitCanvas: () => <div data-testid="orbit-canvas-stub" />,
  SceneCanvas: () => <div data-testid="scene-canvas-stub" />,
  drawNeonProtocol: () => undefined,
  drawSignalWard: () => undefined,
  drawNovaCanvas: () => undefined,
  drawTerraGrid: () => undefined,
}));

vi.mock("@tensorcraft/ui/art-plate", () => ({
  ArtPlate: () => <div data-testid="art-plate-stub" />,
}));

// Keep the flagship band canvas-only; the plate composite has its own
// coverage and is irrelevant to link semantics.
vi.mock("@/lib/location-art", () => ({
  heroPlateSrc: () => undefined,
}));

// The modal's own behavior (form, focus trap, submit) has its own
// coverage; here only the open wiring matters.
vi.mock("@/app/worlds/newsletter-modal", () => ({
  NewsletterModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="newsletter-modal-stub" /> : null,
}));

const COMING_SOON_SLUGS = [
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
];

describe("FiveWorldsSection coming-soon interactivity", () => {
  it("renders every coming-soon card inert: no link, not-allowed cursor", () => {
    render(<FiveWorldsSection />);
    for (const slug of COMING_SOON_SLUGS) {
      const card = screen.getByTestId(`coming-soon-card-${slug}`);
      expect(card.tagName).toBe("DIV");
      expect(card.className).toContain("cursor-not-allowed");
      expect(card.querySelector("a")).toBeNull();
    }
  });

  it("keeps the flagship as the section's only link", () => {
    render(<FiveWorldsSection />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/worlds/deep-orbit");
  });

  it("opens the newsletter modal from a coming-soon Notify me CTA", () => {
    render(<FiveWorldsSection />);
    expect(screen.queryByTestId("newsletter-modal-stub")).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /notify me/i })[0]);
    expect(screen.getByTestId("newsletter-modal-stub")).toBeInTheDocument();
  });

  // The visual suite masks every canvas on the landing page, and OrbitCanvas
  // is inset-0 over the whole flagship band, so the mask box swallows the
  // band's text and scrim: no screenshot diff can catch a scrim regression
  // here. This DOM assertion is the only gate on the band's art treatment.
  it("veils the flagship plate with the reading-column scrim", async () => {
    vi.resetModules();
    vi.doMock("@/lib/location-art", () => ({
      heroPlateSrc: () => "/locations/deep-orbit/bridge.webp",
    }));
    const { FiveWorldsSection: WithPlate } =
      await import("./five-worlds-section");
    const { container } = render(<WithPlate />);
    const scrim = container.querySelector(".tc-art-scrim");
    expect(scrim).not.toBeNull();
    expect(scrim!.className).toContain("tc-art-scrim-read");
  });
});

describe("FiveWorldsSection (one-section redesign, spec 2026-09-01)", () => {
  it("promotes Choose Your World to the section h2", () => {
    render(<FiveWorldsSection />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Choose Your World",
    );
  });

  it("renders none of the cut furniture", () => {
    // Cut per the spec: eyebrow row, intro paragraph, LIVE NOW badge,
    // per-card COMING SOON badges, the old "Five Worlds" h2.
    const { container } = render(<FiveWorldsSection />);
    expect(screen.queryByText(/live now/i)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    expect(screen.queryByText("Five Worlds")).toBeNull();
    expect(container.textContent).not.toMatch(/foundations track/i);
  });

  it("keeps the flagship link and all four Notify me waitlist entries", () => {
    render(<FiveWorldsSection />);
    expect(screen.getByText("Deep Orbit").closest("a")).toHaveAttribute(
      "href",
      "/worlds/deep-orbit",
    );
    expect(screen.getByText(/start module 1/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /notify me/i })).toHaveLength(
      4,
    );
  });
});
