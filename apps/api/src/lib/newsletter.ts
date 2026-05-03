// apps/api/src/lib/newsletter.ts
//
// Weekly browser-ML digest newsletter sender. Reads shortlisted/published
// news_items for a given ISO week, renders text + HTML bodies, and sends
// to every subscribed waitlist row via Resend.
//
// Run flow:
//   1. Curator shortlists items at /admin/digest (status='shortlisted').
//   2. scripts/news/draft.mjs writes blog MDX + flips items to 'published'.
//   3. POST /api/admin/newsletter/send (or scripts/news/send-newsletter.mjs)
//      invokes sendDigestNewsletter(weekIso) — this file.
//
// Send model: per-recipient request to Resend so each email gets its own
// unsubscribe token. Slow but simple; switch to Resend Broadcasts if/when
// list size makes per-recipient sends impractical.

import { Resend } from "resend";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { logger } from "./logger";
import { captureException } from "./error-tracking";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tensorcraft.app";
const FROM =
  process.env.NEWSLETTER_FROM || "The Bridge <bridge@tensorcraft.app>";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

interface MatchedLessonRef {
  themeId: string;
  moduleId: string;
  slug: string;
  title: string;
  rationale?: string;
}

interface DigestItem {
  title: string;
  url: string;
  source: string;
  summary: string;
  matched_lessons: MatchedLessonRef[];
  published_blog_slug: string | null;
}

export interface NewsletterSendResult {
  weekIso: string;
  itemCount: number;
  recipientCount: number;
  sent: number;
  failed: number;
}

/**
 * Render the digest body for a given week. Returns null if there are no
 * items shortlisted/published for that week.
 */
async function loadDigestItems(weekIso: string): Promise<DigestItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news_items")
    .select("title,url,source,summary,matched_lessons,published_blog_slug")
    .in("status", ["shortlisted", "published"])
    .eq("week_iso", weekIso)
    .order("scraped_at", { ascending: false });
  if (error) throw new Error(`load digest items: ${error.message}`);
  return (data ?? []) as DigestItem[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderText(
  weekIso: string,
  items: DigestItem[],
  unsubUrl: string,
): string {
  const lines = [
    `The Bridge — ${weekIso}`,
    "",
    `Browser-ML news this week, mapped to lessons that teach the underlying concepts.`,
    "",
  ];
  for (const it of items) {
    lines.push(`• ${it.title}`);
    lines.push(`  ${it.url}`);
    const m = it.matched_lessons?.[0];
    if (m) {
      lines.push(
        `  Teaches: ${m.title} → ${SITE}/learn/${m.themeId}/${m.moduleId}/${m.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${weekIso}&utm_content=${encodeURIComponent(it.url)}`,
      );
      if (m.rationale) lines.push(`  ${m.rationale}`);
    }
    lines.push("");
  }
  lines.push(`Unsubscribe: ${unsubUrl}`);
  return lines.join("\n");
}

function renderHtml(
  weekIso: string,
  items: DigestItem[],
  unsubUrl: string,
): string {
  const itemsHtml = items
    .map((it) => {
      const m = it.matched_lessons?.[0];
      const lessonHref = m
        ? `${SITE}/learn/${m.themeId}/${m.moduleId}/${m.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${weekIso}&utm_content=${encodeURIComponent(it.url)}`
        : null;
      return `<li style="margin: 0 0 24px 0;">
  <p style="margin: 0 0 4px 0; font-weight: 600;">
    <a href="${escapeHtml(it.url)}" style="color: #111; text-decoration: none;">${escapeHtml(it.title)}</a>
  </p>
  <p style="margin: 0 0 8px 0; color: #555; font-size: 14px;">${escapeHtml(it.source)}</p>
  ${
    m && lessonHref
      ? `<p style="margin: 0; font-size: 14px;">
    Teaches: <a href="${escapeHtml(lessonHref)}" style="color: #0050b3;">${escapeHtml(m.title)}</a>
    ${m.rationale ? `<br/><span style="color: #555;">${escapeHtml(m.rationale)}</span>` : ""}
  </p>`
      : ""
  }
</li>`;
    })
    .join("\n");

  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>The Bridge — ${escapeHtml(weekIso)}</title></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fafafa;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border: 1px solid #eaeaea;">
    <p style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">The Bridge — ${escapeHtml(weekIso)}</p>
    <h1 style="margin: 0 0 24px 0; font-size: 22px;">Browser-ML news, mapped to lessons.</h1>
    <ul style="list-style: none; padding: 0; margin: 0;">${itemsHtml}</ul>
    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;"/>
    <p style="font-size: 12px; color: #888;">
      <a href="${escapeHtml(SITE)}/blog" style="color: #888;">Read on the web</a> ·
      <a href="${escapeHtml(unsubUrl)}" style="color: #888;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
}

/**
 * Send the digest newsletter for a given week to every subscribed recipient.
 */
export async function sendDigestNewsletter(
  weekIso: string,
  options: { dryRun?: boolean } = {},
): Promise<NewsletterSendResult> {
  const items = await loadDigestItems(weekIso);
  if (items.length === 0) {
    return { weekIso, itemCount: 0, recipientCount: 0, sent: 0, failed: 0 };
  }

  const supabase = getSupabaseAdminClient();
  const { data: recipients, error } = await supabase
    .from("waitlist")
    .select("email,unsubscribe_token")
    .eq("subscribed", true);
  if (error) throw new Error(`load recipients: ${error.message}`);
  const list = recipients ?? [];

  const result: NewsletterSendResult = {
    weekIso,
    itemCount: items.length,
    recipientCount: list.length,
    sent: 0,
    failed: 0,
  };

  if (options.dryRun || list.length === 0) {
    logger.info(
      { source: "newsletter.sendDigest", ...result, dryRun: !!options.dryRun },
      "dry-run or empty list — skipping send",
    );
    return result;
  }

  const client = getResend();
  if (!client) {
    throw new Error("RESEND_API_KEY not set");
  }

  const subject = `The Bridge — ${weekIso}`;

  for (const r of list) {
    const unsubUrl = `${SITE}/unsubscribe?token=${r.unsubscribe_token}`;
    try {
      await client.emails.send({
        from: FROM,
        to: r.email,
        subject,
        text: renderText(weekIso, items, unsubUrl),
        html: renderHtml(weekIso, items, unsubUrl),
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      captureException(err, {
        source: "newsletter.send",
        extra: { email: r.email, weekIso },
      });
    }
  }

  logger.info(
    { source: "newsletter.sendDigest", ...result },
    "newsletter send complete",
  );
  return result;
}

/**
 * Mark a waitlist row unsubscribed by token. Used by the /unsubscribe page.
 * Returns true if a row was updated, false if the token didn't match anything.
 */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("waitlist")
    .update({ subscribed: false })
    .eq("unsubscribe_token", token)
    .select("id");
  if (error) throw new Error(`unsubscribe: ${error.message}`);
  return (data?.length ?? 0) > 0;
}
