import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonDocumentation } from "../lesson-documentation";
import { LessonTermsList } from "../lesson-terms-list";
import { GLOSSARY } from "@tensorcraft/content";

describe("lesson documentation surfaces", () => {
  it("keeps references optional and identifies broader sources", () => {
    const { container } = render(
      <LessonDocumentation
        references={[
          {
            concepts: ["tensor"],
            title: "tf.tensor",
            href: "https://js.tensorflow.org/api/4.22.0/#tensor",
            source: "TensorFlow.js",
            kind: "api",
          },
          {
            concepts: ["SVD"],
            title: "Singular value decomposition",
            href: "https://www.tensorflow.org/api_docs/python/tf/linalg/svd",
            source: "TensorFlow (Python)",
            kind: "background",
          },
        ]}
      />,
    );
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(
      screen.getByText("Documentation for this lesson"),
    ).toBeInTheDocument();
    expect(screen.getByText("Concept background")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(2);
    expect(
      screen.getByText(/TensorFlow \(Python\): Singular value decomposition/),
    ).toBeInTheDocument();
  });

  it("keeps each Takeaways definition linked to its own source", () => {
    const terms = GLOSSARY.filter(({ term }) =>
      ["tensor", "SVD"].includes(term),
    );
    render(<LessonTermsList terms={terms} />);
    expect(
      screen.getByRole("link", { name: /TensorFlow.js: tf.tensor/ }),
    ).toHaveAttribute("href", terms[0]!.documentation!.href);
    expect(
      screen.getByRole("link", {
        name: /TensorFlow \(Python\): Singular value decomposition/,
      }),
    ).toHaveAttribute("href", terms[1]!.documentation!.href);
  });
});
