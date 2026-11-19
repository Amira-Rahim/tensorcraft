import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ConsentSync } from "./consent-sync";
import { CookieConsent } from "./cookie-consent";
import { CookieSettingsButton } from "./cookie-settings-button";
import { hasAnalyticsConsent, setConsentChoice } from "../../lib/consent";

const auth = vi.hoisted(() => ({ unsubscribe: vi.fn() }));
vi.mock("../../lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (
        callback: (event: string, session: unknown) => void,
      ) => {
        queueMicrotask(() =>
          callback("INITIAL_SESSION", {
            user: { id: "alice" },
            access_token: "alice-token",
          }),
        );
        return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
      },
    },
  }),
}));

const response = (granted: boolean, revision: number) =>
  new Response(
    JSON.stringify({
      granted,
      revision,
      updatedAt: "2026-11-11T12:00:00Z",
    }),
  );

beforeEach(() => {
  localStorage.clear();
  setConsentChoice("accepted");
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("reopens settings immediately and exposes a failed account withdrawal until reconnect saves it", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(response(true, 1))
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(response(false, 2));
  vi.stubGlobal("fetch", request);
  render(
    <>
      <ConsentSync />
      <CookieConsent />
      <CookieSettingsButton />
    </>,
  );
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  expect(
    screen.queryByRole("button", { name: "Accept all" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
  expect(hasAnalyticsConsent()).toBe(false);
  expect(
    screen.getByRole("button", { name: "Essential only" }),
  ).toBeInTheDocument();
  await screen.findByText(/account withdrawal is still pending/i);
  expect(
    screen.getByRole("button", { name: "Retry account save" }),
  ).toBeInTheDocument();

  act(() => window.dispatchEvent(new Event("online")));
  await waitFor(() =>
    expect(
      screen.queryByText(/account withdrawal is still pending/i),
    ).not.toBeInTheDocument(),
  );
  expect(request).toHaveBeenCalledTimes(3);
  expect(
    request.mock.calls
      .slice(1)
      .every(([, init]) => JSON.parse(init!.body as string).granted === false),
  ).toBe(true);
  expect(hasAnalyticsConsent()).toBe(false);
});
