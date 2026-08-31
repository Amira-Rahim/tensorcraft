// apps/api/src/lib/email.ts
import { Resend } from "resend";
import { captureException } from "./error-tracking";
import { worldDisplayName } from "./world-name";
import { logger } from "./logger";
import { withTimeout } from "./with-timeout";

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

  const appUrl = process.env.APP_URL || "https://tensorcraft.app";
  const support = process.env.SUPPORT_EMAIL || "support@tensorcraft.app";
  const names = params.worldIds.map(worldDisplayName).join(", ");
  const amount = `$${params.amount.toFixed(2)}`;
  const date = params.purchasedAt.toISOString().slice(0, 10);

  const subject = "Your Tensorcraft receipt";
  const text = [
    "Thanks for your purchase.",
    "",
    `What you bought: ${names}`,
    `Amount: ${amount}`,
    `Date: ${date}`,
    `Order reference: ${params.sessionId}`,
    "",
    `Start here: ${appUrl}/dashboard`,
    "",
    `Need a refund or have a question? Write to ${support}.`,
    "Refunds are available for 5 days.",
  ].join("\n");

  // Server-derived values, but they still land in HTML, so escape them.
  const eNames = escapeHtml(names);
  const eSession = escapeHtml(params.sessionId);
  const eSupport = escapeHtml(support);
  const html = `
    <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; color: #1a1a1a; background: #ffffff; padding: 24px; max-width: 560px;">
      <h1 style="font-size: 18px; margin: 0 0 16px;">Thanks for your purchase.</h1>
      <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
        <tr><td style="padding: 6px 12px 6px 0; color: #555;">What you bought</td><td>${eNames}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #555;">Amount</td><td>${amount}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #555;">Date</td><td>${date}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #555;">Order reference</td><td>${eSession}</td></tr>
      </table>
      <p style="margin: 20px 0;">
        <a href="${appUrl}/dashboard" style="background: #1a1a1a; color: #ffffff; padding: 10px 16px; text-decoration: none; display: inline-block;">Start here</a>
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
      <p style="font-size: 13px; color: #555; margin: 0;">
        Need a refund or have a question? Write to
        <a href="mailto:${eSupport}" style="color: #1a1a1a;">${eSupport}</a>.
        Refunds are available for 5 days.
      </p>
    </div>
  `;

  try {
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
