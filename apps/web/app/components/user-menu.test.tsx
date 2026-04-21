import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserMenu } from "./user-menu";

const authenticatedMockUser = {
  id: "u1",
  email: "user@example.com",
};

let currentUser: typeof authenticatedMockUser | null = null;

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: currentUser }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { avatar_url: null, display_name: null },
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
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

describe("UserMenu brutalist polish", () => {
  describe("unauthenticated state", () => {
    beforeEach(() => {
      currentUser = null;
    });

    it("renders Start-now CTA with square edges", async () => {
      render(<UserMenu />);
      const cta = await screen.findByRole("link", { name: /start now/i });
      expect(cta).toHaveAttribute("href", "/auth");
      expect(cta.className).toMatch(/rounded-none/);
      expect(cta.className).toMatch(/font-mono/);
    });
  });

  describe("authenticated state", () => {
    beforeEach(() => {
      currentUser = authenticatedMockUser;
    });

    it("opens brutalist-card menu on click", async () => {
      const { container } = render(<UserMenu />);
      const trigger = await screen.findByRole("button", {
        name: /user menu/i,
      });
      expect(trigger.className).toMatch(/rounded-none/);
      fireEvent.click(trigger);
      await waitFor(() => {
        const card = container.querySelector('[data-testid="user-menu-card"]');
        expect(card).not.toBeNull();
        expect(card?.className).toMatch(/rounded-none/);
        expect(card?.className).toMatch(/brutalist-shadow/);
        expect(card?.className).toMatch(/border/);
      });
    });

    it("menu items use font-mono + rounded-none", async () => {
      render(<UserMenu />);
      const trigger = await screen.findByRole("button", {
        name: /user menu/i,
      });
      fireEvent.click(trigger);
      await waitFor(() =>
        expect(
          screen.getByRole("menuitem", { name: /settings/i }),
        ).toBeInTheDocument(),
      );
      const settings = screen.getByRole("menuitem", { name: /settings/i });
      const signOut = screen.getByRole("menuitem", { name: /sign out/i });
      for (const item of [settings, signOut]) {
        expect(item.className).toMatch(/font-mono/);
        expect(item.className).toMatch(/rounded-none/);
      }
    });

    it("has no `outline-none` / `outline: none` on any descendant", async () => {
      const { container } = render(<UserMenu />);
      const trigger = await screen.findByRole("button", {
        name: /user menu/i,
      });
      fireEvent.click(trigger);
      await waitFor(() =>
        expect(
          container.querySelector('[data-testid="user-menu-card"]'),
        ).not.toBeNull(),
      );
      expect(container.innerHTML).not.toMatch(/outline-none/);
      expect(container.innerHTML).not.toMatch(/outline:\s*none/);
    });
  });
});
