import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ComingSoonMotif } from "../coming-soon-motif";

describe("ComingSoonMotif", () => {
  it.each(["signal-ward", "neon-protocol", "nova-canvas", "terra-grid"])(
    "renders a decorative aria-hidden svg for %s",
    (slug) => {
      const { container } = render(
        <ComingSoonMotif slug={slug} color="#65C07D" />,
      );
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg!.getAttribute("aria-hidden")).toBe("true");
    },
  );

  it("dispatches per-slug variants (neon-protocol renders its focus rect)", () => {
    const { container } = render(
      <ComingSoonMotif slug="neon-protocol" color="#65C07D" />,
    );
    // Only the neon-protocol variant draws a <rect>; proves slug dispatch.
    expect(container.querySelector("rect")).not.toBeNull();
  });

  it("falls back to a default motif for unknown slugs", () => {
    const { container } = render(
      <ComingSoonMotif slug="unknown" color="#FFFFFF" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
