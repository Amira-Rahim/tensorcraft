import { Hono } from "hono";
import { getSupabaseServerClient, type Json } from "@tensorcraft/supabase";
import { isValidWorldSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

const VALID_EVENT_TYPES = [
  "exercise_pass",
  "exercise_fail",
  "hint_reveal",
  "solution_view",
  "lesson_complete",
  "bridge_interaction",
] as const;

const VALID_SKILL_AXES = [
  "data_prep",
  "model_arch",
  "training",
  "evaluation",
  "deployment",
  "js_integration",
] as const;

type EventType = (typeof VALID_EVENT_TYPES)[number];
type SkillAxis = (typeof VALID_SKILL_AXES)[number];

const skillEvents = new Hono<AppEnv>();

skillEvents.use("*", authMiddleware);

/**
 * POST /api/skill-events, Record a skill event.
 * Fire-and-forget from the client, logs learning signals for future Genome computation.
 */
skillEvents.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    worldId: string;
    eventType: string;
    skillAxis: string;
    metadata?: Json;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.worldId || !body.eventType || !body.skillAxis) {
    return c.json(
      { error: "worldId, eventType, and skillAxis are required" },
      400,
    );
  }

  // One-release shim (migration 059 rebrand): stale clients still send the
  // pre-rename axis value. Remove at the next scheduled API deploy.
  if (body.skillAxis === "fe_integration") {
    body.skillAxis = "js_integration";
  }

  if (!isValidWorldSlug(body.worldId)) {
    return c.json({ error: "Invalid worldId" }, 400);
  }

  if (!VALID_EVENT_TYPES.includes(body.eventType as EventType)) {
    return c.json({ error: "Invalid eventType" }, 400);
  }

  if (!VALID_SKILL_AXES.includes(body.skillAxis as SkillAxis)) {
    return c.json({ error: "Invalid skillAxis" }, 400);
  }

  const supabase = getSupabaseServerClient(token);

  const { error } = await supabase.from("skill_events").insert({
    user_id: userId,
    world_id: body.worldId,
    event_type: body.eventType as EventType,
    skill_axis: body.skillAxis as SkillAxis,
    metadata: body.metadata ?? {},
  });

  if (error) {
    return c.json(
      {
        error: "Failed to record skill event",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ ok: true }, 201);
});

/**
 * POST /api/skill-events/batch, Record multiple skill events in one request.
 * Client buffers events and flushes periodically to reduce DB write pressure.
 * Max 50 events per request.
 */
skillEvents.post("/batch", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    events: Array<{
      worldId: string;
      eventType: string;
      skillAxis: string;
      metadata?: Json;
    }>;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { events } = body;

  if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
    return c.json({ error: "events must be an array of 1-50 items" }, 400);
  }

  for (const e of events) {
    // Same one-release shim as the single-event route above.
    if (e.skillAxis === "fe_integration") {
      e.skillAxis = "js_integration";
    }
    if (!e.worldId || !isValidWorldSlug(e.worldId)) {
      return c.json({ error: `Invalid worldId: ${e.worldId}` }, 400);
    }
    if (!VALID_EVENT_TYPES.includes(e.eventType as EventType)) {
      return c.json({ error: `Invalid eventType: ${e.eventType}` }, 400);
    }
    if (!VALID_SKILL_AXES.includes(e.skillAxis as SkillAxis)) {
      return c.json({ error: `Invalid skillAxis: ${e.skillAxis}` }, 400);
    }
  }

  const supabase = getSupabaseServerClient(token);
  const { error } = await supabase.from("skill_events").insert(
    events.map((e) => ({
      user_id: userId,
      world_id: e.worldId,
      event_type: e.eventType as EventType,
      skill_axis: e.skillAxis as SkillAxis,
      metadata: e.metadata ?? {},
    })),
  );

  if (error) {
    logger.error(
      { err: error, route: "skill-events.batch" },
      "Failed to batch insert skill events",
    );
    return c.json({ error: "Failed to record events" }, 500);
  }

  return c.json({ recorded: events.length }, 201);
});

export { skillEvents };
