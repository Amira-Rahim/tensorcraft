import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonTermsList } from "../lesson-terms-list";

const TERMS = [
  { term: "tensor", definition: "multi-dim array" },
  { term: "rank", definition: "number of axes" },
];

describe("LessonTermsList", () => {
  it("lists each term and definition under a level-two heading", () => {
    render(<LessonTermsList terms={TERMS} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Terms in this lesson" }),
    ).toBeInTheDocument();
    // A section is a region only when it has a name; this one takes its name
    // from the heading through the useId link, so a broken link fails here.
    expect(
      screen.getByRole("region", { name: "Terms in this lesson" }),
    ).toBeInTheDocument();
    expect(screen.getByText("tensor")).toBeInTheDocument();
    expect(screen.getByText("multi-dim array")).toBeInTheDocument();
    expect(screen.getByTestId("glossary-entry-rank")).toBeInTheDocument();
  });

  it("renders nothing when there are no terms", () => {
    const { container } = render(<LessonTermsList terms={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
