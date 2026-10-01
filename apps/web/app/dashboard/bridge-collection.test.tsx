import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BridgeCollection } from "./bridge-collection";
const bridges = [
  {
    lessonSlug: "tensors",
    moduleSlug: "foundations",
    jsTitle: "Array",
    mlTitle: "Tensor",
    tier: "identity" as const,
    collected: true,
  },
  {
    lessonSlug: "relu",
    moduleSlug: "networks",
    jsTitle: "Guard clause",
    mlTitle: "ReLU",
    tier: "intuition" as const,
    collected: false,
  },
];
describe("earned bridges", () => {
  it("shows readable earned connections and no unknown placeholders", () => {
    render(<BridgeCollection bridges={bridges} />);
    expect(screen.getByText("1 of 2 collected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Identity bridge: Array to Tensor/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("?")).toBeNull();
    expect(screen.queryByText(/ReLU/)).toBeNull();
  });
  it("opens a direct lesson link and collapses it on a second activation", () => {
    render(<BridgeCollection bridges={bridges} worldSlug="example" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("link", { name: "Revisit this connection →" }),
    ).toHaveAttribute("href", "/worlds/example/foundations/tensors");
    fireEvent.click(button);
    expect(screen.queryByRole("link")).toBeNull();
  });
  it("omits an entirely unearned collection", () => {
    const { container } = render(
      <BridgeCollection
        bridges={bridges.map((b) => ({ ...b, collected: false }))}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
