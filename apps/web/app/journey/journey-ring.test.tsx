import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JOURNEY_ORDER, type WorldSlug } from "@tensorcraft/shared";
import type { JourneyWorldState } from "@/lib/journey-progress";
import { JourneyRing } from "./journey-ring";

// SceneCanvas draws on canvas + rAF; stub to a marker (same pattern as
// worlds/world-cards-grid.test.tsx). lib/scene-by-slug resolves its map
// against these stubs transitively.
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

function makeStates(
  overrides: Partial<Record<WorldSlug, Partial<JourneyWorldState>>> = {},
): JourneyWorldState[] {
  return JOURNEY_ORDER.map((slug, position) => ({
    slug,
    position,
    owned: false,
    completed: false,
    completedLessons: 0,
    totalLessons: 56,
    ...(overrides[slug] ?? {}),
  }));
}

describe("JourneyRing", () => {
  it("renders all five worlds in ring order with exactly one hero", () => {
    render(
      <JourneyRing
        worldStates={makeStates()}
        recommendedNext={null}
        showProgress={false}
      />,
    );
    const nodes = JOURNEY_ORDER.map((slug) =>
      screen.getByTestId(`journey-node-${slug}`),
    );
    expect(nodes).toHaveLength(5);
    expect(
      nodes.filter((n) => n.getAttribute("data-variant") === "hero"),
    ).toHaveLength(1);
    expect(
      nodes.filter((n) => n.getAttribute("data-variant") === "row"),
    ).toHaveLength(4);
  });

  it("falls back to the first launched world as hero for guests, with Start and no meter", () => {
    render(
      <JourneyRing
        worldStates={makeStates()}
        recommendedNext={null}
        showProgress={false}
      />,
    );
    const hero = screen.getByTestId("journey-node-deep-orbit");
    expect(hero.getAttribute("data-variant")).toBe("hero");
    expect(hero.getAttribute("data-recommended")).toBeNull();
    expect(within(hero).getByText("Start →")).toBeInTheDocument();
    expect(within(hero).queryByRole("progressbar")).toBeNull();
  });

  it("makes the recommended world the hero and clamps orphan-inflated progress", () => {
    render(
      <JourneyRing
        worldStates={makeStates({
          // 60 > 56: world_progress can carry rows for re-slugged lessons;
          // the bar must clamp at 100 instead of overflowing its track.
          "deep-orbit": { owned: true, completedLessons: 60 },
        })}
        recommendedNext="deep-orbit"
        showProgress
      />,
    );
    const hero = screen.getByTestId("journey-node-deep-orbit");
    expect(hero.getAttribute("data-variant")).toBe("hero");
    expect(hero.getAttribute("data-recommended")).toBe("true");
    expect(within(hero).getByText("Continue →")).toBeInTheDocument();
    expect(
      within(hero).getByRole("progressbar").getAttribute("aria-valuenow"),
    ).toBe("100");
  });

  it("gives a coming-soon hero the waitlist action and no meter", () => {
    render(
      <JourneyRing
        worldStates={makeStates({
          "deep-orbit": { owned: true, completed: true, completedLessons: 56 },
        })}
        recommendedNext="neon-protocol"
        showProgress
      />,
    );
    const hero = screen.getByTestId("journey-node-neon-protocol");
    expect(hero.getAttribute("data-variant")).toBe("hero");
    expect(within(hero).getByText("Join waitlist →")).toBeInTheDocument();
    expect(within(hero).queryByRole("progressbar")).toBeNull();
    // The finished world is now a row that says Complete, without a
    // redundant full meter next to the label.
    const finished = screen.getByTestId("journey-node-deep-orbit");
    expect(finished.getAttribute("data-variant")).toBe("row");
    expect(within(finished).getByText("Complete")).toBeInTheDocument();
    expect(within(finished).queryByRole("progressbar")).toBeNull();
  });

  it("links every node to its world page and marks unlaunched ones for screen readers", () => {
    render(
      <JourneyRing
        worldStates={makeStates()}
        recommendedNext={null}
        showProgress={false}
      />,
    );
    for (const slug of JOURNEY_ORDER) {
      const node = screen.getByTestId(`journey-node-${slug}`);
      expect(node.getAttribute("href")).toBe(`/worlds/${slug}`);
    }
    expect(
      screen
        .getByTestId("journey-node-neon-protocol")
        .getAttribute("aria-label"),
    ).toMatch(/\(coming soon\)$/);
    expect(
      screen.getByTestId("journey-node-deep-orbit").getAttribute("aria-label"),
    ).not.toMatch(/coming soon/);
  });

  it("closes the ring with a 05 → 01 thread", () => {
    const { container } = render(
      <JourneyRing
        worldStates={makeStates()}
        recommendedNext={null}
        showProgress={false}
      />,
    );
    expect(container.textContent).toContain("05 → 01");
  });
});
