import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";
import { dashboardFixture } from "./__tests__/fixtures";
import userEvent from "@testing-library/user-event";

describe("dashboard curriculum", () => {
  it("leads with the authored mission scene and story context", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          plateSrc: "/locations/deep-orbit/dashboard-station.webp",
          missionScene: {
            src: "/scenes/deep-orbit/foundations/tensor-shapes.webp",
            alt: "Farah studies the structure of the incoming signal.",
            location: "Archimedes, Lab",
            narrative:
              "Dr. Farah analyzes the dimensional structure of the incoming data.",
          },
        })}
      />,
    );
    expect(screen.getByRole("img", { name: /Farah studies/ })).toHaveAttribute(
      "src",
      "/scenes/deep-orbit/foundations/tensor-shapes.webp",
    );
    expect(screen.getByText(/Dr. Farah analyzes/)).toBeInTheDocument();
    expect(screen.getByText("Archimedes, Lab")).toBeInTheDocument();
  });
  it("lets learners inspect sectors and distinguishes prerequisites from paid access", async () => {
    const user = userEvent.setup();
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
    await user.click(
      screen.getByRole("button", { name: /M02: Neural Networks/ }),
    );
    expect(
      screen.getByRole("link", { name: "View prerequisite →" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit#module-neural-networks");
    expect(screen.getByText(/Complete Foundations first/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /M03: Training/ }));
    expect(
      screen.getByRole("link", { name: "Get sector access →" }),
    ).toHaveAttribute(
      "href",
      "/pricing?locked=deep-orbit&module=training-loop",
    );
    expect(screen.getByText(/Paid access required/)).toBeInTheDocument();
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
  it("shows actual completed lesson checkpoints even when they are out of order", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          modules: [
            {
              number: "M01",
              name: "Foundations",
              status: "active",
              score: null,
              formula: "",
              slug: "foundations",
              completedLessons: 1,
              totalLessons: 3,
              missions: [
                { title: "First", completed: false },
                { title: "Second", completed: false },
                { title: "Third", completed: true },
              ],
            },
          ],
        })}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Third: completed" }),
    ).toHaveAttribute("data-completed", "true");
    expect(
      screen.getByRole("img", { name: "First: not completed" }),
    ).toHaveAttribute("data-completed", "false");
  });
});
