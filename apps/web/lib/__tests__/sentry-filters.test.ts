import { describe, it, expect } from "vitest";

/**
 * Server Action probe noise.
 *
 * Next.js raises E787, "Failed to find Server Action", for ANY multipart POST
 * that arrives without a `Next-Action` header. Vulnerability scanners post
 * multipart bodies at `/` constantly, so every one of them becomes a Sentry
 * issue.
 *
 * Diagnosed 2026-09-13: this is scanner traffic, NOT deployment skew. Skew
 * protection is on, and the same probes arrive against builds that are
 * current. Filtering it is therefore safe: we are dropping requests that were
 * never from our own client.
 *
 * The filter has to be narrow. A real skew failure produces the same message,
 * so the cost of matching too broadly is losing the signal that a deploy
 * broke in-flight Server Actions for real users.
 */

import { isServerActionProbe } from "../sentry-filters";

type Ev = Parameters<typeof isServerActionProbe>[0];

function eventWith(value: string, type = "Error"): Ev {
  return { exception: { values: [{ type, value }] } } as Ev;
}

describe("isServerActionProbe", () => {
  it("matches the Next.js E787 message", () => {
    expect(
      isServerActionProbe(
        eventWith(
          'Failed to find Server Action "abc123". This request might be from an older or newer deployment.',
        ),
      ),
    ).toBe(true);
  });

  it("matches even when the action id and tail differ", () => {
    expect(
      isServerActionProbe(
        eventWith("Failed to find Server Action &quot;x&quot;."),
      ),
    ).toBe(true);
  });

  /**
   * Everything below must survive. These are the errors the filter exists to
   * NOT swallow, and a regression here is silent: we would simply stop being
   * told about real failures.
   */
  it("does not match unrelated errors", () => {
    expect(
      isServerActionProbe(eventWith("TypeError: x is not a function")),
    ).toBe(false);
    expect(isServerActionProbe(eventWith("Failed to fetch"))).toBe(false);
  });

  it("does not match a merely similar message", () => {
    expect(
      isServerActionProbe(eventWith("Failed to find Server Component")),
    ).toBe(false);
  });

  it("handles events with no exception payload", () => {
    expect(isServerActionProbe({} as Ev)).toBe(false);
    expect(isServerActionProbe({ exception: { values: [] } } as Ev)).toBe(
      false,
    );
  });

  /**
   * Sentry sometimes reports the message on the event rather than inside
   * `exception`, for example when the SDK captures a string.
   */
  it("also matches a top-level message", () => {
    expect(
      isServerActionProbe({
        message: 'Failed to find Server Action "z".',
      } as Ev),
    ).toBe(true);
  });
});
