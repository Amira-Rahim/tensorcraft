import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

// Mutable per-test auth state so a single mock can serve both
// unauthenticated and authenticated cases.
const authState: { user: { id: string } | null } = { user: null };

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: authState.user }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

let mockPathname = "/";

beforeEach(() => {
  authState.user = null;
  mockPathname = "/";
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname,
}));

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
      .filter((el) => /tensorcraft/i.test(el.textContent ?? ""));
    expect(brandLinks.length).toBeGreaterThan(0);
    expect(brandLinks[0]).toHaveAttribute("href", "/");
  });

  it("prioritizes learning destinations in the dashboard area", async () => {
    mockPathname = "/dashboard/progress";
    render(<Nav />);
    expect(screen.getByRole("link", { name: "Progress" })).toHaveAttribute(
      "href",
      "/dashboard/progress",
    );
    expect(screen.getByRole("link", { name: "Project" })).toHaveAttribute(
      "href",
      "/dashboard/project",
    );
    expect(screen.queryByRole("link", { name: "Pricing" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Blog" })).toBeNull();
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveClass(
      "text-primary",
    );
    expect(screen.getByRole("link", { name: "Progress" })).toHaveClass(
      "text-primary",
    );
  });
  it("renders Worlds and Pricing links", () => {
    render(<Nav />);
    expect(screen.getByText("Worlds")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("renders the sign-in CTA", () => {
    render(<Nav />);
    const cta = screen.getByRole("link", { name: /start now/i });
    expect(cta).toHaveAttribute("href", "/auth");
  });

  it("CTA href matches ROUTES.auth.signIn", async () => {
    const { ROUTES } = await import("@tensorcraft/shared");
    render(<Nav />);
    const cta = screen.getByRole("link", { name: /start now/i });
    expect(cta).toHaveAttribute("href", ROUTES.auth.signIn);
  });

  it("renders 60px nav bar (h-15)", () => {
    const { container } = render(<Nav />);
    const nav = container.querySelector('[data-testid="site-nav"]');
    expect(nav).not.toBeNull();
    expect(nav?.className).toContain("h-15");
  });

  it("brand link href is `/`", () => {
    render(<Nav />);
    const brandLinks = screen
      .getAllByRole("link")
      .filter((el) => /tensorcraft/i.test(el.textContent ?? ""));
    expect(brandLinks[0]).toHaveAttribute("href", "/");
  });

  it("T_ logo badge is a square bordered block with mono font", () => {
    const { container } = render(<Nav />);
    const badge = container.querySelector('[data-testid="nav-logo-badge"]');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("T_");
    expect(badge?.className).toMatch(/w-7/);
    expect(badge?.className).toMatch(/h-7/);
    expect(badge?.className).toMatch(/font-mono/);
    expect(badge?.className).toMatch(/rounded-none/);
    expect(badge?.className).toMatch(/border/);
  });

  it("uses solid bg-surface (no gradient)", () => {
    const { container } = render(<Nav />);
    const nav = container.querySelector('[data-testid="site-nav"]');
    expect(nav?.className).toContain("bg-surface");
    expect(nav?.className).not.toMatch(/gradient/);
  });

  it("has no `outline: none` or `outline-none` on any descendant", () => {
    const { container } = render(<Nav />);
    expect(container.innerHTML).not.toMatch(/outline-none/);
    expect(container.innerHTML).not.toMatch(/outline:\s*none/);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<Nav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("hides itself on lesson viewer routes (focus mode)", () => {
    mockPathname = "/worlds/deep-orbit/foundations/introduction-to-tensors";
    render(<Nav />);
    expect(screen.queryByTestId("site-nav")).toBeNull();
  });

  it("stays visible on world routes", () => {
    mockPathname = "/worlds/deep-orbit";
    render(<Nav />);
    expect(screen.getByTestId("site-nav")).toBeInTheDocument();
  });

  it("stays visible on capstone routes", () => {
    mockPathname = "/worlds/deep-orbit/capstone";
    render(<Nav />);
    expect(screen.getByTestId("site-nav")).toBeInTheDocument();
  });
});
