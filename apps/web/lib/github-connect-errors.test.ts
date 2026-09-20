import { describe, expect, it } from "vitest";
import { githubConnectMessage } from "./github-connect-errors";

// The API sends a browser back to /settings?github_error=<code> when the
// GitHub connection fails (2026-09-20). The code set is closed; anything else
// renders nothing rather than echoing the query string.
describe("githubConnectMessage", () => {
  it("explains a cancelled connection in plain words", () => {
    expect(githubConnectMessage("access_denied")).toBe(
      "GitHub connection was cancelled. Connect again when you are ready.",
    );
  });
  it("tells an expired sign-in link to start over", () => {
    expect(githubConnectMessage("state_mismatch")).toMatch(
      /start the connection again/i,
    );
  });
  it.each([
    "exchange_failed",
    "profile_failed",
    "storage_failed",
    "not_configured",
  ])("gives %s a message that asks for a retry", (code) => {
    expect(githubConnectMessage(code)).toMatch(/try again/i);
  });
  it("renders nothing for an unknown or missing code", () => {
    expect(githubConnectMessage("<script>")).toBeNull();
    expect(githubConnectMessage(undefined)).toBeNull();
  });
});
