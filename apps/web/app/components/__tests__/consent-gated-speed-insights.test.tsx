import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CONSENT_KEY, notifyConsentChanged } from "@/lib/consent";
import { ConsentGatedSpeedInsights } from "../consent-gated-speed-insights";

// The real component injects a script tag and beacons vitals; a marker div is
// enough to assert whether the gate mounted it. The consent lib is real, so
// the same-tab reaction path (the recorded first-session analytics bug) is
// exercised end to end.
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}));

function grantConsent() {
  localStorage.setItem(CONSENT_KEY, "accepted");
  notifyConsentChanged();
}

function withdrawConsent() {
  localStorage.setItem(CONSENT_KEY, "rejected");
  notifyConsentChanged();
}

describe("ConsentGatedSpeedInsights", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing before consent", () => {
    render(<ConsentGatedSpeedInsights />);
    expect(screen.queryByTestId("speed-insights")).not.toBeInTheDocument();
  });

  it("renders Speed Insights when consent was already granted", () => {
    grantConsent();
    render(<ConsentGatedSpeedInsights />);
    expect(screen.getByTestId("speed-insights")).toBeInTheDocument();
  });

  it("mounts in the same tab the moment consent is granted", () => {
    render(<ConsentGatedSpeedInsights />);
    expect(screen.queryByTestId("speed-insights")).not.toBeInTheDocument();

    act(() => grantConsent());
    expect(screen.getByTestId("speed-insights")).toBeInTheDocument();
  });

  it("unmounts when consent is withdrawn", () => {
    grantConsent();
    render(<ConsentGatedSpeedInsights />);
    expect(screen.getByTestId("speed-insights")).toBeInTheDocument();

    act(() => withdrawConsent());
    expect(screen.queryByTestId("speed-insights")).not.toBeInTheDocument();
  });
});
