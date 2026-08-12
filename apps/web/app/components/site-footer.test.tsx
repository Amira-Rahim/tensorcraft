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

  it("renders only legal links (nav links live in the header)", () => {
    render(<SiteFooter />);
    for (const name of [
      /worlds/i,
      /pricing/i,
      /^blog$/i,
      /learn/i,
      /glossary/i,
    ]) {
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    }
  });

  it("renders all links with mono font class", () => {
    const { container } = render(<SiteFooter />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBeGreaterThan(0);
    for (const link of Array.from(links)) {
      expect(link.className).toMatch(/font-mono/);
    }
  });

  it("does not render the dead /bridges link", () => {
    render(<SiteFooter />);
    expect(
      screen.queryByRole("link", { name: /^bridges$/i }),
    ).not.toBeInTheDocument();
  });

  it("footer element carries aria-label", () => {
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");
    expect(footer).toHaveAttribute("aria-label", "Site footer");
  });

  it("has no `outline-none` / `outline: none` on any descendant", () => {
    const { container } = render(<SiteFooter />);
    expect(container.innerHTML).not.toMatch(/outline-none/);
    expect(container.innerHTML).not.toMatch(/outline:\s*none/);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<SiteFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
