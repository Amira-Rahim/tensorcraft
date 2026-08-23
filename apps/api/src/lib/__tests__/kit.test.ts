import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { unsubscribeFromAll, getSubscriber } from "../kit";

/**
 * Kit client timeouts.
 *
 * Every Kit call funnels through one `kitFetch` wrapper, and until
 * 2026-08-23 none of them carried a signal. That is latent rather than
 * harmless: `payments.ts` awaits two Kit calls INSIDE the Stripe webhook
 * handler, so a hung Kit connection holds the handler past Stripe's timeout
 * and forces a re-delivery.
 *
 * It has not bitten yet only because the stored credentials 401 immediately.
 * The moment those are repaired these become real network calls, which is
 * why the bound goes in first.
 */
describe("kitFetch timeout", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("KIT_API_SECRET", "secret");
    vi.stubEnv("KIT_API_KEY", "key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("gives every Kit request an abort signal", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ subscriber: { id: 1 } }),
    });

    await unsubscribeFromAll("someone@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, { signal?: unknown }];
    expect(init.signal).toBeDefined();
  });

  /**
   * The callers that matter already swallow failures: `unsubscribeFromAll`
   * returns null rather than throwing, precisely so a Kit outage cannot break
   * the flow it sits inside. A timeout must land in that same path, not
   * escape as an unhandled rejection.
   */
  it("surfaces an aborted request as a normal failure, not a crash", async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error("The operation was aborted"), {
        name: "TimeoutError",
      }),
    );

    await expect(unsubscribeFromAll("someone@example.com")).resolves.toBeNull();
  });

  it("still reports a Kit API error on a non-2xx", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "The API key is invalid",
    });

    // getSubscriber swallows too, but the request must have been attempted.
    await expect(getSubscriber("someone@example.com")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still returns parsed data on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ subscriber: { id: 42 } }),
    });

    await expect(unsubscribeFromAll("someone@example.com")).resolves.toEqual({
      id: 42,
    });
  });
});
