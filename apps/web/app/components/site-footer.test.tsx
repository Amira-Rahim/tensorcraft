import { describe, it, expect } from "vitest";
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

  it("renders Home, Terms, and Privacy links", () => {
    render(<SiteFooter />);
    const homeLink = screen.getByRole("link", { name: /home/i });
    const termsLink = screen.getByRole("link", { name: /terms/i });
    const privacyLink = screen.getByRole("link", { name: /privacy/i });

    expect(homeLink).toHaveAttribute("href", "/");
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
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      ROUTES.home,
    );
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<SiteFooter />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
