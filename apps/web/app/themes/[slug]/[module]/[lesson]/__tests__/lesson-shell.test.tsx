import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonShell } from "../lesson-shell";

describe("LessonShell", () => {
  it("renders left content always", () => {
    render(<LessonShell left={<p>prose</p>} right={null} rightKind="none" />);
    expect(screen.getByText("prose")).toBeInTheDocument();
  });

  it("renders the right slot when provided", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>rail</aside>}
        rightKind="rail"
      />,
    );
    expect(screen.getByText("rail")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-right").getAttribute("data-kind")).toBe(
      "rail",
    );
  });

  it("omits the right region when kind is none", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>rail</aside>}
        rightKind="none"
      />,
    );
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });

  /**
   * For "pane", the caller renders the same pane behind a mobile toggle
   * inside `left`. If this slot is also visible below lg, the interactive
   * pane mounts TWICE on a phone — for the exercise step that meant two live
   * editors sharing one `tc-code-{slug}` localStorage key and two Run Tests
   * buttons, i.e. two code buffers racing on the graded path.
   *
   * jsdom does not evaluate Tailwind breakpoints, so this asserts the class
   * contract rather than computed layout. It is still the guard that would
   * have caught the regression, which desktop-only e2e never could.
   */
  it("hides the pane slot below lg so it cannot mount twice on mobile", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("hidden");
    expect(right.className).toContain("lg:block");
  });

  it("keeps the rail slot visible at every width", () => {
    // Rail genuinely stacks below the prose on mobile; only pane is toggled.
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>rail</aside>}
        rightKind="rail"
      />,
    );
    expect(screen.getByTestId("lesson-right").className).not.toContain(
      "hidden",
    );
  });
});
