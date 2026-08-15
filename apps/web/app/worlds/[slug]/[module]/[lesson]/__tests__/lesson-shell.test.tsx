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
   * SINGLE-MOUNT contract (fresh-eyes rerun §6 / R3-7): this slot is the
   * ONLY place the pane exists. The earlier fix hid this slot below lg
   * while the caller mounted its own second copy - CSS-only, so two live
   * Sandpack editors still raced one `tc-code-{slug}` key at every width
   * and a rotate across lg showed a stale buffer. Now the same single
   * instance toggles visibility via `paneOpenOnMobile`, so editor state
   * survives toggles and orientation changes by construction.
   *
   * jsdom does not evaluate Tailwind breakpoints, so the visibility half
   * asserts the class contract; the mount half asserts the DOM itself.
   */
  it("mounts the pane exactly once, hidden below lg while the toggle is closed", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
    // The mount half: exactly one pane instance in the whole tree.
    expect(screen.getAllByText("pane")).toHaveLength(1);
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("hidden");
    expect(right.className).toContain("lg:block");
  });

  it("shows the SAME single pane instance on mobile when the toggle opens", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
        paneOpenOnMobile
      />,
    );
    expect(screen.getAllByText("pane")).toHaveLength(1);
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("block");
    expect(right.className).not.toMatch(/(?:^|\s)hidden(?:\s|$)/);
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
