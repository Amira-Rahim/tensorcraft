import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PricingTiers } from "../pricing-tiers";

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

// Minimal router stub, CheckoutButton pulls in next/navigation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Supabase client, no session so we don't hit owned-theme lookups.
const getSessionMock = vi.fn().mockResolvedValue({ data: { session: null } });
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: getSessionMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/analytics", () => ({
  trackCheckoutStarted: vi.fn(),
}));

vi.mock("@tensorcraft/themes", () => {
  const slugs = [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const;
  return {
    themeSlugs: slugs,
    themes: {
      "deep-orbit": {
        displayName: "Deep Orbit",
        palette: { primary: "#00f0ff" },
      },
      "neon-protocol": {
        displayName: "Neon Protocol",
        palette: { primary: "#ff00aa" },
      },
      "signal-ward": {
        displayName: "Signal Ward",
        palette: { primary: "#ffd400" },
      },
      "nova-canvas": {
        displayName: "Nova Canvas",
        palette: { primary: "#ff7a00" },
      },
      "terra-grid": {
        displayName: "Terra Grid",
        palette: { primary: "#00c27a" },
      },
    },
  };
});

// Stub fetch so CheckoutButton's POST can be asserted.
const fetchMock = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ url: "https://checkout.stripe.com/abc" }),
});

describe("PricingTiers (brutalist 5-tier grid)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id" },
        },
      },
    });
    // @ts-expect-error, jsdom lacks fetch; we install a stub per test.
    global.fetch = fetchMock;
    // @ts-expect-error, jsdom location is read-only; we replace it.
    delete window.location;
    // @ts-expect-error, minimal Location polyfill for CheckoutButton.
    window.location = { href: "" };
  });

  it("renders exactly 5 tier cards", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-single")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-two")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-three")).toBeInTheDocument();
    expect(screen.getByTestId("tier-card-all-five")).toBeInTheDocument();
  });

  it("renders canonical dollar amounts on every tier", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toHaveTextContent("$0");
    expect(screen.getByTestId("tier-card-single")).toHaveTextContent("$59");
    expect(screen.getByTestId("tier-card-two")).toHaveTextContent("$99");
    expect(screen.getByTestId("tier-card-three")).toHaveTextContent("$129");
    expect(screen.getByTestId("tier-card-all-five")).toHaveTextContent("$159");
  });

  it("maps plan ids to tier cards", () => {
    render(<PricingTiers />);
    expect(screen.getByTestId("tier-card-free")).toHaveAttribute(
      "data-plan-id",
      "free",
    );
    expect(screen.getByTestId("tier-card-single")).toHaveAttribute(
      "data-plan-id",
      "single",
    );
    expect(screen.getByTestId("tier-card-two")).toHaveAttribute(
      "data-plan-id",
      "twoBundle",
    );
    expect(screen.getByTestId("tier-card-three")).toHaveAttribute(
      "data-plan-id",
      "threeBundle",
    );
    expect(screen.getByTestId("tier-card-all-five")).toHaveAttribute(
      "data-plan-id",
      "allFive",
    );
  });

  it("highlights All 5 Themes as the recommended / best-value tier", () => {
    render(<PricingTiers />);
    const card = screen.getByTestId("tier-card-all-five");
    expect(card).toHaveAttribute("data-recommended", "true");
    expect(card).toHaveTextContent(/Best Value/i);
  });

  it("uses rounded-none (brutalist) on every tier card", () => {
    render(<PricingTiers />);
    for (const slug of ["free", "single", "two", "three", "all-five"]) {
      const card = screen.getByTestId(`tier-card-${slug}`);
      expect(card.className).toMatch(/rounded-none/);
    }
  });

  it("All 5 CTA is disabled at V1 (only Deep Orbit launched) and shows wait copy", () => {
    // V1 scope-revert: bundle tiers (2/3/all-five) are auto-disabled while
    // `LAUNCHED_THEMES.length` is below the bundle size, so the cart can
    // never produce a basket the API would reject. Re-enable this test as
    // a positive checkout assertion when all 5 themes ship.
    render(<PricingTiers />);
    const card = screen.getByTestId("tier-card-all-five");
    const btn = Array.from(card.querySelectorAll("button")).find((b) =>
      /Get All 5/i.test(b.textContent ?? ""),
    ) as HTMLButtonElement | undefined;
    expect(btn).toBeTruthy();
    expect(btn!.disabled).toBe(true);
    expect(card.textContent).toMatch(/Available when all 5 themes launch/i);
  });

  it("Single tier CTA sends planId=single with the picked theme", async () => {
    render(<PricingTiers />);
    const card = screen.getByTestId("tier-card-single");
    // Pick a theme to enable the CTA, one of the theme-picker buttons.
    const themeBtn = Array.from(card.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Deep Orbit",
    ) as HTMLButtonElement | undefined;
    expect(themeBtn).toBeTruthy();
    fireEvent.click(themeBtn!);

    const cta = Array.from(card.querySelectorAll("button")).find((b) =>
      /Get Single/i.test(b.textContent ?? ""),
    ) as HTMLButtonElement | undefined;
    expect(cta).toBeTruthy();
    fireEvent.click(cta!);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.planId).toBe("single");
    expect(body.themeIds).toHaveLength(1);
  });
});
