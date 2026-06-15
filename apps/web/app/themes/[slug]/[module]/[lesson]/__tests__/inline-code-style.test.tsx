import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

function Prose() {
  return (
    <div className="lesson-prose">
      <p>
        Use <code data-testid="inline">tf.tensor2d()</code> here.
      </p>
      <pre>
        <code data-testid="block">const x = 1;</code>
      </pre>
    </div>
  );
}

describe("inline code chip", () => {
  it("marks inline code distinctly from block code in lesson prose", () => {
    const { getByTestId } = render(<Prose />);
    const inline = getByTestId("inline");
    const block = getByTestId("block");
    expect(inline.closest("pre")).toBeNull();
    expect(block.closest("pre")).not.toBeNull();
  });
});
