import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

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

describe("Nav", () => {
  it("renders the brand logo link", () => {
    render(<Nav />);
    const brandLinks = screen
      .getAllByRole("link")
      .filter((el) => el.textContent?.includes("tensorcraft"));
    expect(brandLinks.length).toBeGreaterThan(0);
    expect(brandLinks[0]).toHaveAttribute("href", "/");
  });

  it("renders Themes and Pricing links", () => {
    render(<Nav />);
    expect(screen.getByText("Themes")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("renders the sign-in CTA", () => {
    render(<Nav />);
    const cta = screen.getByRole("link", { name: /start now/i });
    expect(cta).toHaveAttribute("href", "/auth/sign-in");
  });

  it("CTA href matches ROUTES.auth.signIn", async () => {
    const { ROUTES } = await import("@tensorcraft/shared");
    render(<Nav />);
    const cta = screen.getByRole("link", { name: /start now/i });
    expect(cta).toHaveAttribute("href", ROUTES.auth.signIn);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<Nav />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
