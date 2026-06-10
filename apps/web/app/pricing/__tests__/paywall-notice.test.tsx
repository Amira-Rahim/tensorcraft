import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

// Spy on analytics so we can assert the upgrade_cta_shown wire-up.
const trackMock = vi.fn();
vi.mock("@/lib/analytics-events", () => ({
  track: (...args: unknown[]) => trackMock(...args),
  EVENTS: {
    UPGRADE_CTA_SHOWN: "upgrade_cta_shown",
    UPGRADE_CTA_CLICKED: "upgrade_cta_clicked",
  },
}));

import { PaywallNotice } from "../paywall-notice";

describe("PaywallNotice", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("renders nothing when no ?locked param is present", () => {
    mockLocked = null;
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an unknown theme slug (defensive)", () => {
    // A malicious or stale link shouldn't render anything, we only
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

  it("fires upgrade_cta_shown on mount when the banner renders for a known slug", () => {
    mockLocked = "nova-canvas";
    render(<PaywallNotice />);
    expect(trackMock).toHaveBeenCalledWith("upgrade_cta_shown", {
      source: "paywall",
      themeId: "nova-canvas",
    });
  });

  it("does not fire upgrade_cta_shown when the banner is suppressed", () => {
    mockLocked = null;
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
