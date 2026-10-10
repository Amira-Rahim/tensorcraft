import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonRecap } from "./lesson-recap";

describe("LessonRecap", () => {
  it("renders the three sections", () => {
    render(
      <LessonRecap
        whatYouLearned={["A tensor tracks shape.", "Rank is dimension count."]}
        bridge="dispose() is to tensors what cleanup is to useEffect."
        youCanNow="Create a tensor and manage its memory."
      />,
    );
    expect(screen.getByText(/what you learned/i)).toBeInTheDocument();
    expect(screen.getByText("A tensor tracks shape.")).toBeInTheDocument();
    expect(screen.getByText(/the bridge/i)).toBeInTheDocument();
    expect(screen.getByText(/dispose\(\) is to tensors/)).toBeInTheDocument();
    expect(screen.getByText(/you can now/i)).toBeInTheDocument();
    expect(screen.getByText(/create a tensor and manage/i)).toBeInTheDocument();
  });

  it("carries the layout hooks the app's Takeaways CSS places in two columns", () => {
    const { container } = render(
      <LessonRecap
        whatYouLearned={["A tensor tracks shape."]}
        bridge="b"
        youCanNow="c"
      />,
    );
    // apps/web globals.css: the learned list spans both rows of the left
    // column, the bridge and the next ability stack on the right.
    const sections = container.querySelector(
      ".lesson-recap > .lesson-recap-sections",
    )!;
    expect(
      Array.from(sections.children, (section) => section.className),
    ).toEqual(["lesson-recap-learned", "", ""]);
    expect(container.querySelectorAll(".lesson-recap-label")).toHaveLength(3);
    expect(container.querySelectorAll(".lesson-recap-text")).toHaveLength(2);
  });

  it("renders without crashing on empty whatYouLearned", () => {
    const { container } = render(
      <LessonRecap whatYouLearned={[]} bridge="b" youCanNow="c" />,
    );
    expect(container).toBeTruthy();
  });
});
