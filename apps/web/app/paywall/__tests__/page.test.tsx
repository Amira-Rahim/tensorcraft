import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PaywallPage from "../page";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => <div data-testid="ambient-bg" />,
}));

describe("PaywallPage (Phase 11 §11d Wave 3 NEW)", () => {
  it('renders the "Module 1 is done" H1', () => {
    render(<PaywallPage />);
    const h1 = screen.getByTestId("paywall-heading");
    expect(h1.tagName).toBe("H1");
    expect(h1).toHaveTextContent(/Module 1 is done\. The model isn[''’]t\./i);
  });

  it("renders the primary CTA pointing to /pricing", () => {
    render(<PaywallPage />);
    const cta = screen.getByTestId("paywall-primary-cta");
    expect(cta).toHaveAttribute("href", "/pricing");
  });

  it("renders the footer CTA pointing to /pricing", () => {
    render(<PaywallPage />);
    const cta = screen.getByTestId("paywall-footer-cta");
    expect(cta).toHaveAttribute("href", "/pricing");
  });

  it("renders the free vs paid comparison table with both columns", () => {
    render(<PaywallPage />);
    expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-col-free")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-col-paid")).toBeInTheDocument();
  });

  it("comparison columns surface Free $0 and Paid From $59 pricing", () => {
    render(<PaywallPage />);
    const free = screen.getByTestId("comparison-col-free");
    const paid = screen.getByTestId("comparison-col-paid");
    expect(free).toHaveTextContent("$0");
    expect(paid).toHaveTextContent(/From \$59/);
  });

  it("comparison table includes the core paid-only feature rows", () => {
    render(<PaywallPage />);
    const table = screen.getByTestId("comparison-table");
    for (const feature of [
      "All 11 modules",
      "GitHub push flow",
      "Certificate of completion",
      "Capstone project",
      "Lifetime updates",
    ]) {
      expect(table).toHaveTextContent(feature);
    }
    // Removed 2026-07-13: "Priority email support" was never granted to the
    // $59 tier (pricing-tiers gives priority support to All-5 only), so the
    // purchase-moment table must not promise it.
    expect(table).not.toHaveTextContent("Priority email support");
  });

  it("does not ship the V1 social-proof placeholder block", () => {
    // Round 13: the "// SOCIAL PROOF PENDING" placeholder was removed -
    // an empty placeholder hurts conversion more than no testimonials. The
    // block returns once real beta quotes land.
    render(<PaywallPage />);
    expect(screen.queryByTestId("social-proof-section")).toBeNull();
    expect(screen.queryByTestId("social-proof-placeholder")).toBeNull();
  });

  it("does not ship invented beta-user testimonials", () => {
    render(<PaywallPage />);
    expect(screen.queryByTestId("testimonial-beta_user_01")).toBeNull();
    expect(screen.queryByTestId("testimonial-beta_user_02")).toBeNull();
    expect(screen.queryByTestId("testimonial-beta_user_03")).toBeNull();
  });

  it("uses rounded-none (brutalist) on the primary + footer CTAs", () => {
    render(<PaywallPage />);
    expect(screen.getByTestId("paywall-primary-cta").className).toMatch(
      /rounded-none/,
    );
    expect(screen.getByTestId("paywall-footer-cta").className).toMatch(
      /rounded-none/,
    );
  });
});
