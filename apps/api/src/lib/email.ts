// apps/api/src/lib/email.ts
import { Resend } from "resend";
import { captureException } from "./error-tracking";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
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
    console.warn("Resend not configured — skipping issue notification email");
    return;
  }

  const { id, category, severity, description, email, pageUrl, screenshotUrl } =
    params;

  const subject = `[${severity.toUpperCase()}] ${category.replace(/_/g, " ")} — Issue #${id.slice(0, 8)}`;

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
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Page</td><td><a href="${pageUrl}" style="color: #00D4FF;">${pageUrl}</a></td></tr>
        ${screenshotUrl ? `<tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Screenshot</td><td><a href="${screenshotUrl}" style="color: #00D4FF;">View</a></td></tr>` : ""}
      </table>
      <hr style="border: 1px solid rgba(255,255,255,0.06); margin: 16px 0;" />
      <p style="white-space: pre-wrap;">${description}</p>
    </div>
  `;

  try {
    await client.emails.send({
      from: "Tensorcraft <noreply@tensorcraft.app>",
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    captureException(err, { source: "issues.email" });
  }
}
