import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BridgeTicker, type BridgeItem } from "./bridge-ticker";

function mockMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(() => mql),
  });
  return mql;
}

const items: BridgeItem[] = [
  { fe: "useState", ml: "weight tensor", tier: "identity" },
  { fe: "useEffect", ml: "gradient step", tier: "structural" },
  { fe: "props.children", ml: "composed layer", tier: "intuition" },
];

describe("BridgeTicker", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each item doubled for seamless scroll (2N cards)", () => {
    const { container } = render(<BridgeTicker items={items} />);
    const cards = container.querySelectorAll('[data-testid="bridge-card"]');
    expect(cards.length).toBe(items.length * 2);
  });

  it("renders FE and ML content in each card", () => {
    const { container } = render(<BridgeTicker items={items} />);
    const text = container.textContent ?? "";
    expect(text).toContain("useState");
    expect(text).toContain("weight tensor");
    expect(text).toContain("useEffect");
    expect(text).toContain("gradient step");
  });

  it("renders a tier badge for each item", () => {
    const { container } = render(<BridgeTicker items={items} />);
    const badges = container.querySelectorAll('[data-testid="tier-badge"]');
    // 2N badges (each item duplicated)
    expect(badges.length).toBe(items.length * 2);
    const tierTexts = Array.from(badges).map((b) => b.textContent);
    expect(tierTexts).toContain("identity");
    expect(tierTexts).toContain("structural");
    expect(tierTexts).toContain("intuition");
  });

  it("includes an accessible play/pause toggle button", () => {
    const { container, getByRole } = render(<BridgeTicker items={items} />);
    const btn = getByRole("button");
    expect(btn.getAttribute("aria-label")).toMatch(/pause|play/i);
    // default state: playing → label should say "Pause"
    expect(btn.getAttribute("aria-label")).toMatch(/pause/i);

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-label")).toMatch(/play/i);

    // Paused state should mark the track paused (data-paused="true")
    const track = container.querySelector('[data-testid="ticker-track"]');
    expect(track?.getAttribute("data-paused")).toBe("true");
  });

  it("renders a static grid (no animation class) when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    const { container } = render(<BridgeTicker items={items} />);
    const track = container.querySelector('[data-testid="ticker-track"]');
    expect(track?.getAttribute("data-reduced-motion")).toBe("true");
    // Under reduced motion, items should NOT be duplicated (pure static grid).
    const cards = container.querySelectorAll('[data-testid="bridge-card"]');
    expect(cards.length).toBe(items.length);
  });
});
