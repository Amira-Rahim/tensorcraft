import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { addSubscriber, tagSubscriber } from "../lib/kit";

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
