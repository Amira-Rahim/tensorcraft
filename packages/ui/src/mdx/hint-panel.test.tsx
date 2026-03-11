import { describe, it, expect } from "vitest";
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

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<HintPanel hints={hints} />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
