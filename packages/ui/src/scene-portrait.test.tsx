import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenePortrait } from "./scene-portrait";

const SRC = "/scenes/deep-orbit/foundations/introduction-to-tensors.webp";

describe("ScenePortrait", () => {
  it("renders a framed figure with a lazy, aspect-reserved image", () => {
    render(<ScenePortrait src={SRC} alt="The bridge at dawn watch" />);
    const figure = screen.getByTestId("scene-portrait");
    const img = figure.querySelector("img")!;
    expect(img).toHaveAttribute("src", SRC);
    expect(img).toHaveAttribute("alt", "The bridge at dawn watch");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img.style.aspectRatio).toBe("3 / 2");
    expect(img.style.borderRadius).toBe("0px");
  });

  it("defaults to a decorative empty alt until one is authored", () => {
    render(<ScenePortrait src={SRC} />);
    const img = screen.getByTestId("scene-portrait").querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
  });

  it("participates as a script beat only when asked", () => {
    const { rerender } = render(<ScenePortrait src={SRC} beat />);
    expect(screen.getByTestId("scene-portrait")).toHaveAttribute(
      "data-script-beat",
    );
    rerender(<ScenePortrait src={SRC} />);
    expect(screen.getByTestId("scene-portrait")).not.toHaveAttribute(
      "data-script-beat",
    );
  });

  it("renders nothing at all when the image 404s (art-agnostic contract)", () => {
    const { container } = render(<ScenePortrait src={SRC} beat />);
    fireEvent.error(screen.getByTestId("scene-portrait").querySelector("img")!);
    expect(container.firstChild).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <ScenePortrait src={SRC} alt="Engineering bay, mid refit" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
