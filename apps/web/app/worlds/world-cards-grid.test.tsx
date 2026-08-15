import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorldCardsGrid, type WorldCardData } from "./world-cards-grid";

// SceneCanvas draws on canvas + rAF; stub to a marker so the composite
// order (plate under canvas) can be asserted without a real context.
vi.mock("@tensorcraft/ui/effects", () => ({
  SceneCanvas: ({ className }: { className?: string }) => (
    <div data-testid="scene-canvas-stub" className={className} />
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
    price: 59,
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
