import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HintPanel } from "./hint-panel";

const hints = [
  { level: "nudge" as const, content: "Think about array operations" },
  { level: "guidance" as const, content: "Use tf.tensor() to create tensors" },
  { level: "solution" as const, content: "const t = tf.tensor([1, 2, 3])" },
];

describe("HintPanel", () => {
  it("renders nothing when hints is undefined", () => {
    const { container } = render(<HintPanel hints={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when hints is empty", () => {
    const { container } = render(<HintPanel hints={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows 'Need a hint?' heading", () => {
    render(<HintPanel hints={hints} />);
    expect(screen.getByText("Need a hint?")).toBeInTheDocument();
  });

  it("shows only the first hint as revealable initially", () => {
    render(<HintPanel hints={hints} />);
    expect(screen.getByText(/Reveal Nudge/)).toBeInTheDocument();
    expect(
      screen.queryByText("Think about array operations"),
    ).not.toBeInTheDocument();
  });

  it("reveals nudge hint on click", () => {
    render(<HintPanel hints={hints} />);
    fireEvent.click(screen.getByText(/Reveal Nudge/));
    expect(
      screen.getByText("Think about array operations"),
    ).toBeInTheDocument();
  });

  it("shows guidance as next revealable after nudge is revealed", () => {
    render(<HintPanel hints={hints} />);
    fireEvent.click(screen.getByText(/Reveal Nudge/));
    expect(screen.getByText(/Reveal Guidance/)).toBeInTheDocument();
  });

  it("reveals all three hints progressively", () => {
    render(<HintPanel hints={hints} />);

    // Reveal nudge
    fireEvent.click(screen.getByText(/Reveal Nudge/));
    expect(
      screen.getByText("Think about array operations"),
    ).toBeInTheDocument();

    // Reveal guidance
    fireEvent.click(screen.getByText(/Reveal Guidance/));
    expect(
      screen.getByText("Use tf.tensor() to create tensors"),
    ).toBeInTheDocument();

    // Reveal solution
    fireEvent.click(screen.getByText(/Reveal Solution/));
    expect(
      screen.getByText("const t = tf.tensor([1, 2, 3])"),
    ).toBeInTheDocument();
  });

  it("keeps previously revealed hints visible", () => {
    render(<HintPanel hints={hints} />);
    fireEvent.click(screen.getByText(/Reveal Nudge/));
    fireEvent.click(screen.getByText(/Reveal Guidance/));

    // Both nudge and guidance should still be visible
    expect(
      screen.getByText("Think about array operations"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Use tf.tensor() to create tensors"),
    ).toBeInTheDocument();
  });

  it("fires onHintRevealed with the numeric hint level on reveal", () => {
    const onHintRevealed = vi.fn();
    render(<HintPanel hints={hints} onHintRevealed={onHintRevealed} />);

    fireEvent.click(screen.getByText(/Reveal Nudge/));
    expect(onHintRevealed).toHaveBeenNthCalledWith(1, 1);

    fireEvent.click(screen.getByText(/Reveal Guidance/));
    expect(onHintRevealed).toHaveBeenNthCalledWith(2, 2);

    fireEvent.click(screen.getByText(/Reveal Solution/));
    expect(onHintRevealed).toHaveBeenNthCalledWith(3, 3);
  });

  it("does not require onHintRevealed (back-compat)", () => {
    render(<HintPanel hints={hints} />);
    // Should not throw when callback is absent.
    fireEvent.click(screen.getByText(/Reveal Nudge/));
    expect(
      screen.getByText("Think about array operations"),
    ).toBeInTheDocument();
  });

  it("renders one root with its live region inside it", () => {
    // The Challenge instructions column drops its last block's bottom margin
    // with `[data-show-challenge="true"] > :last-child` (apps/web
    // globals.css), and the panel renders last there. A second root, such
    // as a live region beside the panel, would take that place instead.
    const { container } = render(<HintPanel hints={hints} />);
    expect(container.childElementCount).toBe(1);
    const live = container.querySelector("[aria-live]");
    expect(live).not.toBeNull();
    expect(container.firstElementChild!.contains(live)).toBe(true);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<HintPanel hints={hints} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
