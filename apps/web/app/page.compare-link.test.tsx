import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import Home from "./page";

// Stub next/link so render works without the Next router.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Stub the heavy client islands so the full Home page renders in jsdom.
vi.mock("./components/landing-hero", () => ({
  LandingHero: () => <div data-testid="hero-stub" />,
}));
vi.mock("./components/landing-bridge-ticker", () => ({
  LandingBridgeTicker: () => <div data-testid="ticker-stub" />,
}));
vi.mock("./components/bridge-preview-section", () => ({
  BridgePreviewSection: () => <div data-testid="bridge-preview-stub" />,
}));
vi.mock("./components/five-worlds-section", () => ({
  FiveWorldsSection: () => <div data-testid="five-worlds-stub" />,
}));

describe("Landing page → /compare discoverability", () => {
  it("links to the /compare page", () => {
    const { container } = render(<Home />);
    const link = container.querySelector('a[href="/compare"]');
    expect(link).not.toBeNull();
    expect(link!.textContent).toMatch(/compar/i);
  });
});
