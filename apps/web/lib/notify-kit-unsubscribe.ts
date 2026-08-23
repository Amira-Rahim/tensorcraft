/**
 * Tell the API that an address unsubscribed, so it can pass that on to Kit.
 *
 * Why this exists: the email-link unsubscribe handlers live here in
 * `apps/web`, which has no Kit client and no Kit secrets, while the Kit
 * client lives in `apps/api`. Those handlers flip `waitlist.subscribed`
 * themselves, which stops OUR digest, but Kit sends its own sequences off
 * its own subscriber state. Without this relay an unsubscribed address keeps
 * receiving Kit mail the moment the retention automations go live.
 *
 * The signed-in Settings toggle does NOT need this: it already reconciles
 * Kit tags through the API (`routes/preferences.ts`).
 *
 * Strictly best effort, and that is the whole design. It runs AFTER the
 * database flip, on an RFC 8058 one-click path where mail providers retry on
 * any non-2xx. It must never throw, never block for long, and never turn a
 * successful unsubscribe into a failed one. Kit lagging behind is a much
 * smaller problem than Gmail deciding our unsubscribe endpoint is broken.
 *
 * Needs `API_URL` and `ADMIN_API_KEY` in the web server environment. Both
 * absent is the current state, and the correct behaviour then is to do
 * nothing quietly: the local opt-out has already happened.
 */
export async function notifyKitUnsubscribe(email: string): Promise<void> {
  const apiUrl = process.env.API_URL?.trim();
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!apiUrl || !adminKey || !email) return;

  try {
    await fetch(`${apiUrl}/api/email/unsubscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": adminKey,
      },
      body: JSON.stringify({ email }),
      // Bounds the wait, not the socket, which is enough: the caller returns
      // as soon as this settles either way.
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Network failure, timeout, or a non-2xx that fetch surfaced. The local
    // opt-out stands regardless; only the Kit side lags.
  }
}
