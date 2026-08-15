import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PatchAward } from "./patch-award";

const PROPS = {
  src: "/patches/deep-orbit/foundations.webp",
  moduleName: "Foundations: Tensors & Data",
  moduleTerm: "Sector",
};

describe("PatchAward", () => {
  it("shows the patch as content with authored alt text", () => {
    render(<PatchAward {...PROPS} />);
    const img = screen.getByTestId("module-patch");
    expect(img.getAttribute("src")).toBe(PROPS.src);
    expect(img.getAttribute("alt")).toBe(
      "Foundations: Tensors & Data mission patch",
    );
  });

  it("carries the world's module term and the earned line", () => {
    render(<PatchAward {...PROPS} />);
    expect(screen.getByText("Sector Complete")).toBeTruthy();
    expect(screen.getByText("Foundations: Tensors & Data")).toBeTruthy();
    expect(screen.getByText("Mission patch earned.")).toBeTruthy();
  });

  it("keeps the text block when the patch image fails", () => {
    render(<PatchAward {...PROPS} />);
    fireEvent.error(screen.getByTestId("module-patch"));
    expect(screen.queryByTestId("module-patch")).toBeNull();
    expect(screen.getByText("Mission patch earned.")).toBeTruthy();
  });
});
