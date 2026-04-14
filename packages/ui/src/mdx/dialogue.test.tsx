import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialogue } from "./dialogue";

describe("Dialogue", () => {
  it("renders the speaker name", () => {
    render(<Dialogue speaker="ARIA">Hello, Commander.</Dialogue>);
    expect(screen.getByText("ARIA")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Dialogue speaker="Dr. Farah">The signal is fading.</Dialogue>);
    expect(screen.getByText("The signal is fading.")).toBeInTheDocument();
  });

  it("renders as a div, not a blockquote", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(container.querySelector("blockquote")).not.toBeInTheDocument();
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("displays speaker in uppercase monospace style", () => {
    render(<Dialogue speaker="Ensign Demir">Report ready.</Dialogue>);
    const speaker = screen.getByText("Ensign Demir");
    expect(speaker).toHaveClass("uppercase", "tracking-[2px]");
  });

  it("renders optional direction as parenthetical", () => {
    render(
      <Dialogue speaker="Imran" direction="pulling up the chart">
        The note said PCN allergy.
      </Dialogue>,
    );
    expect(screen.getByText("(pulling up the chart)")).toBeInTheDocument();
  });

  it("omits parenthetical when no direction prop", () => {
    const { container } = render(<Dialogue speaker="ARIA">Scanning.</Dialogue>);
    expect(
      container.querySelector("[data-testid='direction']"),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <Dialogue speaker="ARIA">Scanning for anomalies.</Dialogue>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
