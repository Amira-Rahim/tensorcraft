import { act, render } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SessionListener } from "./session-listener";
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  unsubscribe: vi.fn(),
  reset: vi.fn(),
  callback: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));
vi.mock("./client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (fn: typeof mocks.callback) => {
        mocks.callback = fn;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
  }),
}));
vi.mock("../consent", () => ({
  hasAnalyticsConsent: () => false,
  onConsentChange: () => vi.fn(),
}));
vi.mock("../analytics", () => ({ identify: vi.fn(), reset: mocks.reset }));
beforeEach(() => vi.clearAllMocks());
it("refreshes server data for a changed identity and token renewal, without refreshing repeated sign-in notifications", () => {
  const view = render(<SessionListener />);
  const send = (event: string, id: string | null) =>
    act(() => mocks.callback?.(event, id ? { user: { id } } : null));
  send("INITIAL_SESSION", "a");
  send("SIGNED_IN", "a");
  expect(mocks.refresh).not.toHaveBeenCalled();
  send("SIGNED_IN", "b");
  expect(mocks.refresh).toHaveBeenCalledTimes(1);
  send("TOKEN_REFRESHED", "b");
  expect(mocks.refresh).toHaveBeenCalledTimes(2);
  send("SIGNED_OUT", null);
  expect(mocks.push).toHaveBeenCalledWith("/auth");
  expect(mocks.reset).toHaveBeenCalledOnce();
  view.unmount();
  expect(mocks.unsubscribe).toHaveBeenCalledOnce();
});
