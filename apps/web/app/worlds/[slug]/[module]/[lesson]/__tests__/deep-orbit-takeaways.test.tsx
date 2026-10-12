import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { GLOSSARY } from "@tensorcraft/content";
import { LessonTermsList } from "../lesson-terms-list";
import { DeepOrbitRecap } from "../deep-orbit-recap";

const terms = GLOSSARY.filter(({ term }) =>
  ["tensor", "shape", "dimensions", "SVD"].includes(term),
);

describe("Deep Orbit takeaways", () => {
  it("switches illustrated terms and keeps each term’s own documentation", async () => {
    const { container } = render(
      <LessonTermsList worldId="deep-orbit" terms={terms} />,
    );
    const disclosure = screen.getByTestId("lesson-terms-list");
    expect(disclosure).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Review lesson terms"));
    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Tensor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Dimensions" }));
    expect(screen.getByRole("button", { name: "Tensor" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText(/Dimensions tell you how many axes/)).toBeVisible();
    expect(screen.getByRole("figure")).toHaveAccessibleName(
      /A list has one axis/,
    );
    expect(screen.getByText("2 dimensions", { exact: true })).toBeVisible();
    expect((await axe(container)).violations).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "SVD" }));
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(
      screen.getByText(terms.find(({ term }) => term === "SVD")!.definition),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /TensorFlow \(Python\): Singular value decomposition/,
      }),
    ).toHaveAttribute(
      "href",
      terms.find(({ term }) => term === "SVD")!.documentation!.href,
    );
  });

  it("lets learners select every term in a long glossary", () => {
    render(
      <LessonTermsList worldId="deep-orbit" terms={GLOSSARY.slice(0, 21)} />,
    );
    fireEvent.click(screen.getByText("Review lesson terms"));
    const buttons = within(
      screen.getByRole("group", { name: "Choose a lesson term" }),
    ).getAllByRole("button");
    expect(buttons).toHaveLength(21);
    fireEvent.click(buttons[20]);
    expect(buttons[20]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(GLOSSARY[20].definition)).toBeVisible();
  });

  it("uses the tensor illustration only for the introduction and preserves other lessons’ recaps", () => {
    const recap = {
      whatYouLearned: ["Matching axes matter."],
      bridge: "Combine channels with weighted sums.",
      youCanNow: "Check a matrix product.",
    };
    const { rerender } = render(
      <DeepOrbitRecap {...recap} lessonId="introduction-to-tensors" />,
    );
    expect(
      screen.getByRole("heading", { name: "Reading the shape" }),
    ).toBeVisible();
    expect(screen.getByRole("figure")).toBeVisible();
    rerender(<DeepOrbitRecap {...recap} lessonId="tensor-operations" />);
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    for (const text of [...recap.whatYouLearned, recap.bridge, recap.youCanNow])
      expect(screen.getByText(text)).toBeVisible();
  });
});
