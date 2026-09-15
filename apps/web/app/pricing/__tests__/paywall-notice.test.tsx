import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

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

// Spy on analytics so we can assert the funnel wire-up. With the banner gone
// these events are the component's entire observable contract.
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

  /**
   * The visible banner was removed 2026-09-15 (owner request): it restated
   * the offer (lesson count, capstone, certificate, guarantee) above a plan
   * picker that already carries it. Only the funnel events survived, so this
   * pins headlessness for the case that used to render markup. Without it,
   * re-adding a banner would leave every other test in this file green.
   */
  it("renders no DOM, even for a launched slug", () => {
    mockLocked = "deep-orbit";
    const { container } = render(<PaywallNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("fires nothing when no ?locked param is present", () => {
    mockLocked = null;
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });

  /**
   * A malicious or stale link must not enter the funnel numbers: the guard
   * is the only thing keeping an arbitrary user-supplied value out of
   * paywall_hit now that there is no markup to give it away.
   */
  it("fires nothing for an unknown world slug (defensive)", () => {
    mockLocked = "not-a-real-world";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("fires upgrade_cta_shown on mount for a launched slug", () => {
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
   * route switched to redirect-based enforcement. This component mounts at
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

  /**
   * A coming-soon world cannot be bought and ships no lessons, so it has
   * nothing to unlock. /pricing?locked=nova-canvas once rendered a purchase
   * banner quoting Deep Orbit's lesson count for it; the same guard now
   * keeps it out of the funnel.
   */
  it("does not fire paywall_hit for a coming-soon world", () => {
    mockLocked = "nova-canvas";
    mockModule = "neural-networks";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalledWith(
      "paywall_hit",
      expect.anything(),
    );
  });

  it("does not fire upgrade_cta_shown for a coming-soon world", () => {
    mockLocked = "signal-ward";
    render(<PaywallNotice />);
    expect(trackMock).not.toHaveBeenCalled();
  });
});
