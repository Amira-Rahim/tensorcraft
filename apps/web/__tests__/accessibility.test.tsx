import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

// Test client components that can render in jsdom.
// Server components (async pages) cannot be tested with vitest-axe.

// --- Mocks ---------------------------------------------------------------

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));

vi.mock("../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

// --- Tests ----------------------------------------------------------------

describe("Accessibility", () => {
  it("MobileNav has no axe violations", async () => {
    const { MobileNav } = await import("../app/components/mobile-nav");
    const { container } = render(<MobileNav />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("CookieConsent has no axe violations", async () => {
    const { CookieConsent } = await import("../app/components/cookie-consent");
    const { container } = render(<CookieConsent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("SiteFooter has no axe violations", async () => {
    const { SiteFooter } = await import("../app/components/site-footer");
    const { container } = render(<SiteFooter />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
