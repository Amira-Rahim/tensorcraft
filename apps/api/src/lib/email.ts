// apps/api/src/lib/email.ts
import { Resend } from "resend";
import { captureException } from "./error-tracking";
import { logger } from "./logger";
import { withTimeout } from "./with-timeout";
import { renderPurchaseReceipt } from "./purchase-receipt-template";

let resend: Resend | null = null;

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

// Escaping neutralizes markup injection but not scheme abuse: a reporter
// can submit pageUrl "javascript:alert(1)" and escapeHtml passes it through
// untouched. Only http(s) URLs earn an <a> in the support email.
function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

interface IssueEmailParams {
  id: string;
  category: string;
  severity: string;
  description: string;
  email: string;
  pageUrl: string;
  screenshotUrl?: string | null;
}

export async function sendIssueNotification(
  params: IssueEmailParams,
): Promise<void> {
  const client = getResend();
  const to = process.env.SUPPORT_EMAIL || "support@tensorcraft.app";
  if (!client) {
    logger.warn(
      { source: "email.sendIssueNotification", issueId: params.id },
      "Resend not configured, skipping issue notification email",
    );
    return;
  }

  // Reporter-controlled fields go into an HTML email read by support:
  // escape them so a crafted description/pageUrl cannot inject markup
  // into the support inbox (2026-07-13 P4 email audit). screenshotUrl is
  // server-built but embeds the reporter's filename extension in the
  // storage key, so it gets the same treatment.
  const { id } = params;
  const screenshotUrl = params.screenshotUrl
    ? escapeHtml(params.screenshotUrl)
    : params.screenshotUrl;
  const category = escapeHtml(params.category);
  const severity = escapeHtml(params.severity);
  const description = escapeHtml(params.description);
  const email = escapeHtml(params.email);
  const pageUrl = escapeHtml(params.pageUrl);

  const subject = `[${severity.toUpperCase()}] ${category.replace(/_/g, " ")} - Issue #${id.slice(0, 8)}`;

  const text = [
    `Category: ${category.replace(/_/g, " ")}`,
    `Severity: ${severity}`,
    `Reporter: ${email}`,
    `Page: ${pageUrl}`,
    screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
    "",
    "Description:",
    description,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: monospace; background: #080B16; color: #FFFFFF; padding: 24px;">
      <h2 style="color: #00D4FF; margin: 0 0 16px;">Issue Report</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Category</td><td>${category.replace(/_/g, " ")}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Severity</td><td>${severity}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Reporter</td><td>${email}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Page</td><td>${isHttpUrl(params.pageUrl) ? `<a href="${pageUrl}" style="color: #00D4FF;">${pageUrl}</a>` : pageUrl}</td></tr>
        ${screenshotUrl ? `<tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Screenshot</td><td><a href="${screenshotUrl}" style="color: #00D4FF;">View</a></td></tr>` : ""}
      </table>
      <hr style="border: 1px solid rgba(255,255,255,0.06); margin: 16px 0;" />
      <p style="white-space: pre-wrap;">${description}</p>
    </div>
  `;

  try {
    // Resend's SDK reports failures in the result, it does not throw -
    // ignoring `error` silently lost support notifications (gap sweep F1
    // class, 2026-07-25). The catch only covers unexpected throws.
    const { error: sendError } = await withTimeout(
      client.emails.send({
        from: "Tensorcraft <noreply@tensorcraft.app>",
        to,
        subject,
        text,
        html,
      }),
      10_000,
      "issue notification send",
    );
    if (sendError) {
      captureException(new Error(sendError.message), {
        source: "issues.email",
        extra: { issueId: params.id, name: sendError.name },
      });
    }
  } catch (err) {
    captureException(err, { source: "issues.email" });
  }
}

interface PurchaseReceiptParams {
  email: string;
  worldIds: string[];
  /** Dollars, not cents. */
  amount: number;
  /** Stripe Checkout Session id, so support can find the payment. */
  sessionId: string;
  purchasedAt: Date;
  timeoutMs?: number;
}

/**
 * Send the buyer a purchase receipt.
 *
 * Why this exists on Resend rather than Kit: the only purchase-time email
 * action was a Kit tag, and Kit's stored credentials 401, so buyers have been
 * receiving nothing at all after paying. A receipt is a legal expectation and
 * a leading cause of chargebacks, so it must not depend on an integration
 * that is currently dark. Resend is already wired and sending (digest, issue
 * notifications).
 *
 * Never throws: it runs inside the Stripe webhook, where an exception would
 * turn a successful payment into a 500 and a re-delivery.
 *
 * No postal address in the footer: CAN-SPAM's physical-address requirement
 * applies to commercial messages, and a receipt is transactional. The digest
 * is the one that needs the address (Tier 1-LEGAL).
 */
export async function sendPurchaseReceipt(
  params: PurchaseReceiptParams,
): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn(
      { source: "email.sendPurchaseReceipt", sessionId: params.sessionId },
      "Resend not configured, skipping purchase receipt",
    );
    return;
  }

  try {
    const { subject, text, html } = renderPurchaseReceipt(params, {
      appUrl: process.env.APP_URL || "https://tensorcraft.app",
      supportEmail: process.env.SUPPORT_EMAIL || "support@tensorcraft.app",
    });
    // Resend reports failures in the result and does not throw (F1, 2026-07-25).
    const { error: sendError } = await withTimeout(
      client.emails.send({
        from: "Tensorcraft <noreply@tensorcraft.app>",
        to: params.email,
        subject,
        text,
        html,
      }),
      params.timeoutMs ?? 5000,
      "purchase receipt send",
    );
    if (sendError) {
      captureException(new Error(sendError.message), {
        source: "payments.receipt",
        extra: { sessionId: params.sessionId, name: sendError.name },
      });
    }
  } catch (err) {
    captureException(err, {
      source: "payments.receipt",
      extra: { sessionId: params.sessionId },
    });
  }
}
