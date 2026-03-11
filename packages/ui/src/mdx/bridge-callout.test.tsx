import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BridgeCallout } from "./bridge-callout";

const identityBridge = {
  feTitle: "Array.map()",
  feCode: "data.map(x => x * 2)",
  mlTitle: "Tensor Operations",
  mlCode: "tensor.mul(2)",
  tier: "identity" as const,
};

const structuralBridge = {
  feTitle: "expect().toBe()",
  feCode: "expect(actual).toBe(expected)",
  mlTitle: "Loss Function",
  mlCode: "tf.losses.meanSquaredError(labels, preds)",
  tier: "structural" as const,
};

const intuitionBridge = {
  feTitle: "Scroll Direction",
  feCode: "const dir = target - current > 0 ? 1 : -1",
  mlTitle: "Gradient",
  mlCode: "const grad = tf.grad(loss)(weights)",
  tier: "intuition" as const,
};

describe("BridgeCallout", () => {
  it("renders nothing when bridge is undefined", () => {
    const { container } = render(<BridgeCallout bridge={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders FE and ML titles", () => {
    render(<BridgeCallout bridge={identityBridge} />);
    expect(screen.getByText("Array.map()")).toBeInTheDocument();
    expect(screen.getByText("Tensor Operations")).toBeInTheDocument();
  });

  it("renders FE and ML code snippets", () => {
    render(<BridgeCallout bridge={identityBridge} />);
    expect(screen.getByText("data.map(x => x * 2)")).toBeInTheDocument();
    expect(screen.getByText("tensor.mul(2)")).toBeInTheDocument();
  });

  it("shows Frontend and Machine Learning headers", () => {
    render(<BridgeCallout bridge={identityBridge} />);
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
  });

  it("shows correct tier label for identity bridge", () => {
    render(<BridgeCallout bridge={identityBridge} />);
    expect(screen.getByText("Identity Bridge")).toBeInTheDocument();
  });

  it("shows correct tier label for structural bridge", () => {
    render(<BridgeCallout bridge={structuralBridge} />);
    expect(screen.getByText("Structural Bridge")).toBeInTheDocument();
  });

  it("shows correct tier label for intuition bridge", () => {
    render(<BridgeCallout bridge={intuitionBridge} />);
    expect(screen.getByText("Intuition Bridge")).toBeInTheDocument();
  });

  it("uses correct tier color for connector", () => {
    const { container } = render(<BridgeCallout bridge={identityBridge} />);
    const connector = container.querySelector(".rounded-full");
    expect(connector).toHaveStyle({ color: "#00D4FF" });
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<BridgeCallout bridge={identityBridge} />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
