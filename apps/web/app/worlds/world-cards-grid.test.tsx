import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorldCardsGrid, type WorldCardData } from "./world-cards-grid";

// SceneCanvas draws on canvas + rAF; stub to a marker so the composite
// order (plate under canvas) can be asserted without a real context.
// `hovered` is surfaced as a data attribute so the ignition wiring
// (card hover -> SceneCanvas hot) stays assertable on inert cards.
vi.mock("@tensorcraft/ui/effects", () => ({
  SceneCanvas: ({
    className,
    hovered,
  }: {
    className?: string;
    hovered?: boolean;
  }) => (
    <div
      data-testid="scene-canvas-stub"
      data-hovered={hovered ? "true" : "false"}
      className={className}
    />
  ),
  drawOrbit: () => undefined,
  drawNeonProtocol: () => undefined,
  drawSignalWard: () => undefined,
  drawNovaCanvas: () => undefined,
  drawTerraGrid: () => undefined,
}));

function makeCard(overrides: Partial<WorldCardData> = {}): WorldCardData {
  return {
    slug: "deep-orbit",
    displayName: "Deep Orbit",
    tagline: "Signals from the edge of the system.",
    specialization: "Time-series ML",
    primary: "#6BAA8A",
    owned: false,
    modulesCount: 11,
    lessonsCount: 56,
    price: 50,
    status: "live",
    ...overrides,
  };
}

describe("WorldCardsGrid hero plate", () => {
  it("grounds the hero card on its plate with the scene dimmed above it", () => {
    render(
      <WorldCardsGrid
        cards={[makeCard({ plateSrc: "/locations/deep-orbit/bridge.webp" })]}
      />,
    );
    const card = screen.getByTestId("world-card-deep-orbit");
    const plate = card.querySelector('img[data-testid="art-plate"]');
    expect(plate?.getAttribute("src")).toBe(
      "/locations/deep-orbit/bridge.webp",
    );
    expect(
      card.querySelector('[data-testid="scene-canvas-stub"]')?.className,
    ).toContain("opacity-50");
  });

  it("renders no plate without a src, byte-identical to before", () => {
    render(<WorldCardsGrid cards={[makeCard()]} />);
    expect(screen.queryByTestId("art-plate")).toBeNull();
    expect(screen.getByTestId("scene-canvas-stub").className).not.toContain(
      "opacity-50",
    );
  });

  it("never grounds a muted coming-soon card, even with a src", () => {
    render(
      <WorldCardsGrid
        cards={[
          makeCard({
            slug: "neon-protocol",
            displayName: "Neon Protocol",
            status: "coming-soon",
            plateSrc: "/locations/deep-orbit/bridge.webp",
          }),
        ]}
      />,
    );
    expect(screen.queryByTestId("art-plate")).toBeNull();
  });
});

describe("WorldCardsGrid coming-soon interactivity", () => {
  function renderComingSoon() {
    render(
      <WorldCardsGrid
        cards={[
          makeCard({
            slug: "neon-protocol",
            displayName: "Neon Protocol",
            status: "coming-soon",
          }),
        ]}
      />,
    );
    return screen.getByTestId("world-card-neon-protocol");
  }

  it("renders a coming-soon card inert: no link, not-allowed cursor", () => {
    const card = renderComingSoon();
    expect(card.querySelector("a")).toBeNull();
    const shell = card.querySelector(".tc-world-card");
    expect(shell?.className).toContain("cursor-not-allowed");
  });

  it("keeps the hover treatment on an inert card", () => {
    const card = renderComingSoon();
    const shell = card.querySelector(".tc-world-card");
    // brutalist-hover lift + the muted-to-full opacity ramp both survive.
    expect(shell?.className).toContain("brutalist-hover");
    expect(shell?.className).not.toContain("opacity-80");
  });

  it("still ignites the scene on hover of an inert card", () => {
    const card = renderComingSoon();
    const shell = card.querySelector(".tc-world-card");
    const scene = screen.getByTestId("scene-canvas-stub");
    expect(scene.getAttribute("data-hovered")).toBe("false");
    fireEvent.mouseEnter(shell!);
    expect(scene.getAttribute("data-hovered")).toBe("true");
    fireEvent.mouseLeave(shell!);
    expect(scene.getAttribute("data-hovered")).toBe("false");
  });

  it("keeps the live card a real link to its world", () => {
    render(<WorldCardsGrid cards={[makeCard()]} />);
    const link = screen.getByTestId("world-card-deep-orbit").querySelector("a");
    expect(link?.getAttribute("href")).toBe("/worlds/deep-orbit");
  });

  it("opens the newsletter modal from the Notify me CTA", () => {
    renderComingSoon();
    expect(screen.queryByTestId("newsletter-modal")).toBeNull();
    fireEvent.click(screen.getByTestId("world-cta-neon-protocol"));
    expect(screen.getByTestId("newsletter-modal")).toBeInTheDocument();
  });
});
