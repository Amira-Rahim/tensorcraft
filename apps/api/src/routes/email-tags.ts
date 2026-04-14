import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { addSubscriber, tagSubscriber } from "../lib/kit";

const EMAIL_TAG_MAP: Record<string, string | undefined> = {
  signed_up: process.env.KIT_TAG_SIGNED_UP,
  onboarded: process.env.KIT_TAG_ONBOARDED,
  first_lesson: process.env.KIT_TAG_FIRST_LESSON,
  capstone: process.env.KIT_TAG_CAPSTONE,
};

const VALID_EVENTS = Object.keys(EMAIL_TAG_MAP);

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

  const tagId = EMAIL_TAG_MAP[body.event];
  if (!tagId) {
    return c.json({ ok: true, skipped: true });
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
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
