/**
 * Authenticated fetch wrapper for API calls.
 *
 * - Adds a Supabase session bearer token (when available).
 * - Aborts after `DEFAULT_TIMEOUT_MS` so a stalled API never freezes the UI;
 *   the abort surfaces as a `tc:api-timeout` window event that the global
 *   toast listener can render.
 * - Emits `tc:session-expired` on 401 for the session-toast flow.
 *
 * Callers can opt out of the timeout by passing `options.signal` themselves
 * (their abort wins) or by raising the cap via `options.timeoutMs`.
 */
import { getApiUrl } from "./api-url";
import { getSupabaseBrowserClient } from "./supabase/client";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    ...rest
  } = options;
  const apiUrl = getApiUrl();
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort("apiFetch-timeout"),
    timeoutMs,
  );
  // If the caller passed their own AbortSignal, chain it: aborting either
  // source aborts the inner fetch.
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort(callerSignal.reason);
    else
      callerSignal.addEventListener("abort", () =>
        controller.abort(callerSignal.reason),
      );
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...rest.headers,
      },
    });

    // "Session expired" is only true if a session was attached. Guests get
    // 401s from fire-and-forget calls (attempt recording, GitHub commit) as
    // the NORMAL case; toasting them about a session they never had was the
    // 2026-07-13 audit's accepted-v1 quirk, now fixed.
    if (response.status === 401 && session && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tc:session-expired"));
    }

    return response;
  } catch (err) {
    if (
      err instanceof DOMException &&
      err.name === "AbortError" &&
      controller.signal.reason === "apiFetch-timeout" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent("tc:api-timeout", { detail: { path, timeoutMs } }),
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
