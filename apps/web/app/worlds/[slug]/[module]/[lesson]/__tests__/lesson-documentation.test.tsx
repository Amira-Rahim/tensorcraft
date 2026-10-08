import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonTermsList } from "../lesson-terms-list";
import { GLOSSARY } from "@tensorcraft/content";

describe("lesson documentation surfaces", () => {
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
