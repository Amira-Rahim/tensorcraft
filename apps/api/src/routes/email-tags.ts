import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { addSubscriber, tagSubscriber, unsubscribeFromAll } from "../lib/kit";
import { isValidAdminKey } from "../lib/admin-auth";
import { logger } from "../lib/logger";

// Read env vars at request time (not module load) so tests can stub them
// and so Fly.io secret rotations take effect without a redeploy.
const EMAIL_TAG_ENV_KEYS: Record<string, string> = {
  signed_up: "KIT_TAG_SIGNED_UP",
  onboarded: "KIT_TAG_ONBOARDED",
  first_lesson: "KIT_TAG_FIRST_LESSON",
  capstone: "KIT_TAG_CAPSTONE",
  // Intent tags. The four above track progress; these two capture the moment
  // a learner runs out of free content, which is the highest-intent signal in
  // the product and previously went untagged entirely - a user could finish
  // module 1, hit the paywall, and leave without any sequence able to reach
  // them. Consumed by retention sequence B (started-stalled); see
  // docs/email-retention-sequences.md.
  module_1_complete: "KIT_TAG_MODULE_1_COMPLETE",
  paywall_hit: "KIT_TAG_PAYWALL_HIT",
};

const VALID_EVENTS = Object.keys(EMAIL_TAG_ENV_KEYS);

function getTagIdForEvent(event: string): string | undefined {
  const envKey = EMAIL_TAG_ENV_KEYS[event];
  return envKey ? process.env[envKey] : undefined;
}

export const emailTags = new Hono();

emailTags.post("/", async (c) => {
  let body: { event: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.event || !VALID_EVENTS.includes(body.event)) {
    return c.json(
      { error: `Invalid event. Valid: ${VALID_EVENTS.join(", ")}` },
      400,
    );
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tagId = getTagIdForEvent(body.event);
  if (!tagId) {
    return c.json({ ok: true, skipped: true });
  }

  try {
    const supabase = getSupabaseServerClient(authHeader.replace("Bearer ", ""));
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.email) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    addSubscriber(user.email).catch(() => {});
    tagSubscriber(user.email, tagId).catch(() => {});

    return c.json({ ok: true, event: body.event });
  } catch {
    return c.json({ ok: true, skipped: true });
  }
});

/**
 * Internal relay: tell Kit that an address unsubscribed.
 *
 * The email-link unsubscribe handlers live in `apps/web`, which has no Kit
 * client and no Kit secrets. They flip `waitlist.subscribed` themselves,
 * which stops OUR digest, and then call this so Kit stops its own sequences.
 * Without it an unsubscribed address keeps receiving Kit sequence mail the
 * moment the retention automations go live.
 *
 * Server-to-server only. Answers identically whether or not Kit knows the
 * address: the only legitimate caller is our own unsubscribe route, and a
 * differentiated response would make this a subscriber-enumeration oracle
 * for anyone who obtained the key.
 */
emailTags.post("/unsubscribe", async (c) => {
  if (!isValidAdminKey(c.req.header("x-admin-api-key"))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: { email?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const email = body.email?.trim();
  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }

  // Kit's stored credentials currently 401, and this sits behind a
  // compliance path. The caller has ALREADY flipped the database, so a Kit
  // outage must not read as a failed unsubscribe.
  try {
    await unsubscribeFromAll(email);
  } catch (err) {
    logger.warn(
      { err, route: "email.unsubscribe" },
      "Kit unsubscribe relay failed; local opt-out already applied",
    );
  }

  return c.json({ ok: true });
});
