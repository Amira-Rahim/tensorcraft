import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

// Mock next/link to render as plain anchor
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

describe("SiteFooter", () => {
  it("renders the brand name", () => {
    render(<SiteFooter />);
    expect(screen.getAllByText(/tensorcraft/i).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("renders Terms and Privacy links", () => {
    render(<SiteFooter />);
    const termsLink = screen.getByRole("link", { name: /terms/i });
    const privacyLink = screen.getByRole("link", { name: /privacy/i });

    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("displays copyright notice", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/2026 tensorcraft/i)).toBeInTheDocument();
  });

  it("footer hrefs match ROUTES constants", async () => {
    const { ROUTES } = await import("@tensorcraft/shared");
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: /themes/i })).toHaveAttribute(
      "href",
      ROUTES.themes,
    );
    expect(screen.getByRole("link", { name: /pricing/i })).toHaveAttribute(
      "href",
      ROUTES.pricing,
    );
    expect(screen.getByRole("link", { name: /blog/i })).toHaveAttribute(
      "href",
      ROUTES.blog,
    );
    expect(screen.getByRole("link", { name: /glossary/i })).toHaveAttribute(
      "href",
      ROUTES.glossary,
    );
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<SiteFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
