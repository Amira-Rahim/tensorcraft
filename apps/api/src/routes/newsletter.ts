import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { addSubscriber, tagSubscriber } from "../lib/kit";

const newsletter = new Hono();

/** Source-to-tag mapping. Values are Kit tag IDs set via env vars. */
function getTagForSource(source: string): string | undefined {
  const tagMap: Record<string, string | undefined> = {
    waitlist: process.env.KIT_TAG_WAITLIST,
    "notify-theme": process.env.KIT_TAG_NOTIFY_THEME,
    footer: process.env.KIT_TAG_FOOTER,
    landing: process.env.KIT_TAG_LANDING,
  };
  return tagMap[source];
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ──────────────────────────────────────────────
// POST /api/newsletter/subscribe
// ──────────────────────────────────────────────

newsletter.post("/subscribe", async (c) => {
  let body: { email: string; firstName?: string; source?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email || !emailRegex.test(body.email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const source = body.source ?? "unknown";

  // 1. Dual-write to Supabase waitlist table (data safety)
  const supabase = getSupabaseAdminClient();
  const { error: dbError } = await supabase.from("waitlist").insert({
    email,
    theme_id: null,
    source,
  });

  // Ignore duplicate constraint violations
  if (dbError && dbError.code !== "23505") {
    console.error("Newsletter: Supabase insert failed", dbError.message);
  }

  // 2. Add subscriber to Kit (non-blocking — don't fail if Kit is down)
  const tagId = getTagForSource(source);
  const tags = tagId ? [tagId] : [];

  try {
    await addSubscriber(email, body.firstName, tags);
  } catch (err) {
    console.error(
      "Newsletter: Kit addSubscriber failed",
      err instanceof Error ? err.message : err,
    );
    // Continue — Supabase write succeeded, Kit sync can be retried later
  }

  return c.json({ message: "Subscribed" }, 201);
});

// ──────────────────────────────────────────────
// POST /api/newsletter/tag
// ──────────────────────────────────────────────

newsletter.post("/tag", async (c) => {
  let body: { email: string; tag: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email || !emailRegex.test(body.email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  if (!body.tag) {
    return c.json({ error: "tag is required" }, 400);
  }

  try {
    await tagSubscriber(body.email.trim().toLowerCase(), body.tag);
    return c.json({ message: "Tag added" });
  } catch (err) {
    console.error(
      "Newsletter: Kit tagSubscriber failed",
      err instanceof Error ? err.message : err,
    );
    return c.json({ error: "Failed to add tag" }, 500);
  }
});

export { newsletter };
