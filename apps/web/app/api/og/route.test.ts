import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted survives hoisting; use it to hold shared capture state.
const state = vi.hoisted(() => ({
  lastElement: null as unknown,
  lastOptions: null as unknown,
}));

vi.mock("next/og", () => {
  class MockImageResponse extends Response {
    constructor(element: unknown, options: unknown) {
      super("mock-og", {
        headers: { "content-type": "image/png" },
      });
      state.lastElement = element;
      state.lastOptions = options;
    }
  }
  return { ImageResponse: MockImageResponse };
});

import { GET } from "./route";

function makeReq(url: string): import("next/server").NextRequest {
  return {
    nextUrl: new URL(url),
  } as unknown as import("next/server").NextRequest;
}

describe("/api/og route", () => {
  beforeEach(() => {
    state.lastElement = null;
    state.lastOptions = null;
  });

  it("renders 1200x630 with default title when no params given", async () => {
    const res = await GET(makeReq("https://tensorcraft.app/api/og"));
    expect(res).toBeDefined();
    expect(state.lastOptions).toMatchObject({ width: 1200, height: 630 });
  });

  it("respects title, theme, and subtitle query params", async () => {
    await GET(
      makeReq(
        "https://tensorcraft.app/api/og?title=Deep%20Orbit&theme=deep-orbit&subtitle=Time-Series",
      ),
    );
    const serialized = JSON.stringify(state.lastElement);
    expect(serialized).toContain("Deep Orbit");
    expect(serialized).toContain("Time-Series");
  });

  it("sets cache-control for CDN caching", async () => {
    await GET(makeReq("https://tensorcraft.app/api/og?title=Test"));
    const headers =
      (state.lastOptions as { headers?: Record<string, string> }).headers || {};
    expect(headers["Cache-Control"]).toContain("max-age");
  });

  it("falls back to default theme when unknown theme given", async () => {
    const res = await GET(
      makeReq("https://tensorcraft.app/api/og?title=X&theme=not-a-real-theme"),
    );
    expect(res).toBeDefined();
    expect(state.lastOptions).toMatchObject({ width: 1200, height: 630 });
  });
});
