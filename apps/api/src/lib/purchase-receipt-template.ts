import { isLaunched } from "@tensorcraft/shared";
import { worldDisplayName } from "./world-name";

export interface PurchaseReceiptContent {
  worldIds: string[];
  /** Dollars, not cents. */
  amount: number;
  sessionId: string;
  purchasedAt: Date;
}

interface ReceiptPresentation {
  appUrl?: string;
  supportEmail?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applicationUrl(raw: string): string {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return "https://tensorcraft.app";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "https://tensorcraft.app";
  }
}

/** Pure HTML/text rendering, shared by the mail sender and design preview. */
export function renderPurchaseReceipt(
  params: PurchaseReceiptContent,
  presentation: ReceiptPresentation = {},
): { subject: string; text: string; html: string } {
  const appUrl = applicationUrl(
    presentation.appUrl ?? "https://tensorcraft.app",
  );
  const support = presentation.supportEmail ?? "support@tensorcraft.app";
  const names = params.worldIds.map(worldDisplayName).join(", ");
  const availableWorlds = params.worldIds.filter(isLaunched);
  const availableNames = availableWorlds.map(worldDisplayName).join(", ");
  const headline =
    availableWorlds.length === 1
      ? `${availableNames} is yours.`
      : "Your purchase is confirmed.";
  const description =
    availableWorlds.length === 1
      ? `All lessons and exercises in ${availableNames} are now open.`
      : availableWorlds.length > 1
        ? "All lessons and exercises in your purchased worlds are now open."
        : "Your receipt is below. Your dashboard shows the courses available to you.";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amount);
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(params.purchasedAt);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(params.purchasedAt);
  const purchasedAt = `${date} at ${time} UTC`;
  const reference = `TC-${params.sessionId.slice(-8)}`;
  const firstWorld = availableWorlds[0];
  const destination = firstWorld
    ? `${appUrl}/worlds/${firstWorld}`
    : `${appUrl}/dashboard`;
  const action = firstWorld ? "Open mission map" : "Open dashboard";
  const subject =
    availableWorlds.length === 1
      ? `${availableNames} purchase confirmed | Tensorcraft`
      : "Tensorcraft purchase confirmed";
  const text = [
    "Tensorcraft",
    "Purchase confirmed",
    "",
    headline,
    description,
    "",
    `${action}: ${destination}`,
    "",
    "Your receipt",
    `What you bought: ${names || "Tensorcraft access"}`,
    `Amount paid: ${amount} USD`,
    `Date: ${purchasedAt}`,
    `Order reference: ${reference}`,
    "",
    "Lifetime access. No subscription.",
    "",
    `Need a refund or have a question? Write to ${support}.`,
    "Refunds are available for 5 days.",
  ].join("\n");

  const eHeadline = escapeHtml(headline);
  const eDescription = escapeHtml(description);
  const eNames = escapeHtml(names || "Tensorcraft access");
  const eAmount = escapeHtml(amount);
  const eDate = escapeHtml(purchasedAt);
  const eReference = escapeHtml(reference);
  const eDestination = escapeHtml(destination);
  const eSupport = escapeHtml(support);
  const preheader = escapeHtml(
    `Purchase confirmed: ${names || "Tensorcraft access"}. ${amount} USD paid.`,
  );
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(subject)}</title>
  <style>
    a:focus-visible { outline: 3px solid #b5d5c5; outline-offset: 4px; }
    @media only screen and (max-width: 480px) {
      .receipt-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .receipt-title { font-size: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #181818; color: #e9e9e9; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #181818;">
    <tr>
      <td align="center" style="padding: 16px 0;">
        <!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 640px; background-color: #222222;">
          <tr>
            <td class="receipt-padding" style="padding: 32px 40px; border-bottom: 1px solid #424242; font-size: 20px; line-height: 28px; font-weight: 700; color: #e9e9e9;">Tensorcraft</td>
          </tr>
          <tr>
            <td class="receipt-padding" style="padding: 40px 40px 32px;">
              <p style="margin: 0 0 18px; font-size: 17px; line-height: 26px; font-weight: 600; color: #b5d5c5;">&#10003; Purchase confirmed</p>
              <h1 class="receipt-title" style="margin: 0 0 18px; font-size: 38px; line-height: 1.14; letter-spacing: -1px; font-weight: 700; color: #e9e9e9;">${eHeadline}</h1>
              <p style="margin: 0 0 28px; font-size: 18px; line-height: 29px; color: #bcbcbc;">${eDescription}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#9ac8b0" style="background-color: #9ac8b0; text-align: center; mso-padding-alt: 15px 24px;">
                    <a href="${eDestination}" style="display: inline-block; padding: 15px 24px; border: 1px solid #9ac8b0; font-size: 17px; line-height: 24px; font-weight: 600; color: #181818; text-decoration: none; mso-padding-alt: 0;">${action}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="receipt-padding" style="padding: 0 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-top: 1px solid #424242;">
                <tr>
                  <td style="padding: 28px 0 20px;">
                    <h2 style="margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; color: #e9e9e9;">Your receipt</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 0 18px; border-bottom: 1px solid #424242;">
                    <p style="margin: 0 0 4px; font-size: 15px; line-height: 24px; color: #bcbcbc;">What you bought</p>
                    <p style="margin: 0; font-size: 19px; line-height: 29px; font-weight: 600; color: #e9e9e9; overflow-wrap: anywhere;">${eNames}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 0; border-bottom: 1px solid #424242;">
                    <p style="margin: 0 0 4px; font-size: 15px; line-height: 24px; color: #bcbcbc;">Amount paid</p>
                    <p style="margin: 0; font-size: 26px; line-height: 34px; font-weight: 600; color: #e9e9e9;">${eAmount} <span style="font-size: 16px; font-weight: 400; color: #bcbcbc;">USD</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 0; border-bottom: 1px solid #424242;">
                    <p style="margin: 0 0 4px; font-size: 15px; line-height: 24px; color: #bcbcbc;">Date</p>
                    <p style="margin: 0; font-size: 17px; line-height: 26px; color: #e9e9e9;">${eDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 0 0;">
                    <p style="margin: 0 0 4px; font-size: 15px; line-height: 24px; color: #bcbcbc;">Order reference</p>
                    <p style="margin: 0; font-size: 17px; line-height: 26px; color: #e9e9e9; overflow-wrap: anywhere;">${eReference}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 16px; line-height: 26px; color: #bcbcbc;">Lifetime access. No subscription.</p>
            </td>
          </tr>
          <tr>
            <td class="receipt-padding" style="padding: 28px 40px 32px; border-top: 1px solid #424242;">
              <p style="margin: 0 0 8px; font-size: 16px; line-height: 26px; color: #bcbcbc;">Need a refund or have a question? Write to <a href="mailto:${eSupport}" style="color: #b5d5c5; text-decoration: underline; overflow-wrap: anywhere;">${eSupport}</a>.</p>
              <p style="margin: 0; font-size: 15px; line-height: 24px; color: #bcbcbc;">Refunds are available for 5 days.</p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
