/**
 * Bound a promise's WAIT (not its underlying socket).
 *
 * Extracted from email.ts on 2026-08-23 so the digest and issue senders get
 * the same protection the purchase receipt already had. Every Resend call is
 * a network call with no built-in deadline, and two of them run on paths
 * where hanging is worse than failing: the Stripe webhook (which Stripe will
 * re-deliver) and the digest blast (which holds an admin request open).
 *
 * The wait is what gets bounded, not the request: the caller resumes and
 * decides, while the socket closes on its own.
 */
export function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
