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
});
