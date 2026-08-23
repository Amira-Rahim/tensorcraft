import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { notifyKitUnsubscribe } from "../notify-kit-unsubscribe";

/**
 * Best-effort relay from the email-link unsubscribe handlers to the API,
 * which owns the Kit client and its secrets.
 *
 * The contract that matters: this runs AFTER `waitlist.subscribed` has
 * already been flipped, on an RFC 8058 compliance path where mail providers
 * retry on any non-2xx. So it must never throw, never block for long, and
 * never turn a successful unsubscribe into a failed one. Kit lagging is a
 * far smaller problem than a provider deciding our one-click endpoint is
 * broken.
 */
describe("notifyKitUnsubscribe", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_URL", "https://api.tensorcraft.app");
    vi.stubEnv("ADMIN_API_KEY", "secret-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts the address to the API with the internal key", async () => {
    await notifyKitUnsubscribe("gone@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string>; body: string },
    ];
    expect(url).toBe("https://api.tensorcraft.app/api/email/unsubscribe");
    expect(init.method).toBe("POST");
    expect(init.headers["x-admin-api-key"]).toBe("secret-key");
    expect(JSON.parse(init.body)).toEqual({ email: "gone@example.com" });
  });

  it("bounds the wait so a hung API cannot stall the unsubscribe", async () => {
    await notifyKitUnsubscribe("gone@example.com");

    const [, init] = fetchMock.mock.calls[0] as [string, { signal?: unknown }];
    expect(init.signal).toBeDefined();
  });

  it("does nothing when the API URL is not configured", async () => {
    vi.stubEnv("API_URL", "");

    await expect(
      notifyKitUnsubscribe("gone@example.com"),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when the internal key is not configured", async () => {
    vi.stubEnv("ADMIN_API_KEY", "");

    await notifyKitUnsubscribe("gone@example.com");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      notifyKitUnsubscribe("gone@example.com"),
    ).resolves.toBeUndefined();
  });

  it("swallows a non-2xx answer", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    await expect(
      notifyKitUnsubscribe("gone@example.com"),
    ).resolves.toBeUndefined();
  });
});
