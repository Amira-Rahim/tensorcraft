import { describe, it, expect } from "vitest";
import { ERROR_MESSAGES, errorMessageForCode } from "../error-messages";

describe("ERROR_MESSAGES", () => {
  it("exposes the full palette of known codes", () => {
    expect(Object.keys(ERROR_MESSAGES)).toEqual(
      expect.arrayContaining([
        "network",
        "stripe_declined",
        "session_expired",
        "content_not_found",
        "forbidden",
        "validation",
        "rate_limited",
        "unknown",
      ]),
    );
  });

  it("every message is a non-empty human-readable string", () => {
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      expect(value, `${key} should be a non-empty string`).toMatch(/\w/);
      expect(value.length).toBeGreaterThan(10);
    }
  });
});

describe("errorMessageForCode", () => {
  it("returns the known message for a direct key", () => {
    expect(errorMessageForCode("network")).toBe(ERROR_MESSAGES.network);
    expect(errorMessageForCode("stripe_declined")).toBe(
      ERROR_MESSAGES.stripe_declined,
    );
    expect(errorMessageForCode("session_expired")).toBe(
      ERROR_MESSAGES.session_expired,
    );
  });

  it("maps common aliases to canonical messages", () => {
    expect(errorMessageForCode("card_declined")).toBe(
      ERROR_MESSAGES.stripe_declined,
    );
    expect(errorMessageForCode("payment_failed")).toBe(
      ERROR_MESSAGES.stripe_declined,
    );
    expect(errorMessageForCode("unauthorized")).toBe(
      ERROR_MESSAGES.session_expired,
    );
    expect(errorMessageForCode("not_found")).toBe(
      ERROR_MESSAGES.content_not_found,
    );
    expect(errorMessageForCode("access_denied")).toBe(ERROR_MESSAGES.forbidden);
    expect(errorMessageForCode("fetch_failed")).toBe(ERROR_MESSAGES.network);
    expect(errorMessageForCode("too_many_requests")).toBe(
      ERROR_MESSAGES.rate_limited,
    );
  });

  it("falls back to unknown for undefined or unrecognized codes", () => {
    expect(errorMessageForCode(undefined)).toBe(ERROR_MESSAGES.unknown);
    expect(errorMessageForCode("")).toBe(ERROR_MESSAGES.unknown);
    expect(errorMessageForCode("definitely_not_a_code")).toBe(
      ERROR_MESSAGES.unknown,
    );
  });
});
