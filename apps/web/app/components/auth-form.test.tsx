import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthForm } from "./auth-form";

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithOAuth: () => Promise.resolve({ error: null }),
      signInWithOtp: () => Promise.resolve({ error: null }),
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/auth",
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

describe("AuthForm brutalist polish", () => {
  it("email input uses rounded-none (square) + has NO outline-none class", () => {
    render(<AuthForm />);
    const email = screen.getByPlaceholderText(/you@example\.com/i);
    expect(email.className).toMatch(/rounded-none/);
    expect(email.className).not.toMatch(/outline-none/);
    expect(email.getAttribute("style") ?? "").not.toMatch(/outline:\s*none/);
  });

  it("email input has visible focus-visible ring classes", () => {
    render(<AuthForm />);
    const email = screen.getByPlaceholderText(/you@example\.com/i);
    expect(email.className).toMatch(/focus-visible:outline-2/);
    expect(email.className).toMatch(/focus-visible:outline-primary/);
    expect(email.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it("submit button is rounded-none (square)", () => {
    render(<AuthForm />);
    const submit = screen.getByRole("button", { name: /send magic link/i });
    expect(submit.className).toMatch(/rounded-none/);
  });

  it("OAuth buttons are rounded-none (square)", () => {
    render(<AuthForm />);
    const github = screen.getByRole("button", {
      name: /continue with github/i,
    });
    const google = screen.getByRole("button", {
      name: /continue with google/i,
    });
    for (const btn of [github, google]) {
      expect(btn.className).toMatch(/rounded-none/);
      expect(btn.className).toMatch(/font-mono/);
    }
  });

  it("no outline-none / outline:none in entire form markup", () => {
    const { container } = render(<AuthForm />);
    expect(container.innerHTML).not.toMatch(/outline-none/);
    expect(container.innerHTML).not.toMatch(/outline:\s*none/);
  });
});
