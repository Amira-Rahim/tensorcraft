import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ArtPlate } from "./art-plate";

const SRC = "/locations/deep-orbit/bridge.webp";

describe("ArtPlate", () => {
  it("renders a lazy, decorative plate by default", () => {
    render(<ArtPlate src={SRC} />);
    const img = screen.getByTestId("art-plate");
    expect(img).toHaveAttribute("src", SRC);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("becomes a described image when alt text is authored", () => {
    render(<ArtPlate src={SRC} alt="The bridge of the Archimedes" />);
    const img = screen.getByTestId("art-plate");
    expect(img).toHaveAttribute("alt", "The bridge of the Archimedes");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders nothing at all when the image 404s (art-agnostic contract)", () => {
    const { container } = render(<ArtPlate src={SRC} />);
    fireEvent.error(screen.getByTestId("art-plate"));
    expect(container.firstChild).toBeNull();
  });

  it("renders the fallback node instead when one is given", () => {
    render(<ArtPlate src={SRC} fallback={<span>◎</span>} />);
    fireEvent.error(screen.getByTestId("art-plate"));
    expect(screen.queryByTestId("art-plate")).toBeNull();
    expect(screen.getByText("◎")).toBeTruthy();
  });

  it("drops its frame when bleeding to the edge of a section", () => {
    render(<ArtPlate src={SRC} bleed />);
    expect(screen.getByTestId("art-plate").className).toContain(
      "tc-art-plate-bleed",
    );
  });

  it("keeps the frame class and appends any caller className", () => {
    render(<ArtPlate src={SRC} className="absolute inset-0" />);
    const cls = screen.getByTestId("art-plate").className;
    expect(cls).toContain("tc-art-plate");
    expect(cls).not.toContain("tc-art-plate-bleed");
    expect(cls).toContain("absolute inset-0");
  });
});
