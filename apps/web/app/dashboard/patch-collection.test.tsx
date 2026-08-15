import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PatchCollection } from "./patch-collection";
import type { DashboardModule } from "./dashboard-view";

function makeModule(overrides: Partial<DashboardModule> = {}): DashboardModule {
  return {
    number: "M01",
    name: "Foundations",
    status: "done",
    score: 98,
    formula: "",
    slug: "foundations",
    patchSrc: "/patches/deep-orbit/foundations.webp",
    ...overrides,
  };
}

describe("PatchCollection", () => {
  it("shows earned patches, dashed slots for the rest, and the earned count", () => {
    render(
      <PatchCollection
        modules={[
          makeModule(),
          makeModule({
            number: "M02",
            slug: "neural-networks",
            patchSrc: "/patches/deep-orbit/neural-networks.webp",
          }),
          makeModule({
            number: "M03",
            slug: "training-loop",
            status: "active",
            score: null,
            patchSrc: "/patches/deep-orbit/training-loop.webp",
          }),
        ]}
      />,
    );
    expect(screen.getAllByTestId("module-patch")).toHaveLength(2);
    expect(screen.getByTestId("patch-slot-empty-training-loop")).toBeTruthy();
    const header = screen.getByTestId("patch-collection-count");
    expect(header.textContent).toBe("2/3");
  });

  it("renders nothing for a world without patch art", () => {
    const { container } = render(
      <PatchCollection modules={[makeModule({ patchSrc: undefined })]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
