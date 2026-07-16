import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MobileNav } from "./mobile-nav";

/**
 * Mobile menu dialog semantics (audit run #6 follow-up, 2026-07-15).
 *
 * The overlay is `fixed inset-0` and visually owns the viewport, but the page
 * behind it stays mounted. Without a trap, Tab walked straight out of the menu
 * and into links the user could not see, and Escape did nothing: a keyboard or
 * screen reader user could be operating a page they believe is covered.
 * FocusTrap already solved this for the lesson drawer; these tests keep the
 * menu wired to it.
 */

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
  }),
}));

let mockPathname = "/";

vi.mock("next/navigation", () => ({
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

beforeEach(() => {
  authState.user = null;
  mockPathname = "/";
});

function openMenu() {
  render(<MobileNav />);
  fireEvent.click(screen.getByRole("button", { name: /menu/i }));
}

describe("MobileNav", () => {
  it("renders no dialog until the menu is opened", () => {
    render(<MobileNav />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes the open menu as a modal dialog", () => {
    openMenu();
    const dialog = screen.getByRole("dialog", { name: /site menu/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape", async () => {
    openMenu();
    const dialog = screen.getByRole("dialog");

    // FocusTrap handles Escape via a React onKeyDown on its container, so the
    // event has to originate from inside the trap to bubble to it. Wait for
    // focus to actually land first: firing immediately targets the toggle
    // button, which is still outside.
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );

    fireEvent.keyDown(screen.getByRole("button", { name: /close menu/i }), {
      key: "Escape",
    });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("moves focus into the menu when it opens", async () => {
    openMenu();
    const dialog = screen.getByRole("dialog");
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  it("closes when the close button is activated", async () => {
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /close menu/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
