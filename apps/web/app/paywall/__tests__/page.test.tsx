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
  it('renders the "Continue Your ML Journey" H1', () => {
    render(<PaywallPage />);
    const h1 = screen.getByTestId("paywall-heading");
    expect(h1.tagName).toBe("H1");
    expect(h1).toHaveTextContent(/Continue Your ML Journey/i);
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

  it("comparison columns surface Free $0 and Paid From $49 pricing", () => {
    render(<PaywallPage />);
    const free = screen.getByTestId("comparison-col-free");
    const paid = screen.getByTestId("comparison-col-paid");
    expect(free).toHaveTextContent("$0");
    expect(paid).toHaveTextContent(/From \$49/);
  });

  it("comparison table includes the core paid-only feature rows", () => {
    render(<PaywallPage />);
    const table = screen.getByTestId("comparison-table");
    for (const feature of [
      "All 11 modules",
      "GitHub push flow",
      "Certificate of completion",
      "Capstone project",
      "Priority email support",
    ]) {
      expect(table).toHaveTextContent(feature);
    }
  });

  it("renders a social proof placeholder (real beta quotes land post-launch)", () => {
    render(<PaywallPage />);
    expect(screen.getByTestId("social-proof-section")).toBeInTheDocument();
    const placeholder = screen.getByTestId("social-proof-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.textContent).toMatch(/social proof pending/i);
  });

  it("does not ship invented beta-user testimonials", () => {
    render(<PaywallPage />);
    expect(screen.queryByTestId("testimonial-beta_user_01")).toBeNull();
    expect(screen.queryByTestId("testimonial-beta_user_02")).toBeNull();
    expect(screen.queryByTestId("testimonial-beta_user_03")).toBeNull();
  });

  it("uses rounded-none (brutalist) on CTAs and the placeholder card", () => {
    render(<PaywallPage />);
    expect(screen.getByTestId("paywall-primary-cta").className).toMatch(
      /rounded-none/,
    );
    expect(screen.getByTestId("paywall-footer-cta").className).toMatch(
      /rounded-none/,
    );
    expect(screen.getByTestId("social-proof-placeholder").className).toMatch(
      /rounded-none/,
    );
  });
});
