import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModulePatch } from "./module-patch";

const SRC = "/patches/deep-orbit/foundations.webp";

describe("ModulePatch", () => {
  it("renders a lazy, decorative square emblem by default", () => {
    render(<ModulePatch src={SRC} size={28} />);
    const img = screen.getByTestId("module-patch");
    expect(img).toHaveAttribute("src", SRC);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "28");
    expect(img).toHaveAttribute("height", "28");
  });

  it("becomes a described image when alt text is authored", () => {
    render(<ModulePatch src={SRC} alt="Foundations mission patch" />);
    const img = screen.getByTestId("module-patch");
    expect(img).toHaveAttribute("alt", "Foundations mission patch");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders the fallback node instead of a broken image", () => {
    render(<ModulePatch src={SRC} fallback={<span>✓</span>} />);
    fireEvent.error(screen.getByTestId("module-patch"));
    expect(screen.queryByTestId("module-patch")).toBeNull();
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("renders nothing on failure when no fallback is given", () => {
    const { container } = render(<ModulePatch src={SRC} />);
    fireEvent.error(screen.getByTestId("module-patch"));
    expect(container.firstChild).toBeNull();
  });
});
