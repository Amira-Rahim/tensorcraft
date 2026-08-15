import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckoutButton } from "../checkout-button";

// Regression guard for the launch-blocking bug where the buy button POSTed
// to a RELATIVE /api/payments/checkout - which resolves to the web origin
// (no such route on Vercel) instead of the API host. The checkout call MUST
// go through getApiUrl().

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/analytics", () => ({
  trackCheckoutStarted: vi.fn(),
}));

// Authenticated session so handleCheckout proceeds to the fetch.
const session = {
  access_token: "token-123",
  user: { id: "user-1" },
};
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  }),
}));

describe("CheckoutButton", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs checkout to the API host (getApiUrl), never a relative web-origin path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ code: "server_error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CheckoutButton planId="single" worldIds={["deep-orbit"]}>
        Buy Deep Orbit
      </CheckoutButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: /buy deep orbit/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];

    // getApiUrl() dev fallback is http://localhost:3001; in prod it is
    // NEXT_PUBLIC_API_URL. Either way it must be absolute to the API host.
    expect(String(url)).toMatch(/^https?:\/\/.+\/api\/payments\/checkout$/);
    expect(String(url)).not.toMatch(/^\/api\//);
    expect(
      (init as RequestInit | undefined)?.headers as Record<string, string>,
    ).toMatchObject({ Authorization: `Bearer ${session.access_token}` });
  });
});
