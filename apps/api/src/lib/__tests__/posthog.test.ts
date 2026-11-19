import { describe, it, expect, beforeEach, vi } from "vitest";

const captureMock = vi.fn();
const shutdownMock = vi.fn().mockResolvedValue(undefined);
const onMock = vi.fn();
const warnMock = vi.fn();
const constructMock = vi.fn();
const consentLookupMock = vi.fn();
const consentEqMock = vi.fn();
const consentAbortMock = vi.fn();
const consentFromMock = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      consentFromMock(table);
      return {
        select: () => ({
          eq: (column: string, id: string) => {
            consentEqMock(column, id);
            return {
              abortSignal: (signal: AbortSignal) => {
                consentAbortMock(signal);
                return { maybeSingle: consentLookupMock };
              },
            };
          },
        }),
      };
    },
  }),
}));

vi.mock("../logger", () => ({
  logger: { warn: (...args: unknown[]) => warnMock(...args) },
}));

vi.mock("posthog-node", () => {
  class PostHog {
    constructor(...args: unknown[]) {
      constructMock(...args);
    }
    capture = captureMock;
    shutdown = shutdownMock;
    on = onMock;
  }
  return { PostHog };
});

import {
  __resetForTests,
  captureServer,
  captureServerEvent,
  getPostHog,
  SERVER_EVENTS,
  shutdownPostHog,
} from "../posthog";

describe("api/lib/posthog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    __resetForTests();
    shutdownMock.mockResolvedValue(undefined);
    consentLookupMock.mockReset();
    consentLookupMock.mockResolvedValue({
      data: { granted: true },
      error: null,
    });
  });

  it("returns null when POSTHOG_PROJECT_TOKEN is absent", () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    expect(getPostHog()).toBeNull();
  });

  it("captureServerEvent no-ops without configuration or a database lookup", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    await captureServerEvent("user-1", "payment_completed", { amount: 49 });
    expect(captureMock).not.toHaveBeenCalled();
    expect(consentLookupMock).not.toHaveBeenCalled();
  });

  it("captureServer forwards to PostHog with distinctId after consent", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");

    await captureServer(
      SERVER_EVENTS.PAYMENT_COMPLETED,
      {
        planId: "single",
        worldIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_test_1",
        eventSource: "stripe_webhook",
        analyticsVersion: 2,
        stripeEventId: "evt_1",
        paymentIntentId: "pi_1",
        amountMinor: 4900,
        currency: "usd",
        livemode: false,
        paymentKind: "cash",
      },
      "user-42",
    );

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-42",
      event: "payment_completed",
      properties: {
        planId: "single",
        worldIds: ["deep-orbit"],
        amount: 49,
        sessionId: "cs_test_1",
        eventSource: "stripe_webhook",
        analyticsVersion: 2,
        stripeEventId: "evt_1",
        paymentIntentId: "pi_1",
        amountMinor: 4900,
        currency: "usd",
        livemode: false,
        paymentKind: "cash",
      },
    });
    expect(consentFromMock).toHaveBeenCalledWith("analytics_consents");
    expect(consentEqMock).toHaveBeenCalledWith("user_id", "user-42");
    expect(constructMock).toHaveBeenCalledWith(
      "phc_server",
      expect.objectContaining({ enableExceptionAutocapture: false }),
    );
  });

  it.each([null, { granted: false }, { granted: null }])(
    "skips unknown or declined consent (%j) before creating the SDK",
    async (data) => {
      vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
      vi.stubEnv("POSTHOG_HOST", "https://example.test");
      consentLookupMock.mockResolvedValue({ data, error: null });
      await captureServerEvent("user-1", "payment_completed", {
        analyticsConsent: true,
      });
      expect(captureMock).not.toHaveBeenCalled();
      expect(constructMock).not.toHaveBeenCalled();
    },
  );

  it("checks withdrawal again before a later refund", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    await captureServerEvent("user-1", "payment_completed");
    consentLookupMock.mockResolvedValue({
      data: { granted: false },
      error: null,
    });
    await captureServerEvent("user-1", "payment_refunded");
    expect(consentLookupMock).toHaveBeenCalledTimes(2);
    expect(captureMock).toHaveBeenCalledTimes(1);
    expect(captureMock.mock.calls[0][0].event).toBe("payment_completed");
  });

  it("skips capture on consent lookup failures without exposing their details", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    consentLookupMock.mockResolvedValue({
      data: { granted: true },
      error: { message: "private database details" },
    });
    await expect(
      captureServerEvent("user-1", "payment_completed"),
    ).resolves.toBeUndefined();
    consentLookupMock.mockRejectedValue(new Error("private database details"));
    await expect(
      captureServerEvent("user-1", "payment_completed"),
    ).resolves.toBeUndefined();
    expect(captureMock).not.toHaveBeenCalled();
    expect(constructMock).not.toHaveBeenCalled();
    expect(JSON.stringify(warnMock.mock.calls)).not.toContain(
      "private database details",
    );
  });

  it("bounds a stalled consent lookup without sending or rejecting the caller", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    consentLookupMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          const signal = consentAbortMock.mock.lastCall?.[0] as AbortSignal;
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        }),
    );
    await expect(
      captureServerEvent("user-1", "payment_completed"),
    ).resolves.toBeUndefined();
    expect(consentAbortMock.mock.lastCall?.[0].aborted).toBe(true);
    expect(captureMock).not.toHaveBeenCalled();
    expect(constructMock).not.toHaveBeenCalled();
  });

  it("SERVER_EVENTS names are all snake_case", () => {
    const SNAKE = /^[a-z]+(_[a-z]+)*$/;
    for (const name of Object.values(SERVER_EVENTS)) {
      expect(name, name).toMatch(SNAKE);
    }
  });

  it("logs SDK delivery failures without request details", () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    getPostHog();
    const onError = onMock.mock.calls.find(([name]) => name === "error")?.[1];
    expect(onError).toBeTypeOf("function");
    onError(new Error("secret-token with personal event payload"));
    expect(warnMock).toHaveBeenCalledWith(
      { errorType: "Error" },
      "PostHog server event delivery failed",
    );
    expect(JSON.stringify(warnMock.mock.calls)).not.toContain("secret-token");
  });

  it("keeps capture failures from failing the payment caller", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    captureMock.mockImplementationOnce(() => {
      throw new Error("secret-token with personal event payload");
    });
    await expect(
      captureServerEvent("user-1", "payment_completed"),
    ).resolves.toBeUndefined();
    expect(warnMock).toHaveBeenCalledWith(
      { errorType: "Error" },
      "PostHog server event capture failed",
    );
    expect(JSON.stringify(warnMock.mock.calls)).not.toContain("secret-token");
  });

  it("waits for the SDK shutdown to finish", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");
    getPostHog();
    let complete: (() => void) | undefined;
    shutdownMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    let finished = false;
    const pending = shutdownPostHog().then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    complete?.();
    await pending;
    expect(finished).toBe(true);
  });

  it("captureServer forwards code_pushed with expected shape", async () => {
    vi.stubEnv("POSTHOG_PROJECT_TOKEN", "phc_server");
    vi.stubEnv("POSTHOG_HOST", "https://example.test");

    await captureServer(
      SERVER_EVENTS.CODE_PUSHED,
      {
        worldId: "deep-orbit",
        lessonId: "intro-tensors",
        exerciseSlug: "intro-tensors",
        commitSha: "abc1234",
      },
      "user-77",
    );

    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "user-77",
      event: "code_pushed",
      properties: {
        worldId: "deep-orbit",
        lessonId: "intro-tensors",
        exerciseSlug: "intro-tensors",
        commitSha: "abc1234",
      },
    });
  });
});
