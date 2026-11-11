import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function visit(hostname: string, search = "") {
  vi.stubGlobal("location", { hostname, search });
}

describe("analytics traffic classification", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    visit("tensorcraft.app");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(["tensorcraft.app", "www.tensorcraft.app"])(
    "keeps unmarked visitors on %s public",
    async (hostname) => {
      visit(hostname);
      const { isInternalTraffic } = await import("../analytics-traffic");
      expect(isInternalTraffic()).toBe(false);
    },
  );

  it.each([
    "localhost",
    "127.0.0.1",
    "[::1]",
    "preview.vercel.app",
    "staging.tensorcraft.app",
    "tensorcraft.app.example.com",
  ])("marks %s internal even with an explicit clear flag", async (hostname) => {
    visit(hostname, "?tc_internal=0");
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(true);
  });

  it("persists the explicit marker across navigation and a module reload", async () => {
    visit("tensorcraft.app", "?tc_internal=1");
    const { isInternalTraffic, INTERNAL_TRAFFIC_KEY } =
      await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(true);
    expect(localStorage.getItem(INTERNAL_TRAFFIC_KEY)).toBe("1");

    visit("tensorcraft.app", "");
    expect(isInternalTraffic()).toBe(true);
    vi.resetModules();
    expect((await import("../analytics-traffic")).isInternalTraffic()).toBe(
      true,
    );
  });

  it("clears a persisted marker explicitly", async () => {
    localStorage.setItem("tc-internal-traffic", "1");
    visit("tensorcraft.app", "?tc_internal=0");
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(false);
    expect(localStorage.getItem("tc-internal-traffic")).toBeNull();
  });

  it("honors another tab's changes without reapplying a consumed URL flag", async () => {
    visit("tensorcraft.app", "?tc_internal=1");
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(true);
    localStorage.removeItem("tc-internal-traffic");
    expect(isInternalTraffic()).toBe(false);
    localStorage.setItem("tc-internal-traffic", "1");
    expect(isInternalTraffic()).toBe(true);
  });

  it("ignores unrecognized directive values", async () => {
    visit("tensorcraft.app", "?tc_internal=true");
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(false);
    expect(localStorage.getItem("tc-internal-traffic")).toBeNull();
  });

  it("keeps the explicit choice in memory if storage cannot persist it", async () => {
    visit("tensorcraft.app", "?tc_internal=1");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(true);
    visit("tensorcraft.app");
    expect(isInternalTraffic()).toBe(true);
  });

  it("retains host classification when reading storage is blocked", async () => {
    visit("localhost");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const { isInternalTraffic } = await import("../analytics-traffic");
    expect(isInternalTraffic()).toBe(true);
  });
});
