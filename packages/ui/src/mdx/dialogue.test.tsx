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

  it("marks its root with data-dialogue for positional CSS", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(
      container.querySelector("[data-dialogue='true']"),
    ).toBeInTheDocument();
  });

  it("colors the speaker with the theme primary variable", () => {
    render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(screen.getByText("ARIA")).toHaveAttribute(
      "style",
      expect.stringContaining("--tc-primary"),
    );
  });

  it("renders a hidden, decorative CUT-TO divider", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    const cut = container.querySelector(".tc-cut-to");
    expect(cut).toBeInTheDocument();
    expect(cut).toHaveClass("hidden");
    expect(cut).toHaveAttribute("aria-hidden", "true");
    expect(cut).toHaveTextContent(/cut to: briefing/i);
  });

  it("lays out as a centered screenplay column", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    const root = container.querySelector("[data-dialogue='true']");
    expect(root).toHaveClass("mx-auto", "max-w-[440px]");
  });

  it("centers the speaker name above the line", () => {
    render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(screen.getByText("ARIA")).toHaveClass("text-center");
  });

  it("centers the parenthetical direction", () => {
    render(
      <Dialogue speaker="Imran" direction="pulling up the chart">
        The note said PCN allergy.
      </Dialogue>,
    );
    expect(screen.getByText("(pulling up the chart)")).toHaveClass(
      "text-center",
    );
  });

  it("uses a custom cutTo label when provided", () => {
    const { container } = render(
      <Dialogue speaker="ARIA" cutTo="Debrief">
        Test
      </Dialogue>,
    );
    expect(container.querySelector(".tc-cut-to")).toHaveTextContent(
      /cut to: debrief/i,
    );
  });
});
