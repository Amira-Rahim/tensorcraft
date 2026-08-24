import * as Sentry from "@sentry/nextjs";

/**
 * Report a failed browser-side database operation.
 *
 * Why this exists: this app performs 35 PostgREST operations directly from the
 * browser, bypassing the API. Several are writes that matter, including three
 * progress upserts, every waitlist capture surface, onboarding completion and
 * settings. All of them swallowed their errors.
 *
 * Swallowing is right for the UI, since a form stuck on "submitting" forever is
 * worse than one that fails cleanly. It was catastrophic for observability:
 * server-side Sentry, uptime monitors, synthetic checks and the Stripe
 * dashboard all sit on the server or outside the app, so a browser write that
 * fails reached none of them.
 *
 * Not hypothetical. The waitlist CHECK-constraint bug broke every capture
 * surface on the site for months and nothing noticed, because the failure
 * happened here. One `23514` in Sentry would have ended it on day one.
 *
 * Safe to call unconditionally, including on success: a null error is a no-op.
 */

export interface PostgrestLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

type Context = Record<string, string | number | boolean | null | undefined>;

const EMAIL = /[^\s@,()]+@[^\s@,()]+\.[^\s@,()]+/g;

/**
 * `beforeSend` in instrumentation-client.ts scrubs `event.user` and headers, but
 * NOT `extra`. So anything placed there leaves the browser exactly as written.
 *
 * This matters more than it looks: PostgREST returns the offending row in
 * `details` on a constraint violation, and for the waitlist table that row
 * contains the subscriber's email address. Scrubbing every string we forward,
 * not just the caller-supplied context, is the difference between a useful
 * error and a privacy incident.
 */
function scrub(value: string): string {
  return value.replace(EMAIL, "[email redacted]");
}

function scrubContext(context: Context | undefined): Context {
  if (!context) return {};
  const out: Context = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = typeof v === "string" ? scrub(v) : v;
  }
  return out;
}

export function reportDataError(
  /** Dot-separated, matching the API's convention: `waitlist.insert`. */
  source: string,
  error: PostgrestLikeError | null | undefined,
  context?: Context,
): void {
  if (!error) return;

  try {
    const message = scrub(error.message ?? "Unknown database error");

    Sentry.captureException(new Error(`[${source}] ${message}`), {
      // `source` uses the same tag name the API sets, so a single Sentry
      // alert rule covers both sides of the app.
      tags: { source, ...(error.code ? { pgCode: error.code } : {}) },
      // Group by what broke, not by the message. Without this a single broken
      // constraint opens a new issue per occurrence and buries itself.
      fingerprint: [source, error.code ?? "unknown"],
      extra: {
        message,
        details: error.details ? scrub(error.details) : null,
        hint: error.hint ? scrub(error.hint) : null,
        ...scrubContext(context),
      },
    });
  } catch {
    // Reporting sits inside UI code paths. A misconfigured or throwing Sentry
    // must never take the form, or the lesson, down with it.
  }
}
