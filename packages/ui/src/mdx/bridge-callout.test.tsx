import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BridgeCallout } from "./bridge-callout";
import { BRIDGES } from "@tensorcraft/shared";

const bridgeWithVariants = {
  jsTitle: "Component Props",
  jsCode: "function Card(props) { return props.title; }",
  mlTitle: "Training Data",
  mlCode: "model.fit(trainingData, labels)",
  tier: "structural" as const,
};

// Fictional pair not present in the canonical registry, keeps "no breaks"
// fallback assertion meaningful as we add breaks to real registry entries.
const bridgeWithoutVariants = {
  jsTitle: "Fixture JS Concept",
  jsCode: "// fixture js code",
  mlTitle: "Fixture ML Concept",
  mlCode: "// fixture ml code",
  tier: "structural" as const,
};

describe("BridgeCallout", () => {
  it("returns null when bridge is undefined", () => {
    const { container } = render(<BridgeCallout bridge={undefined} />);
    expect(container.innerHTML).toBe("");
  });

  it.each([
    ["with variants", bridgeWithVariants],
    ["without variants", bridgeWithoutVariants],
  ])("marks the %s root with data-aside", (_label, bridge) => {
    const { container } = render(<BridgeCallout bridge={bridge} />);
    expect(container.firstElementChild).toHaveAttribute("data-aside", "");
  });

  it("renders ML title and code", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Training Data")).toBeInTheDocument();
    expect(screen.getByText(/model\.fit/)).toBeInTheDocument();
  });

  it("renders no framework tab bar (React-only V1)", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("renders the React label and the React JS variant code", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    // The "React" framework label is shown in place of the old tab bar.
    expect(screen.getByText("React")).toBeInTheDocument();
    // bridge #1's react variant jsCode (Component props ↔ Training data).
    expect(screen.getByText(/function Card/)).toBeInTheDocument();
  });

  it("shows tier badge with correct label", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByText("Structural Bridge")).toBeInTheDocument();
  });

  it("shows connection text in footer", () => {
    render(<BridgeCallout bridge={bridgeWithVariants} />);
    expect(screen.getByTestId("bridge-footer")).toBeInTheDocument();
  });

  it("falls back to generic layout when bridge has no react variant", () => {
    render(<BridgeCallout bridge={bridgeWithoutVariants} />);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText("Fixture JS Concept")).toBeInTheDocument();
    expect(screen.getByText("Fixture ML Concept")).toBeInTheDocument();
  });

  it.each([
    ["Array.reduce()", "Neuron"],
    ["Component props", "Unrelated model concept"],
    ["Unrelated JS concept", "Training data"],
  ])(
    "does not inject catalog metadata for an unmatched pair: %s / %s",
    (jsTitle, mlTitle) => {
      render(
        <BridgeCallout
          bridge={{ ...bridgeWithoutVariants, jsTitle, mlTitle }}
        />,
      );
      expect(screen.queryByText("React")).toBeNull();
      expect(screen.queryByTestId("bridge-footer")).toBeNull();
      expect(screen.queryByTestId("bridge-breaks")).toBeNull();
      expect(screen.getByText(jsTitle)).toBeInTheDocument();
      expect(screen.getByText(mlTitle)).toBeInTheDocument();
    },
  );

  it.each([
    [3, "expect().toBe()", "Loss Function"],
    [10, "Data Transformation", "Feature Engineering"],
    [14, "Math.max(0, x)", "ReLU Activation"],
    [15, "Error up the call stack", "Backpropagation"],
    [47, "Tree-Shaking", "Pruning"],
  ] as const)(
    "keeps the explicit lesson alias for bridge %i",
    (id, jsTitle, mlTitle) => {
      render(
        <BridgeCallout
          bridge={{ ...bridgeWithoutVariants, jsTitle, mlTitle }}
        />,
      );
      const entry = BRIDGES.find((bridge) => bridge.id === id)!;
      expect(screen.getByTestId("bridge-breaks")).toHaveTextContent(
        entry.breaks!,
      );
      expect(screen.getByText("// fixture ml code")).toBeInTheDocument();
      if (entry.variants?.react) {
        expect(screen.getByTestId("bridge-footer")).toHaveTextContent(
          entry.connection,
        );
      } else {
        expect(screen.queryByTestId("bridge-footer")).toBeNull();
      }
    },
  );

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
      expect(footer.textContent).toMatch(/Where the analogy ends/i);
      expect(footer.textContent).toMatch(/gradient descent/);
    });

    it("renders inline breaks in react layout", () => {
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
        jsTitle: "Reconciliation",
        jsCode: "// react reconciles",
        mlTitle: "Gradient descent",
        mlCode: "optimizer.step()",
        tier: "intuition" as const,
      };
      render(<BridgeCallout bridge={bridge} />);
      const footer = screen.getByTestId("bridge-breaks");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent(
        BRIDGES.find((entry) => entry.id === 4)!.breaks!,
      );
    });

    it("inline breaks overrides canonical registry breaks", () => {
      const bridge = {
        jsTitle: "Reconciliation",
        jsCode: "// react reconciles",
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
