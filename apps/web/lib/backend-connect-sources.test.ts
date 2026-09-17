import { describe, expect, it } from "vitest";
import { backendConnectSources } from "./backend-connect-sources";

describe("configured backend CSP sources", () => {
  it("allows only the configured local backend ports and realtime origin", () => {
    expect(
      backendConnectSources("http://localhost:3101", "http://127.0.0.1:54321"),
    ).toEqual([
      "http://localhost:3101",
      "http://127.0.0.1:54321",
      "ws://127.0.0.1:54321",
    ]);
  });

  it("supports HTTPS staging backends and excludes paths from CSP", () => {
    expect(
      backendConnectSources(
        "https://staging.tensorcraft.app/api?ignored=true",
        "https://auth.tensorcraft.app",
      ),
    ).toEqual([
      "https://staging.tensorcraft.app",
      "https://auth.tensorcraft.app",
      "wss://auth.tensorcraft.app",
    ]);
    expect(backendConnectSources()).toEqual([]);
  });

  it.each([
    "http://staging.example.com",
    "https://user:password@example.com",
    "data:text/plain,test",
    "https://example.com; connect-src *",
  ])("rejects unsafe backend configuration: %s", (url) => {
    expect(() => backendConnectSources(url)).toThrow();
  });
});
