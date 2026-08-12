import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Controls what useSearchParams returns for each test
let mockLocked: string | null = null;
let mockModule: string | null = null;

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "locked") return mockLocked;
      if (key === "module") return mockModule;
      return null;
    },
  }),
}));

vi.mock("@tensorcraft/worlds", () => ({
  worldSlugs: [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const,
  worlds: {
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
    PAYWALL_HIT: "paywall_hit",
  },
}));

import { PaywallNotice } from "../paywall-notice";

describe("PaywallNotice", () => {
  beforeEach(() => {
    trackMock.mockClear();
    mockModule = null;
  });

  it("renders nothing when no ?locked param is present", () => {
    mockLocked = null;
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for an unknown world slug (defensive)", () => {
    // A malicious or stale link shouldn't render anything, we only
    // surface canonical world slugs.
    mockLocked = "not-a-real-world";
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the world display name for a known slug", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Deep Orbit/)).toBeInTheDocument();
  });

  /**
   * The banner used to only state the rule ("Module 2 and beyond require a
   * purchase. Pick a plan below."). It replaces the /paywall page for anyone
   * arriving from a gated lesson, so it has to carry the offer and the risk
   * reversal, not just the fact of the gate.
   */
  it("names what is behind the wall rather than only stating the rule", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(
      screen.getByText(/where the model actually learns/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/capstone/i)).toBeInTheDocument();
  });

  it("restates the money-back guarantee at the objection moment", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(
      screen.getByText(/14-day money-back guarantee/i),
    ).toBeInTheDocument();
  });

  it("fires upgrade_cta_shown on mount when the banner renders for a launched slug", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    expect(trackMock).toHaveBeenCalledWith("upgrade_cta_shown", {
      source: "paywall",
      worldId: "deep-orbit",
    });
  });

  /**
   * paywall_hit was specced in dev-plan §4c but never fired: its only call
   * site lived in <LessonPaywall>, which became unreachable when the lesson
   * route switched to redirect-based enforcement. The banner renders at
   * exactly the paywall-hit moment, so it is the correct home for the event.
   */
  it("fires paywall_hit on mount with the gated world and module", () => {
    mockLocked = "deep-orbit";
    mockModule = "neural-networks";
    render(<PaywallNotice />);
    expect(trackMock).toHaveBeenCalledWith("paywall_hit", {
      worldId: "deep-orbit",
      moduleId: "neural-networks",
    });
  });

  it("fires paywall_hit with an unknown module when the param is absent", () => {
    mockLocked = "deep-orbit";
    mockModule = null;
    render(<PaywallNotice />);
    expect(trackMock).toHaveBeenCalledWith("paywall_hit", {
      worldId: "deep-orbit",
      moduleId: "unknown",
    });
  });

  it("does not fire paywall_hit for a coming-soon world", () => {
    mockLocked = "nova-canvas";
    mockModule = "neural-networks";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalledWith(
      "paywall_hit",
      expect.anything(),
    );
  });

  /**
   * These two used to pass with signal-ward / nova-canvas, which is the bug:
   * the banner accepted ANY canonical slug, so /pricing?locked=nova-canvas
   * rendered "Module 2 and beyond in Nova Canvas require a purchase" and
   * quoted Deep Orbit's lesson count, for a world that ships no lessons and
   * cannot be bought. Only launched worlds have something to unlock.
   */
  it("renders nothing for a coming-soon world", () => {
    mockLocked = "nova-canvas";
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("does not fire upgrade_cta_shown for a coming-soon world", () => {
    mockLocked = "signal-ward";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("quotes the paid lesson count from canon, not a literal", () => {
    mockLocked = "deep-orbit";
    render(<PaywallNotice />);
    // 56 total - 5 free in module 1. Pinned in packages/shared, so a literal
    // in the banner would silently drift when the content count changes.
    expect(screen.getByText(/51 lessons/i)).toBeInTheDocument();
  });

  it("does not fire upgrade_cta_shown when the banner is suppressed", () => {
    mockLocked = null;
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
