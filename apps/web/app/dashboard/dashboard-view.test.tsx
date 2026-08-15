import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView, type DashboardProps } from "./dashboard-view";

// LossCurve draws to canvas; stub it so the view renders under jsdom. Keep
// the rest of the barrel real (SkillGenome pulls hexCorners from it).
vi.mock("@tensorcraft/ui/visualizations", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  LossCurve: () => <div data-testid="loss-curve-stub" />,
}));

function baseProps(overrides: Partial<DashboardProps> = {}): DashboardProps {
  return {
    displayName: "Test Operator",
    worldName: "Deep Orbit",
    worldSlug: "deep-orbit",
    modules: [
      {
        number: "01",
        name: "Foundations",
        status: "done",
        score: 98,
        formula: "y = Wx + b",
        slug: "foundations",
      },
    ],
    currentModule: null,
    worldProgressPercent: 9,
    worldPoints: { current: 9, total: 100 },
    currentStreak: 1,
    bestStreak: 2,
    averageScore: 98,
    bridges: [],
    activityDays: [],
    recentActivity: [],
    resumeUrl: null,
    totalModules: 11,
    completedModules: 1,
    genomeData: [],
    lossCurveData: { weekly: [] },
    ...overrides,
  };
}

describe("DashboardView station feed plate", () => {
  it("renders the plate panel in the module sidebar when given a src", () => {
    render(
      <DashboardView
        {...baseProps({
          plateSrc: "/locations/deep-orbit/dashboard-station.webp",
        })}
      />,
    );
    const plate = screen.getByTestId("art-plate");
    expect(plate.getAttribute("src")).toBe(
      "/locations/deep-orbit/dashboard-station.webp",
    );
  });

  it("renders no plate slot without a src, byte-identical to the old layout", () => {
    render(<DashboardView {...baseProps()} />);
    expect(screen.queryByTestId("art-plate")).toBeNull();
  });
});

describe("DashboardView mission patches", () => {
  it("shows the patch in place of the ✓ box on a done module", () => {
    render(
      <DashboardView
        {...baseProps({
          modules: [
            {
              number: "01",
              name: "Foundations",
              status: "done",
              score: 98,
              formula: "y = Wx + b",
              slug: "foundations",
              patchSrc: "/patches/deep-orbit/foundations.webp",
            },
          ],
        })}
      />,
    );
    expect(screen.getByTestId("module-patch").getAttribute("src")).toBe(
      "/patches/deep-orbit/foundations.webp",
    );
  });

  it("never previews a patch on an unfinished module", () => {
    render(
      <DashboardView
        {...baseProps({
          modules: [
            {
              number: "02",
              name: "Neural Networks",
              status: "active",
              score: null,
              formula: "σ(Wx + b)",
              slug: "neural-networks",
              patchSrc: "/patches/deep-orbit/neural-networks.webp",
            },
          ],
        })}
      />,
    );
    expect(screen.queryByTestId("module-patch")).toBeNull();
  });
});
