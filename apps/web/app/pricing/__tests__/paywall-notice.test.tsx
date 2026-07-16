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
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(screen.getByText(/Pick a plan below/i)).toBeInTheDocument();
  });

  it("fires upgrade_cta_shown on mount when the banner renders for a launched slug", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(trackMock).toHaveBeenCalledWith("upgrade_cta_shown", {
      source: "paywall",
      themeId: "deep-orbit",
    });
  });

  /**
   * These two used to pass with signal-ward / nova-canvas, which is the bug:
   * the banner accepted ANY canonical slug, so /pricing?locked=nova-canvas
   * rendered "Module 2 and beyond in Nova Canvas require a purchase" and
   * quoted Deep Orbit's lesson count, for a theme that ships no lessons and
   * cannot be bought. Only launched themes have something to unlock.
   */
  it("renders nothing for a coming-soon theme", () => {
    mockLocked = "nova-canvas";
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("does not fire upgrade_cta_shown for a coming-soon theme", () => {
    mockLocked = "signal-ward";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("quotes the paid lesson count from canon, not a literal", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    // 56 total - 5 free in module 1. Pinned in packages/shared.
    expect(screen.getByText(/remaining 51 lessons/i)).toBeInTheDocument();
  });

  it("does not fire upgrade_cta_shown when the banner is suppressed", () => {
    mockLocked = null;
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
