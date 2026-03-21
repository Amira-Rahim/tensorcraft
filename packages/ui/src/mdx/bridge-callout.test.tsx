import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BridgeCallout } from "./bridge-callout";

const bridgeWithVariants = {
  feTitle: "Component Props",
  feCode: "function Card(props) { return props.title; }",
  mlTitle: "Training Data",
  mlCode: "model.fit(trainingData, labels)",
  tier: "structural" as const,
};

const bridgeWithoutVariants = {
  feTitle: "CSS initial values",
  feCode: "div { color: initial; }",
  mlTitle: "Weight initialization",
  mlCode: "tf.initializers.glorotNormal()",
  tier: "structural" as const,
};

describe("BridgeCallout", () => {
  it("returns null when bridge is undefined", () => {
    const { container } = render(<BridgeCallout bridge={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders ML title and code regardless of tab", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Training Data")).toBeInTheDocument();
    expect(screen.getByText(/model\.fit/)).toBeInTheDocument();
  });

  it("renders tab bar with 5 framework tabs when bridge has variants", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it("defaults active tab to userFramework prop", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="vue" />);
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });

  it("defaults to vanilla when userFramework is undefined", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    const vanillaTab = screen.getByRole("tab", { name: /vanilla/i });
    expect(vanillaTab.getAttribute("aria-selected")).toBe("true");
  });

  it("switches FE content when clicking a different tab", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    fireEvent.click(vueTab);
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });

  it("shows tier badge with correct label", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Structural Bridge")).toBeInTheDocument();
  });

  it("shows connection text in footer", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByTestId("bridge-footer")).toBeInTheDocument();
  });

  it("falls back to generic layout when bridge has no variants", () => {
    render(<BridgeCallout bridge={bridgeWithoutVariants} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText("CSS initial values")).toBeInTheDocument();
    expect(screen.getByText("Weight initialization")).toBeInTheDocument();
  });

  it("supports keyboard navigation between tabs", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const reactTab = screen.getByRole("tab", { name: /react/i });
    fireEvent.keyDown(reactTab, { key: "ArrowRight" });
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    expect(document.activeElement).toBe(vueTab);
  });

  it("activates tab on Enter key after arrow navigation", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} userFramework="react" />);
    const reactTab = screen.getByRole("tab", { name: /react/i });
    fireEvent.keyDown(reactTab, { key: "ArrowRight" });
    const vueTab = screen.getByRole("tab", { name: /vue/i });
    fireEvent.keyDown(vueTab, { key: "Enter" });
    expect(vueTab.getAttribute("aria-selected")).toBe("true");
  });
});
