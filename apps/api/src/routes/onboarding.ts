import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import { tagSubscriber } from "../lib/kit";
import type { AppEnv } from "../types";

/**
 * Onboarding survey persistence.
 *
 * PATCH /api/onboarding, authenticated. Accepts any subset of the
 * onboarding fields and writes them via the service-role client.
 *
 * Validation enforces the same enum lists that the DB CHECK constraints
 * on `profiles.experience_level` and `profiles.learning_goal` enforce, a
 * malformed request is rejected before the DB sees it so we can return a
 * friendly 400.
 */
const onboarding = new Hono<AppEnv>();

onboarding.use("*", authMiddleware);

const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

const LEARNING_GOALS = [
  "hobby",
  "career",
  "research",
  "team",
  "curiosity",
] as const;
type LearningGoal = (typeof LEARNING_GOALS)[number];

function isExperienceLevel(v: unknown): v is ExperienceLevel {
  return (
    typeof v === "string" &&
    (EXPERIENCE_LEVELS as readonly string[]).includes(v)
  );
}

function isLearningGoal(v: unknown): v is LearningGoal {
  return (
    typeof v === "string" && (LEARNING_GOALS as readonly string[]).includes(v)
  );
}

type OnboardingUpdate = {
  experience_level?: ExperienceLevel;
  learning_goal?: LearningGoal;
  js_background?: string;
  js_experience_years?: number;
  onboarding_completed?: boolean;
  updated_at: string;
};

onboarding.patch("/", async (c) => {
  const userId = c.get("userId");

  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // One-release shim (migration 059 rebrand): stale clients still send the
  // pre-rename keys. Map them, then ignore `fe_framework` entirely, the
  // column was dropped and the value was always the constant "react".
  // Remove this shim at the next scheduled API deploy.
  if (!("js_background" in body) && "fe_background" in body) {
    body.js_background = body.fe_background;
  }
  if (!("js_experience_years" in body) && "fe_experience_years" in body) {
    body.js_experience_years = body.fe_experience_years;
  }

  const updates: OnboardingUpdate = {
    updated_at: new Date().toISOString(),
  };

  if ("experience_level" in body) {
    const v = body.experience_level;
    if (!isExperienceLevel(v)) {
      return c.json(
        {
          error: `experience_level must be one of: ${EXPERIENCE_LEVELS.join(", ")}`,
        },
        400,
      );
    }
    updates.experience_level = v;
  }

  if ("learning_goal" in body) {
    const v = body.learning_goal;
    if (!isLearningGoal(v)) {
      return c.json(
        {
          error: `learning_goal must be one of: ${LEARNING_GOALS.join(", ")}`,
        },
        400,
      );
    }
    updates.learning_goal = v;
  }

  if ("js_background" in body) {
    const v = body.js_background;
    if (typeof v !== "string" || v.length === 0 || v.length > 200) {
      return c.json(
        { error: "js_background must be a string of 1-200 characters" },
        400,
      );
    }
    updates.js_background = v;
  }

  if ("js_experience_years" in body) {
    const v = body.js_experience_years;
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 50) {
      return c.json(
        {
          error: "js_experience_years must be an integer between 0 and 50",
        },
        400,
      );
    }
    updates.js_experience_years = v;
  }

  if ("onboarding_completed" in body) {
    const v = body.onboarding_completed;
    if (typeof v !== "boolean") {
      return c.json({ error: "onboarding_completed must be a boolean" }, 400);
    }
    updates.onboarding_completed = v;
  }

  const touchedFields = Object.keys(updates).filter((k) => k !== "updated_at");
  if (touchedFields.length === 0) {
    return c.json(
      {
        error:
          "No valid fields to update. Allowed: experience_level, learning_goal, js_background, js_experience_years, onboarding_completed",
      },
      400,
    );
  }

  const admin = getSupabaseAdminClient();

  // Read the row first so we can detect a false -> true transition on
  // `onboarding_completed`. The Kit `onboarded` tag must only fire on
  // that edge so retry requests don't double-tag. `profiles.email` also
  // comes from this read, we prefer the DB copy over the JWT claim in
  // case the two drift.
  const { data: existing, error: readError } = await admin
    .from("profiles")
    .select("onboarding_completed, email")
    .eq("id", userId)
    .single();

  if (readError || !existing) {
    logger.error(
      { err: readError, route: "onboarding.patch" },
      "Onboarding PATCH failed, profile lookup",
    );
    return c.json(
      {
        error: "Failed to update onboarding fields",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error || !data) {
    logger.error(
      { err: error, route: "onboarding.patch" },
      "Onboarding PATCH failed",
    );
    return c.json(
      {
        error: "Failed to update onboarding fields",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Fire the Kit `onboarded` tag on the false -> true edge. Best-effort:
  // a Kit API failure is logged but does not fail the request, and the
  // transition check means retry requests (where `onboarding_completed`
  // was already true) no-op here.
  const wasCompleted = existing.onboarding_completed === true;
  const isNowCompleted = updates.onboarding_completed === true;
  const tagId = process.env.KIT_TAG_ONBOARDED;
  if (!wasCompleted && isNowCompleted && existing.email && tagId) {
    tagSubscriber(existing.email, tagId).catch((err: unknown) => {
      logger.warn(
        { err, route: "onboarding.patch" },
        "Kit onboarded tag failed, non-fatal",
      );
    });
  }

  return c.json({ profile: data });
});

export { onboarding };
