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

  it("gives each term one row: the headword, its definition, then the kind and source of its reading above the link", () => {
    render(
      <LessonTermsList
        terms={[
          {
            term: "tensor",
            definition: "multi-dim array",
            documentation: {
              title: "tf.tensor",
              href: "https://js.tensorflow.org/api/4.22.0/#tensor",
              source: "TensorFlow.js",
              kind: "api",
            },
          },
          {
            term: "sum",
            definition: "adds the values",
            documentation: {
              title: "tf.sum",
              href: "https://js.tensorflow.org/api/4.22.0/#sum",
              source: "TensorFlow.js",
              kind: "related-api",
            },
          },
        ]}
      />,
    );
    const row = screen.getByTestId("glossary-entry-tensor");
    expect(Array.from(row.children, (cell) => cell.tagName)).toEqual([
      "DT",
      "DD",
      "DD",
    ]);
    // The label shows "API · TensorFlow.js"; the source on it is hidden from
    // assistive tech because the link already says it.
    const kind = row.querySelector(".lesson-terms-kind")!;
    expect(kind).toHaveTextContent(/^API\b.*TensorFlow\.js\)$/);
    expect(kind.querySelector("[aria-hidden='true']")).toHaveTextContent(
      "TensorFlow.js",
    );
    // The link shows only the page title, and its name still carries the
    // source, so a list of links reads "TensorFlow.js: tf.tensor".
    const link = screen.getByRole("link", {
      name: /^TensorFlow\.js: tf\.tensor\b/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://js.tensorflow.org/api/4.22.0/#tensor",
    );
    expect(link.querySelector(".sr-only")).toHaveTextContent("TensorFlow.js:");
    // A related API supplies a building block, so it keeps its own label.
    expect(
      screen
        .getByTestId("glossary-entry-sum")
        .querySelector(".lesson-terms-kind"),
    ).toHaveTextContent(/^Related API\b.*TensorFlow\.js\)$/);
  });

  it("leaves the reading cell out when a term has no documentation", () => {
    render(<LessonTermsList terms={TERMS} />);
    const row = screen.getByTestId("glossary-entry-rank");
    expect(Array.from(row.children, (cell) => cell.tagName)).toEqual([
      "DT",
      "DD",
    ]);
  });

  it("renders nothing when there are no terms", () => {
    const { container } = render(<LessonTermsList terms={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
