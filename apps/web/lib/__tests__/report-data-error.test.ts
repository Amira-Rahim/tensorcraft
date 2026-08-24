import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Browser-side data errors.
 *
 * This app performs 35 PostgREST operations directly from the browser,
 * bypassing the API entirely. Several are writes that matter: three progress
 * upserts, every waitlist capture surface, onboarding completion, settings.
 *
 * None of them reported anywhere. They swallow errors by design, which is
 * correct for the UI (a dead form is worse than a failed one) and catastrophic
 * for observability: server Sentry, uptime monitors, synthetic checks and the
 * Stripe dashboard all sit on the server or outside the app, so a failed
 * browser write reaches none of them.
 *
 * That is not hypothetical. The waitlist CHECK-constraint bug broke every
 * capture surface on the site for months, and nothing noticed, because the
 * failure happened here.
 */

const captureException = vi.hoisted(() => vi.fn());
vi.mock("@sentry/nextjs", () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

import { reportDataError } from "../report-data-error";

beforeEach(() => {
  captureException.mockClear();
});

describe("reportDataError", () => {
  /**
   * Call sites pass the error straight through, including on success, so the
   * happy path must cost nothing and report nothing.
   */
  it("does nothing when there is no error", () => {
    reportDataError("waitlist.insert", null);
    reportDataError("waitlist.insert", undefined);

    expect(captureException).not.toHaveBeenCalled();
  });

  it("reports a failed write with its source as a tag", () => {
    reportDataError("progress.upsert", { message: "permission denied" });

    expect(captureException).toHaveBeenCalledTimes(1);
    const scope = captureException.mock.calls[0][1] as {
      tags?: Record<string, string>;
    };
    // Same tag name the API uses, so one Sentry alert rule covers both sides.
    expect(scope.tags?.source).toBe("progress.upsert");
  });

  /**
   * The Postgres error code is the single most diagnostic field. The waitlist
   * bug was 23514, a CHECK violation, and seeing that code once would have
   * ended a months-long mystery immediately.
   */
  it("tags the Postgres error code", () => {
    reportDataError("waitlist.insert", {
      code: "23514",
      message: 'new row violates check constraint "chk_waitlist_source"',
    });

    const scope = captureException.mock.calls[0][1] as {
      tags?: Record<string, string>;
    };
    expect(scope.tags?.pgCode).toBe("23514");
  });

  it("keeps the database message, details and hint", () => {
    reportDataError("waitlist.insert", {
      code: "23514",
      message: "violates check constraint",
      details: "Failing row contains (world-selection)",
      hint: "check the source value",
    });

    const scope = captureException.mock.calls[0][1] as {
      extra?: Record<string, unknown>;
    };
    expect(scope.extra?.details).toContain("world-selection");
    expect(scope.extra?.hint).toBe("check the source value");
  });

  /**
   * Groups by source and code rather than by message. Without this, one broken
   * constraint produces a new Sentry issue per occurrence and buries the
   * signal it was meant to raise.
   */
  it("groups by source and code so one broken write is one issue", () => {
    reportDataError("waitlist.insert", { code: "23514", message: "x" });

    const scope = captureException.mock.calls[0][1] as {
      fingerprint?: string[];
    };
    expect(scope.fingerprint).toEqual(["waitlist.insert", "23514"]);
  });

  /**
   * `beforeSend` in sentry.client.config.ts scrubs `event.user` and headers,
   * but NOT `extra`. Anything put there leaves the browser as written, and
   * these call sites sit next to email addresses.
   */
  it("scrubs anything email-shaped from the context", () => {
    reportDataError(
      "waitlist.insert",
      { code: "23514", message: "x" },
      { email: "learner@example.com", source: "coming-soon-hero" },
    );

    const payload = JSON.stringify(captureException.mock.calls[0][1]);
    expect(payload).not.toContain("learner@example.com");
    expect(payload).toContain("coming-soon-hero");
  });

  it("carries non-PII context through", () => {
    reportDataError(
      "progress.upsert",
      { message: "boom" },
      { worldId: "deep-orbit", lessonId: "threshold-tuning" },
    );

    const scope = captureException.mock.calls[0][1] as {
      extra?: Record<string, unknown>;
    };
    expect(scope.extra?.worldId).toBe("deep-orbit");
  });

  /**
   * Reporting sits inside UI code paths. If Sentry is misconfigured or throws,
   * that must not take the form or the lesson down with it.
   */
  it("never throws, whatever Sentry does", () => {
    captureException.mockImplementation(() => {
      throw new Error("sentry exploded");
    });

    expect(() =>
      reportDataError("progress.upsert", { message: "boom" }),
    ).not.toThrow();
  });
});
