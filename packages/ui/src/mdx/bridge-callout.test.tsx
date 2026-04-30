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

// Fictional pair not present in the canonical registry — keeps "no breaks"
// fallback assertion meaningful as we add breaks to real registry entries.
const bridgeWithoutVariants = {
  feTitle: "Fixture FE Concept",
  feCode: "// fixture fe code",
  mlTitle: "Fixture ML Concept",
  mlCode: "// fixture ml code",
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
    expect(screen.getByText("Fixture FE Concept")).toBeInTheDocument();
    expect(screen.getByText("Fixture ML Concept")).toBeInTheDocument();
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

  describe("breaks footer", () => {
    it("omits breaks footer when bridge has no breaks and registry has none", () => {
      render(<BridgeCallout bridge={bridgeWithoutVariants} />);
      expect(screen.queryByTestId("bridge-breaks")).toBeNull();
    });

    it("renders inline breaks in generic layout", () => {
      const bridge = {
        ...bridgeWithoutVariants,
        breaks:
          "CSS initial values reset visual properties; weight initialization sets numerical starting points for gradient descent.",
      };
      render(<BridgeCallout bridge={bridge} />);
      const footer = screen.getByTestId("bridge-breaks");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toMatch(/Where this breaks/i);
      expect(footer.textContent).toMatch(/gradient descent/);
    });

    it("renders inline breaks in tabbed layout", () => {
      const bridge = {
        ...bridgeWithVariants,
        breaks:
          "Props are external and immutable per render; training data is consumed once and shapes mutable internal weights.",
      };
      render(<BridgeCallout bridge={bridge} />);
      const footer = screen.getByTestId("bridge-breaks");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toMatch(/mutable internal weights/);
    });

    it("falls back to canonical registry breaks when inline absent", () => {
      // Bridge #4 in registry: Gradient descent ↔ Reconciliation, has breaks
      const bridge = {
        feTitle: "Reconciliation",
        feCode: "// react reconciles",
        mlTitle: "Gradient descent",
        mlCode: "optimizer.step()",
        tier: "intuition" as const,
      };
      render(<BridgeCallout bridge={bridge} />);
      const footer = screen.getByTestId("bridge-breaks");
      expect(footer).toBeInTheDocument();
      expect(footer.textContent).toMatch(
        /stochastic|local minimum|deterministic/i,
      );
    });

    it("inline breaks overrides canonical registry breaks", () => {
      const bridge = {
        feTitle: "Reconciliation",
        feCode: "// react reconciles",
        mlTitle: "Gradient descent",
        mlCode: "optimizer.step()",
        tier: "intuition" as const,
        breaks: "INLINE OVERRIDE TEXT",
      };
      render(<BridgeCallout bridge={bridge} />);
      const footer = screen.getByTestId("bridge-breaks");
      expect(footer.textContent).toMatch(/INLINE OVERRIDE TEXT/);
      expect(footer.textContent).not.toMatch(/local minimum/);
    });
  });
});
