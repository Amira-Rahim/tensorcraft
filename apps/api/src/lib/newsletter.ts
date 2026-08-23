// apps/api/src/lib/newsletter.ts
//
// Weekly browser-ML digest newsletter sender. Reads shortlisted/published
// news_items for a given ISO week, renders text + HTML bodies, and sends
// to every subscribed waitlist row via Resend.
//
// Run flow:
//   1. Curator shortlists items at /admin/digest (status='shortlisted').
//   2. scripts/news/draft.mjs writes idea briefs to dist/drafts/; a human
//      writes the actual blog post and flips the rows to 'published' with
//      published_blog_slug set (posts are hand-written, owner 2026-08-14).
//   3. POST /api/admin/newsletter/send (or scripts/news/send-newsletter.mjs)
//      invokes sendDigestNewsletter(weekIso), this file.
//
// Send model: per-recipient request to Resend so each email gets its own
// unsubscribe token. Slow but simple; switch to Resend Broadcasts if/when
// list size makes per-recipient sends impractical.

import { Resend } from "resend";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { isLaunched } from "@tensorcraft/shared";
import { logger } from "./logger";
import { withTimeout } from "./with-timeout";
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
  worldId: string;
  moduleId: string;
  slug: string;
  title: string;
  rationale?: string;
}

interface DigestItem {
  title: string;
  url: string;
  source: string;
  matched_lessons: MatchedLessonRef[];
  published_blog_slug: string | null;
}

export interface NewsletterSendResult {
  weekIso: string;
  itemCount: number;
  recipientCount: number;
  sent: number;
  failed: number;
  /**
   * Set when the send was refused before any mail went out. Present only on
   * a genuine block, so `sent: 0` alone stays ambiguous between "nothing to
   * do" and "we refused".
   */
  blockedReason?: "missing_postal_address";
}

/**
 * CAN-SPAM requires a physical postal address in every commercial message.
 * Nothing in the repo holds one yet (the owner deferred acquiring it on
 * 2026-08-23), so the sender fails CLOSED: no address means no send.
 *
 * That is safe to defer precisely because the digest has no scheduled
 * trigger. The weekly cron only scrapes news for curation; a human sends
 * from /admin/digest. Failing closed converts "remember before you click
 * send" into something the code enforces.
 */
function postalAddress(): string | null {
  const value = process.env.NEWSLETTER_POSTAL_ADDRESS?.trim();
  return value ? value : null;
}

/**
 * Render the digest body for a given week. Returns null if there are no
 * items shortlisted/published for that week.
 */
async function loadDigestItems(weekIso: string): Promise<DigestItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news_items")
    .select("title,url,source,matched_lessons,published_blog_slug")
    .in("status", ["shortlisted", "published"])
    .eq("week_iso", weekIso)
    .order("scraped_at", { ascending: false });
  if (error) throw new Error(`load digest items: ${error.message}`);
  // V1 scope-revert: strip matched_lessons for coming-soon worlds so the
  // digest never links to a 404'd lesson route. Curators can still tag a
  // news item with a coming-soon lesson at draft time, but the rendered
  // email + UTM chain only surface launched-world lessons.
  return (data ?? []).map((row) => ({
    ...row,
    matched_lessons: (row.matched_lessons ?? []).filter(
      (m: { worldId: string }) => isLaunched(m.worldId),
    ),
  })) as DigestItem[];
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
    `The Bridge (weekly digest): ${weekIso}`,
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
        `  Teaches: ${m.title} → ${SITE}/worlds/${m.worldId}/${m.moduleId}/${m.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${weekIso}&utm_content=${encodeURIComponent(it.url)}`,
      );
      if (m.rationale) lines.push(`  ${m.rationale}`);
    }
    lines.push("");
  }
  lines.push(`Unsubscribe: ${unsubUrl}`);
  const address = postalAddress();
  if (address) lines.push(address);
  return lines.join("\n");
}

function renderHtml(
  weekIso: string,
  items: DigestItem[],
  unsubUrl: string,
): string {
  // "Read on the web" targets this week's actual blog post when one was
  // drafted (run-flow step 2), not just the /blog index.
  const blogSlug = items.find(
    (i) => i.published_blog_slug,
  )?.published_blog_slug;
  const webUrl = blogSlug ? `${SITE}/blog/${blogSlug}` : `${SITE}/blog`;
  const itemsHtml = items
    .map((it) => {
      const m = it.matched_lessons?.[0];
      const lessonHref = m
        ? // Lessons are served under /worlds/[slug]/[module]/[lesson];
          // /learn is a single marketing page with no nested routes
          // (2026-07-13 P4 round-3 audit: every digest lesson link 404'd).
          `${SITE}/worlds/${m.worldId}/${m.moduleId}/${m.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${weekIso}&utm_content=${encodeURIComponent(it.url)}`
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
<html><head><meta charset="utf-8"/><title>The Bridge: ${escapeHtml(weekIso)}</title></head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fafafa;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border: 1px solid #eaeaea;">
    <p style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #666;">The Bridge · weekly digest · ${escapeHtml(weekIso)}</p>
    <h1 style="margin: 0 0 24px 0; font-size: 22px;">Browser-ML news, mapped to lessons.</h1>
    <ul style="list-style: none; padding: 0; margin: 0;">${itemsHtml}</ul>
    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;"/>
    <p style="font-size: 12px; color: #888;">
      <a href="${escapeHtml(webUrl)}" style="color: #888;">Read on the web</a> ·
      <a href="${escapeHtml(unsubUrl)}" style="color: #888;">Unsubscribe</a>
    </p>
    ${postalAddress() ? `<p style="font-size: 12px; color: #888; margin: 8px 0 0 0;">${escapeHtml(postalAddress() as string)}</p>` : ""}
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

  // Cross-stream opt-out (2026-07-13 P4 email audit): the Settings
  // weekly-digest toggle writes profiles.weekly_digest, but this sender
  // reads the WAITLIST table - a different population. A learner who
  // joined the waitlist, then signed up and toggled the digest off,
  // must not keep receiving it. Exclude any waitlist email whose
  // account profile has opted out.
  const { data: optedOut, error: optErr } = await supabase
    .from("profiles")
    .select("email")
    .eq("weekly_digest", false);
  if (optErr) throw new Error(`load opt-outs: ${optErr.message}`);
  const optedOutEmails = new Set(
    (optedOut ?? [])
      .map((p) => p.email?.toLowerCase())
      .filter((e): e is string => Boolean(e)),
  );
  const list = (recipients ?? []).filter(
    (r) => !optedOutEmails.has(r.email.toLowerCase()),
  );

  const result: NewsletterSendResult = {
    weekIso,
    itemCount: items.length,
    recipientCount: list.length,
    sent: 0,
    failed: 0,
  };

  // Checked AFTER the dry-run branch below would have been cheaper, but the
  // order matters: a real send with no address must stop here, while a dry
  // run mails nobody and is allowed to proceed for previewing.
  if (!options.dryRun && list.length > 0 && !postalAddress()) {
    logger.error(
      { source: "newsletter.sendDigest", ...result },
      "Refusing to send: NEWSLETTER_POSTAL_ADDRESS is unset and CAN-SPAM requires a physical address",
    );
    return { ...result, blockedReason: "missing_postal_address" };
  }

  if (options.dryRun || list.length === 0) {
    logger.info(
      { source: "newsletter.sendDigest", ...result, dryRun: !!options.dryRun },
      "dry-run or empty list, skipping send",
    );
    return result;
  }

  const client = getResend();
  if (!client) {
    throw new Error("RESEND_API_KEY not set");
  }

  const subject = `The Bridge: ${weekIso}`;

  // Resend's default rate limit is 2 requests/second. An unthrottled loop
  // over a launch-sized list (~500 recipients, §10b) gets the bulk 429'd -
  // and because the SDK never throws (see below), it would previously have
  // reported them all as sent. 600ms spacing stays safely under the limit;
  // a weekly digest is not latency-sensitive. Zero under test so the suite
  // doesn't sleep.
  const SEND_SPACING_MS = process.env.NODE_ENV === "test" ? 0 : 600;

  for (const r of list) {
    const unsubUrl = `${SITE}/unsubscribe?token=${r.unsubscribe_token}`;
    // RFC 8058: providers POST to the List-Unsubscribe URL. The human
    // page is GET-only, so the header carries the POST route instead
    // (2026-07-13 P4 audit: provider one-click POSTs were bouncing 405).
    const oneClickUrl = `${SITE}/unsubscribe/one-click?token=${r.unsubscribe_token}`;
    try {
      // The Resend SDK does NOT throw on failure: 4xx/5xx/429 and network
      // errors all resolve `{ data: null, error }`. Ignoring `error` made
      // `result.failed` structurally unreachable - every failed send
      // counted as sent, with zero Sentry captures (gap sweep F1,
      // 2026-07-25; same defect class as the supabase-js R3-4e fix).
      const { error: sendError } = await withTimeout(
        client.emails.send({
          from: FROM,
          to: r.email,
          subject,
          text: renderText(weekIso, items, unsubUrl),
          html: renderHtml(weekIso, items, unsubUrl),
          headers: {
            "List-Unsubscribe": `<${oneClickUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
        10_000,
        "digest send",
      );
      if (sendError) {
        result.failed += 1;
        // No recipient address in the capture: it lands in Fly logs
        // (logger redacts `email` anyway). Resend's dashboard keys the
        // failed send to the address; the token is enough to find the
        // waitlist row from our side.
        captureException(new Error(sendError.message), {
          source: "newsletter.send",
          extra: {
            unsubscribeToken: r.unsubscribe_token,
            weekIso,
            name: sendError.name,
          },
        });
      } else {
        result.sent += 1;
      }
    } catch (err) {
      result.failed += 1;
      captureException(err, {
        source: "newsletter.send",
        extra: { unsubscribeToken: r.unsubscribe_token, weekIso },
      });
    }
    await new Promise((resolve) => setTimeout(resolve, SEND_SPACING_MS));
  }

  logger.info(
    { source: "newsletter.sendDigest", ...result },
    "newsletter send complete",
  );
  return result;
}

// Unsubscribe handling lives web-side: the /unsubscribe page (human,
// confirm-then-POST) and /unsubscribe/one-click (RFC 8058 provider POST).
// A third copy used to live here as a dead export; deleted 2026-07-13 so
// the two remaining implementations can't drift against a third.
