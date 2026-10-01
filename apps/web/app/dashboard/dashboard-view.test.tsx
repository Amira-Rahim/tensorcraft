import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";
import { dashboardFixture } from "./__tests__/fixtures";

describe("dashboard curriculum", () => {
  it("uses a small world banner for station art", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          plateSrc: "/locations/deep-orbit/dashboard-station.webp",
        })}
      />,
    );
    expect(screen.getByTestId("art-plate").closest("header")).not.toBeNull();
  });
  it("distinguishes prerequisites from paid access and keeps complete titles", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          modules: [
            {
              number: "M02",
              name: "Neural Networks: Layers & Architecture",
              status: "locked",
              score: null,
              formula: "",
              slug: "neural-networks",
              lockReason: "prerequisite",
              prerequisiteName: "Foundations",
            },
            {
              number: "M03",
              name: "Training",
              status: "locked",
              score: null,
              formula: "",
              slug: "training-loop",
              lockReason: "access",
            },
          ],
        })}
      />,
    );
    expect(
      screen.getByRole("link", {
        name: "Neural Networks: Layers & Architecture",
      }),
    ).toHaveAttribute("href", "/worlds/deep-orbit#module-neural-networks");
    expect(screen.getByText("Complete Foundations first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Training" })).toHaveAttribute(
      "href",
      "/pricing?locked=deep-orbit&module=training-loop",
    );
    expect(screen.getByText("Paid access required")).toBeInTheDocument();
  });
  it("shows an earned patch in the module map but no collection placeholders", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          modules: [
            {
              number: "M01",
              name: "Foundations",
              status: "done",
              score: 100,
              formula: "",
              slug: "foundations",
              patchSrc: "/patches/deep-orbit/foundations.webp",
            },
          ],
        })}
      />,
    );
    expect(screen.getAllByTestId("module-patch")).toHaveLength(1);
    expect(screen.queryByTestId("patch-collection")).toBeNull();
  });
});
