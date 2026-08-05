import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnimatedAvatar } from "./animated-avatar";

const SRC = "/characters/deep-orbit/dr-farah.webp";
const EXPR = "/characters/deep-orbit/dr-farah-delighted.webp";

describe("AnimatedAvatar", () => {
  it("renders the named frame with the base portrait layer", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} />);
    const frame = screen.getByTestId("animated-avatar");
    expect(frame).toHaveAttribute("role", "img");
    expect(frame).toHaveAttribute("aria-label", "Dr. Farah");
    expect(screen.getByTestId("animated-avatar-base")).toHaveAttribute(
      "src",
      SRC,
    );
  });

  it("keeps the expression overlay invisible until its own load fires", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} expressionSrc={EXPR} />);
    const overlay = screen.getByTestId("animated-avatar-expression");
    expect(overlay.style.opacity).toBe("0");
    fireEvent.load(overlay);
    expect(overlay.style.opacity).toBe("1");
  });

  it("renders no overlay at all without an expressionSrc", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} />);
    expect(
      screen.queryByTestId("animated-avatar-expression"),
    ).not.toBeInTheDocument();
  });

  it("collapses to the neutral base when the expression 404s", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} expressionSrc={EXPR} />);
    fireEvent.error(screen.getByTestId("animated-avatar-expression"));
    expect(
      screen.queryByTestId("animated-avatar-expression"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("animated-avatar-base")).toBeInTheDocument();
  });

  it("resets the crossfade when the expression source changes", () => {
    const { rerender } = render(
      <AnimatedAvatar name="Dr. Farah" src={SRC} expressionSrc={EXPR} />,
    );
    fireEvent.load(screen.getByTestId("animated-avatar-expression"));
    rerender(
      <AnimatedAvatar
        name="Dr. Farah"
        src={SRC}
        expressionSrc="/characters/deep-orbit/dr-farah-shaken.webp"
      />,
    );
    expect(screen.getByTestId("animated-avatar-expression").style.opacity).toBe(
      "0",
    );
  });

  it("collapses to the monogram placeholder when the base 404s", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} expressionSrc={EXPR} />);
    fireEvent.error(screen.getByTestId("animated-avatar-base"));
    expect(screen.queryByTestId("animated-avatar")).not.toBeInTheDocument();
    expect(screen.getByTestId("character-avatar-placeholder")).toHaveAttribute(
      "aria-label",
      "Dr. Farah",
    );
  });

  it("renders the monogram placeholder directly with no src", () => {
    render(<AnimatedAvatar name="Dr. Farah" />);
    expect(
      screen.getByTestId("character-avatar-placeholder"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("animated-avatar")).not.toBeInTheDocument();
  });

  it("carries the inert scanline hook for the host app's playback CSS", () => {
    const { container } = render(<AnimatedAvatar name="Dr. Farah" src={SRC} />);
    const scan = container.querySelector(".tc-avatar-scan");
    expect(scan).not.toBeNull();
    expect(scan).toHaveClass("hidden");
    expect(scan).toHaveAttribute("aria-hidden", "true");
    expect(scan).toHaveAttribute("data-decorative", "true");
  });

  it("applies the square avatar frame chrome at the requested size", () => {
    render(<AnimatedAvatar name="Dr. Farah" src={SRC} size={30} />);
    const frame = screen.getByTestId("animated-avatar");
    expect(frame.style.width).toBe("30px");
    expect(frame.style.height).toBe("30px");
    expect(frame.style.borderRadius).toBe("0px");
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <AnimatedAvatar name="Dr. Farah" src={SRC} expressionSrc={EXPR} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
