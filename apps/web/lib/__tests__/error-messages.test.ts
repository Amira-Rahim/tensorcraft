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

/**
 * Transient database faults.
 *
 * A Supabase blip reached the lesson boundary carrying a Postgres SQLSTATE
 * that the map did not recognise, so it fell through to `unknown`: "Something
 * went wrong on our end. Try again or contact support." A paying customer
 * reads that as a broken product and emails support about a lesson that was
 * never broken. These are usually over in seconds and the right advice is to
 * retry, not to write in.
 */
describe("transient database faults", () => {
  it("recognises Postgres connection-exception codes (SQLSTATE class 08)", () => {
    for (const code of ["08000", "08003", "08006", "08001", "08004"]) {
      expect(errorMessageForCode(code)).toBe(
        ERROR_MESSAGES.service_unavailable,
      );
    }
  });

  it("recognises overload and shutdown codes", () => {
    expect(errorMessageForCode("53300")).toBe(
      ERROR_MESSAGES.service_unavailable,
    );
    expect(errorMessageForCode("57P01")).toBe(
      ERROR_MESSAGES.service_unavailable,
    );
    expect(errorMessageForCode("57P03")).toBe(
      ERROR_MESSAGES.service_unavailable,
    );
    expect(errorMessageForCode("57014")).toBe(
      ERROR_MESSAGES.service_unavailable,
    );
  });

  it("tells the reader to retry rather than to contact support", () => {
    expect(ERROR_MESSAGES.service_unavailable).toMatch(/try again/i);
    expect(ERROR_MESSAGES.service_unavailable).not.toMatch(/contact support/i);
  });

  /**
   * The class-08 rule is a prefix match, so guard that it cannot swallow an
   * unrelated code that merely starts with those digits.
   */
  it("does not treat an arbitrary 08-prefixed string as a database fault", () => {
    expect(errorMessageForCode("08")).toBe(ERROR_MESSAGES.unknown);
    expect(errorMessageForCode("0800-not-a-sqlstate")).toBe(
      ERROR_MESSAGES.unknown,
    );
  });
});
