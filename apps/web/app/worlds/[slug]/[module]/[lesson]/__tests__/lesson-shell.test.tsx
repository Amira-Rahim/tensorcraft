import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonShell } from "../lesson-shell";

describe("LessonShell", () => {
  it("renders left content always", () => {
    render(<LessonShell left={<p>prose</p>} right={null} rightKind="none" />);
    expect(screen.getByText("prose")).toBeInTheDocument();
  });

  it("renders no left wrapper when the left slot is null", () => {
    // The challenge workspace keeps its brief in the pane (spec 2026-10-10);
    // an empty wrapper would still take a grid row and a 24 px gap.
    const { container } = render(
      <LessonShell
        left={null}
        right={<aside>pane</aside>}
        rightKind="pane"
        workspace
      />,
    );
    const grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.children).toHaveLength(1);
    expect(grid.firstElementChild).toBe(screen.getByTestId("lesson-right"));
  });

  it("uses one frame for every kind", () => {
    for (const rightKind of ["none", "code", "pane"] as const) {
      const { container, unmount } = render(
        <LessonShell
          left={<p>prose</p>}
          right={<aside>r</aside>}
          rightKind={rightKind}
        />,
      );
      const frame = container.querySelector("[data-testid='lesson-frame']")!;
      expect(frame).toHaveClass("lesson-frame");
      expect(frame.className).not.toMatch(/max-w-/);
      unmount();
    }
  });

  it("leaves the left column uncapped for every kind", () => {
    // Width is the grid's business; the old 68ch cap wasted the frame.
    for (const rightKind of ["none", "code", "pane"] as const) {
      const { container, unmount } = render(
        <LessonShell
          left={<p>prose</p>}
          right={<aside>r</aside>}
          rightKind={rightKind}
        />,
      );
      const left = container.querySelector(
        "[data-testid='lesson-grid']",
      )!.firstElementChild!;
      expect(left.textContent).toBe("prose");
      expect(left.className).not.toContain("max-w-[68ch]");
      unmount();
    }
  });

  it("omits the right region when kind is none", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>slot</aside>}
        rightKind="none"
      />,
    );
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });

  it("keeps the Code slot single column and the Challenge pane on the frame tracks", () => {
    const { container, rerender } = render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>code</aside>}
        rightKind="code"
      />,
    );
    let grid = container.querySelector("[data-testid='lesson-grid']")!;
    // One column and no gap utility: grid items do not collapse margins, so
    // the left slot's trailing 24 px is the whole gap above the worked
    // example (spec section 4, amended), and a row gap would add to it.
    expect(grid.className.split(" ")).toEqual(["grid", "grid-cols-1"]);
    expect(screen.getByTestId("lesson-right").getAttribute("data-kind")).toBe(
      "code",
    );
    rerender(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
    grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.className).toContain(
      "lg:grid-cols-[minmax(0,min(440px,38%))_minmax(0,1fr)]",
    );
    // The 40 px gutter (--l-gutter) between the instructions and the editor.
    expect(grid.className).toContain("gap-x-10");
    // The hairline sits in the middle of the 40 px gutter, not outside it.
    const right = screen.getByTestId("lesson-right");
    expect(right.className).toContain("lg:pl-5");
    expect(right.className).toContain("lg:-ml-5");
    expect(right.className).not.toContain("pl-10");
    // A neutral divider between panes, never an accent-coloured bar.
    expect(right.className).toContain("border-border");
  });

  it("lays a step with no right slot out as one column", () => {
    // One slot, so a gap utility here would do nothing.
    const { container } = render(
      <LessonShell left={<p>prose</p>} right={null} rightKind="none" />,
    );
    const grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.className.split(" ")).toEqual(["grid", "grid-cols-1"]);
  });

  /**
   * SINGLE-MOUNT contract (fresh-eyes rerun §6 / R3-7): this slot is the
   * ONLY place the pane exists. The same single instance toggles visibility
   * via `paneOpenOnMobile`, so editor state survives toggles and orientation
   * changes by construction. jsdom does not evaluate Tailwind breakpoints,
   * so the visibility half asserts the class contract.
   */
  it("mounts the pane exactly once, hidden below lg while the toggle is closed", () => {
    render(
      <LessonShell
        left={<p>prose</p>}
        right={<aside>pane</aside>}
        rightKind="pane"
      />,
    );
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

  it("keeps Deep Orbit instructions and its one editor visible together", () => {
    const { container, rerender } = render(
      <LessonShell
        orbit
        left={<p>Instructions</p>}
        right={<aside>Editor</aside>}
        rightKind="pane"
      />,
    );
    for (const paneOpenOnMobile of [false, true]) {
      rerender(
        <LessonShell
          orbit
          left={<p>Instructions</p>}
          right={<aside>Editor</aside>}
          rightKind="pane"
          paneOpenOnMobile={paneOpenOnMobile}
        />,
      );
      expect(screen.getAllByText("Editor")).toHaveLength(1);
      const grid = container.querySelector("[data-testid='lesson-grid']")!;
      expect(grid).toHaveClass("orbit-challenge-grid");
      expect(grid.firstElementChild!.className).not.toContain("hidden");
      expect(screen.getByTestId("lesson-right").className).not.toContain(
        "hidden",
      );
    }
  });
});
