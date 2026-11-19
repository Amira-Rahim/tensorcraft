import { act, render } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SessionListener } from "./session-listener";
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  push: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeConsent: vi.fn(),
  reset: vi.fn(),
  identify: vi.fn(),
  track: vi.fn(),
  tagKitEventOnce: vi.fn(),
  getUser: vi.fn(),
  consent: false,
  consentCallback: null as null | (() => void),
  callback: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }),
}));
vi.mock("./client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: (fn: typeof mocks.callback) => {
        mocks.callback = fn;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
  }),
}));
vi.mock("../consent", () => ({
  hasAnalyticsConsent: () => mocks.consent,
  onConsentChange: (handler: () => void) => {
    mocks.consentCallback = handler;
    handler();
    return mocks.unsubscribeConsent;
  },
}));
vi.mock("../analytics", () => ({
  identify: mocks.identify,
  reset: mocks.reset,
}));
vi.mock("../analytics-events", () => ({
  EVENTS: { SIGNUP_COMPLETED: "signup_completed" },
  track: mocks.track,
}));
vi.mock("../kit-tag", () => ({ tagKitEventOnce: mocks.tagKitEventOnce }));

const returningSession = {
  access_token: "session-token",
  user: {
    id: "returning-account",
    created_at: "2026-01-01T00:00:00.000Z",
    app_metadata: { provider: "github" },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.consent = false;
  mocks.consentCallback = null;
  mocks.callback = null;
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  mocks.tagKitEventOnce.mockResolvedValue(undefined);
});
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
  expect(mocks.unsubscribeConsent).toHaveBeenCalledOnce();
});

it("keeps returning sign-ins out of registration counts across repeated callbacks and remounts", async () => {
  mocks.consent = true;
  const view = render(<SessionListener />);

  await act(async () => {
    mocks.callback?.("INITIAL_SESSION", returningSession);
    mocks.callback?.("SIGNED_IN", returningSession);
    mocks.callback?.("TOKEN_REFRESHED", returningSession);
    mocks.callback?.("SIGNED_IN", returningSession);
    await vi.dynamicImportSettled();
  });

  expect(mocks.identify).toHaveBeenCalledWith("returning-account", {
    created_at: returningSession.user.created_at,
  });
  expect(mocks.identify).toHaveBeenCalledTimes(2);
  expect(mocks.tagKitEventOnce).toHaveBeenCalledWith(
    "signed_up",
    "tc_signup_tagged",
  );
  expect(mocks.track).not.toHaveBeenCalled();

  view.unmount();
  const remounted = render(<SessionListener />);
  await act(async () => {
    mocks.callback?.("SIGNED_IN", returningSession);
    await vi.dynamicImportSettled();
  });

  expect(mocks.identify).toHaveBeenCalledTimes(3);
  expect(mocks.track).not.toHaveBeenCalled();
  remounted.unmount();
});

it("does not infer registration from a session with matching account and sign-in timestamps", async () => {
  mocks.consent = true;
  const view = render(<SessionListener />);

  await act(async () => {
    mocks.callback?.("SIGNED_IN", {
      ...returningSession,
      user: {
        ...returningSession.user,
        id: "recent-account",
        created_at: "2026-11-11T10:00:00.000Z",
        last_sign_in_at: "2026-11-11T10:00:00.000Z",
      },
    });
    await vi.dynamicImportSettled();
  });

  expect(mocks.identify).toHaveBeenCalledWith("recent-account", {
    created_at: "2026-11-11T10:00:00.000Z",
  });
  expect(mocks.track).not.toHaveBeenCalled();
  view.unmount();
});

it("identifies the current account after consent without replaying a registration event", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: returningSession.user } });
  const view = render(<SessionListener />);

  await act(async () => {
    mocks.callback?.("SIGNED_IN", returningSession);
    await vi.dynamicImportSettled();
  });

  expect(mocks.identify).not.toHaveBeenCalled();
  expect(mocks.getUser).not.toHaveBeenCalled();
  expect(mocks.track).not.toHaveBeenCalled();

  await act(async () => {
    mocks.consent = true;
    mocks.consentCallback?.();
  });

  expect(mocks.identify).toHaveBeenCalledOnce();
  expect(mocks.identify).toHaveBeenCalledWith("returning-account", {
    created_at: returningSession.user.created_at,
  });
  expect(mocks.track).not.toHaveBeenCalled();
  expect(mocks.tagKitEventOnce).toHaveBeenCalledOnce();
  view.unmount();
});
