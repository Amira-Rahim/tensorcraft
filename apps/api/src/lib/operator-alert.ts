import { Resend } from "resend";
import { captureException } from "./error-tracking";
import { logger } from "./logger";
import { withTimeout } from "./with-timeout";

/**
 * Push the handful of events worth waking up for into the operator's inbox.
 *
 * Why this exists: Sentry captures errors at 22 sites across the API and
 * notifies nobody, because alert rules live in a dashboard that has none, and
 * PostHog has no project. Today the operator learns something happened when a
 * user emails support. Email is the one notification channel that is already
 * working, so this uses it.
 *
 * Scope is deliberately narrow. This is NOT a replacement for Sentry alert
 * rules or an uptime monitor, both of which are still worth setting up. It
 * covers the money path and the failure states around it, which is where
 * silence is most expensive: a chargeback nobody sees for a week, a payment
 * that failed after the customer was charged, a refund that did not revoke
 * access.
 *
 * Every call site is a webhook handler, so this must never throw and never
 * block for long. An alert that fails is a missed notification; an alert that
 * throws turns a successful payment into a 500 and a Stripe retry.
 *
 * Unset `OPERATOR_ALERT_EMAIL` falls back to `SUPPORT_EMAIL`. Unset
 * `RESEND_API_KEY` makes the whole thing a logged no-op, matching every other
 * sender in this codebase.
 */

export type AlertSeverity = "info" | "warn" | "critical";

export interface OperatorAlert {
  /** Short machine-ish name: purchase, refund, dispute, payment_failed. */
  event: string;
  severity: AlertSeverity;
  /** One line, readable on a lock screen. */
  summary: string;
  /** Extra context so the mail is actionable without opening a dashboard. */
  detail?: Record<string, string | number | boolean | null | undefined>;
}

let resend: Resend | null = null;
let warnedNoKey = false;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendOperatorAlert(alert: OperatorAlert): Promise<void> {
  const client = getResend();
  if (!client) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      logger.warn(
        { source: "operator-alert" },
        "RESEND_API_KEY unset: operator alerts are disabled",
      );
    }
    return;
  }

  const to =
    process.env.OPERATOR_ALERT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "support@tensorcraft.app";

  // Severity first so a phone notification is triageable without opening it.
  const subject = `[Tensorcraft ${alert.severity}] ${alert.event}: ${alert.summary}`;

  const entries = Object.entries(alert.detail ?? {}).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  const text = [
    alert.summary,
    "",
    ...entries.map(([k, v]) => `${k}: ${String(v)}`),
    "",
    `event: ${alert.event}`,
    `severity: ${alert.severity}`,
    `at: ${new Date().toISOString()}`,
  ].join("\n");

  const rows = entries
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#555;">${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;">
      <p style="font-size:13px;color:#555;margin:0 0 4px;">${escapeHtml(alert.severity)} &middot; ${escapeHtml(alert.event)}</p>
      <h1 style="font-size:17px;margin:0 0 14px;">${escapeHtml(alert.summary)}</h1>
      ${rows ? `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>` : ""}
      <p style="font-size:12px;color:#777;margin-top:16px;">${new Date().toISOString()}</p>
    </div>
  `;

  try {
    const { error } = await withTimeout(
      client.emails.send({
        from: "Tensorcraft <noreply@tensorcraft.app>",
        to,
        subject,
        text,
        html,
      }),
      10_000,
      "operator alert send",
    );
    if (error) {
      // Resend reports failures in the result and never throws (F1, 2026-07-25).
      captureException(new Error(error.message), {
        source: "operator-alert",
        extra: { event: alert.event, severity: alert.severity },
      });
    }
  } catch (err) {
    captureException(err, {
      source: "operator-alert",
      extra: { event: alert.event, severity: alert.severity },
    });
  }
}
