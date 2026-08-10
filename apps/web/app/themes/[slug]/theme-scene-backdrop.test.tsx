import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeSceneBackdrop } from "./theme-scene-backdrop";

// SceneCanvas needs a real 2D context; what matters here is layer
// composition, not drawing.
vi.mock("@tensorcraft/ui/effects", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  SceneCanvas: ({ className }: { className?: string }) => (
    <div data-testid="scene-canvas" className={className} />
  ),
}));

const PRIMARY = "#6BAA8A";
const PLATE = "/locations/deep-orbit/bridge.webp";

describe("ThemeSceneBackdrop", () => {
  it("renders canvas only when the theme has no plate", () => {
    render(<ThemeSceneBackdrop slug="neon-protocol" primary={PRIMARY} />);
    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    expect(screen.queryByTestId("art-plate")).toBeNull();
  });

  it("layers the plate beneath the canvas when one is supplied", () => {
    render(
      <ThemeSceneBackdrop
        slug="deep-orbit"
        primary={PRIMARY}
        plateSrc={PLATE}
      />,
    );
    expect(screen.getByTestId("art-plate")).toHaveAttribute("src", PLATE);
    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
  });

  it("dims the canvas over a plate, so it reads as glass not as the scene", () => {
    render(
      <ThemeSceneBackdrop
        slug="deep-orbit"
        primary={PRIMARY}
        plateSrc={PLATE}
      />,
    );
    expect(screen.getByTestId("scene-canvas").className).toContain(
      "opacity-50",
    );
  });

  it("leaves the canvas at full strength when there is no plate", () => {
    render(<ThemeSceneBackdrop slug="deep-orbit" primary={PRIMARY} />);
    expect(screen.getByTestId("scene-canvas").className).not.toContain(
      "opacity-50",
    );
  });

  it("still renders the plate for a theme with no draw function", () => {
    render(
      <ThemeSceneBackdrop
        slug="not-a-theme"
        primary={PRIMARY}
        plateSrc={PLATE}
      />,
    );
    expect(screen.getByTestId("art-plate")).toBeInTheDocument();
    expect(screen.queryByTestId("scene-canvas")).toBeNull();
  });

  it("renders nothing when the theme has neither draw nor plate", () => {
    const { container } = render(
      <ThemeSceneBackdrop slug="not-a-theme" primary={PRIMARY} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
