import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidThemeSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const VALID_EVENT_TYPES = [
  "exercise_pass",
  "exercise_fail",
  "hint_reveal",
  "solution_view",
  "lesson_complete",
  "bridge_interaction",
  "review_recall",
] as const;

const VALID_SKILL_AXES = [
  "data_prep",
  "model_arch",
  "training",
  "evaluation",
  "deployment",
  "fe_integration",
] as const;

type EventType = (typeof VALID_EVENT_TYPES)[number];
type SkillAxis = (typeof VALID_SKILL_AXES)[number];

const skillEvents = new Hono<AppEnv>();

skillEvents.use("*", authMiddleware);

/**
 * POST /api/skill-events — Record a skill event.
 * Fire-and-forget from the client — logs learning signals for future Genome computation.
 */
skillEvents.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    themeId: string;
    eventType: string;
    skillAxis: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.themeId || !body.eventType || !body.skillAxis) {
    return c.json(
      { error: "themeId, eventType, and skillAxis are required" },
      400,
    );
  }

  if (!isValidThemeSlug(body.themeId)) {
    return c.json({ error: "Invalid themeId" }, 400);
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
    theme_id: body.themeId,
    event_type: body.eventType,
    skill_axis: body.skillAxis,
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

export { skillEvents };
