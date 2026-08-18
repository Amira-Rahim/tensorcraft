import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BridgeCollection } from "./bridge-collection";

/**
 * Bridge collectibles (wired up 2026-07-15).
 *
 * This component existed, exported, for months without ever being imported,
 * while prd.md / marketing-plan.md / dev-plan.md all described it as the
 * shipped replacement for the removed /bridges route. The dashboard was even
 * fetching its data and discarding it. It had no tests, which is how the tier
 * badge collision below survived: `tier[0].toUpperCase()` renders "I" for both
 * identity AND intuition.
 */

const bridges = [
  {
    lessonSlug: "introduction-to-tensors",
    moduleSlug: "foundations",
    jsTitle: "Array",
    mlTitle: "Tensor",
    tier: "identity" as const,
    collected: true,
  },
  {
    lessonSlug: "activation-functions",
    moduleSlug: "neural-networks",
    jsTitle: "Guard clause",
    mlTitle: "ReLU",
    tier: "intuition" as const,
    collected: false,
  },
  {
    lessonSlug: "loss-functions",
    moduleSlug: "training-loop",
    jsTitle: "expect().toBe()",
    mlTitle: "Loss function",
    tier: "structural" as const,
    collected: true,
  },
];

describe("BridgeCollection", () => {
  it("reports how many bridges are collected", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("/3")).toBeInTheDocument();
  });

  /**
   * Only COLLECTED bridges are interactive. An uncollected one is deliberately
   * a mystery: a dimmed "?" placeholder with no title and no tier, so there is
   * nothing to open and nothing to announce.
   */
  it("makes only collected bridges interactive", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("renders uncollected bridges as mystery placeholders", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.getByText("?")).toBeInTheDocument();
    // The locked bridge must not leak its title before it is earned.
    expect(screen.queryByText("ReLU")).not.toBeInTheDocument();
    expect(screen.queryByText("Guard clause")).not.toBeInTheDocument();
  });

  it("hides mystery placeholders from screen readers", () => {
    // 50+ tiles each announcing "question mark" is noise; the collected count
    // above already carries the progress the placeholders encode.
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.getByText("?").closest("[aria-hidden]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  /**
   * The regression this component shipped with. identity -> "ID" and
   * intuition -> "IN" must be distinguishable; `tier[0]` made both "I", which
   * left colour as the only signal on a grid whose entire job is showing the
   * mix of tiers you have collected.
   */
  it("gives each tier a distinct badge rather than colliding on one letter", () => {
    const allCollected = bridges.map((b) => ({ ...b, collected: true }));
    render(<BridgeCollection bridges={allCollected} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("IN")).toBeInTheDocument();
    expect(screen.getByText("ST")).toBeInTheDocument();
  });

  it("names the tier for screen readers rather than relying on colour", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(
      screen.getByRole("button", { name: /Identity bridge: Array to Tensor/i }),
    ).toBeInTheDocument();
  });

  it("shows no detail panel until a tile is activated", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.queryByText("Tensor")).not.toBeInTheDocument();
  });

  it("expands a bridge's detail when its tile is activated", () => {
    render(<BridgeCollection bridges={bridges} />);
    const tile = screen.getByRole("button", {
      name: /Identity bridge: Array to Tensor/i,
    });
    fireEvent.click(tile);

    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Tensor")).toBeInTheDocument();
  });

  it("collapses when the same tile is activated twice", () => {
    render(<BridgeCollection bridges={bridges} />);
    const tile = screen.getByRole("button", {
      name: /Identity bridge: Array to Tensor/i,
    });
    fireEvent.click(tile);
    fireEvent.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Tensor")).not.toBeInTheDocument();
  });

  it("shows only one detail panel at a time", () => {
    render(<BridgeCollection bridges={bridges} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Identity bridge: Array to Tensor/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Structural bridge/i }));
    expect(screen.queryByText("Tensor")).not.toBeInTheDocument();
    expect(screen.getByText("Loss function")).toBeInTheDocument();
  });

  it("survives an empty collection without dividing by zero", () => {
    render(<BridgeCollection bridges={[]} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("/0")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
