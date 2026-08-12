import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlossaryRail } from "../glossary-rail";

const TERMS = [
  { term: "tensor", definition: "multi-dim array" },
  { term: "rank", definition: "number of axes" },
];

describe("GlossaryRail", () => {
  it("lists each term and definition", () => {
    render(<GlossaryRail terms={TERMS} activeTerm={null} />);
    expect(screen.getByText("tensor")).toBeInTheDocument();
    expect(screen.getByText("multi-dim array")).toBeInTheDocument();
    expect(screen.getByText("rank")).toBeInTheDocument();
  });

  it("marks the active term", () => {
    render(<GlossaryRail terms={TERMS} activeTerm="rank" />);
    const entry = screen.getByTestId("glossary-entry-rank");
    expect(entry.getAttribute("data-active")).toBe("true");
  });

  it("renders nothing when there are no terms", () => {
    const { container } = render(<GlossaryRail terms={[]} activeTerm={null} />);
    expect(container.firstChild).toBeNull();
  });
});
