import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaywallNotice } from "../paywall-notice";

// Controls what useSearchParams returns for each test
let mockLocked: string | null = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "locked" ? mockLocked : null),
  }),
}));

vi.mock("@tensorcraft/themes", () => ({
  themeSlugs: [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const,
  themes: {
    "deep-orbit": { displayName: "Deep Orbit" },
    "neon-protocol": { displayName: "Neon Protocol" },
    "signal-ward": { displayName: "Signal Ward" },
    "nova-canvas": { displayName: "Nova Canvas" },
    "terra-grid": { displayName: "Terra Grid" },
  },
}));

describe("PaywallNotice", () => {
  it("renders nothing when no ?locked param is present", () => {
    mockLocked = null;
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an unknown theme slug (defensive)", () => {
    // A malicious or stale link shouldn't render anything — we only
    // surface canonical theme slugs.
    mockLocked = "not-a-real-theme";
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the theme display name for a known slug", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Deep Orbit/)).toBeInTheDocument();
  });

  it("points the user to the plan picker below", () => {
    mockLocked = "signal-ward";
    render(<PaywallNotice />);
    expect(screen.getByText(/Pick a plan below/i)).toBeInTheDocument();
  });
});
