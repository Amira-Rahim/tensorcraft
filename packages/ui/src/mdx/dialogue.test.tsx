import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialogue } from "./dialogue";

describe("Dialogue", () => {
  it("renders the speaker name", () => {
    render(<Dialogue speaker="ARIA">Hello, Commander.</Dialogue>);
    expect(screen.getByText("ARIA")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Dialogue speaker="Dr. Sato">The signal is fading.</Dialogue>);
    expect(screen.getByText("The signal is fading.")).toBeInTheDocument();
  });

  it("renders as a blockquote", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(container.querySelector("blockquote")).toBeInTheDocument();
  });

  it("displays speaker in uppercase tracking style", () => {
    render(<Dialogue speaker="Ensign Park">Report ready.</Dialogue>);
    const speaker = screen.getByText("Ensign Park");
    expect(speaker).toHaveClass("uppercase", "tracking-widest");
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <Dialogue speaker="ARIA">Scanning for anomalies.</Dialogue>,
    );
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
