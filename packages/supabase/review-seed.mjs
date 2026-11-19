import { createClient } from "@supabase/supabase-js";
import { fileURLToPath, URL } from "node:url";
import process from "node:process";
import { resolve } from "node:path";
import {
  assertReviewUrl,
  readLessonFixtures,
} from "../../scripts/review-lib.mjs";

export const REVIEW_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "alex@example.test",
    display_name: "Alex (review)",
    onboarding_completed: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "jordan@example.test",
    display_name: "Jordan (review)",
    onboarding_completed: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "sam@example.test",
    display_name: "Sam (review)",
    onboarding_completed: false,
  },
];

export async function seedReviewDatabase(env = process.env, options = {}) {
  const url = assertReviewUrl(env.SUPABASE_URL, env.TENSORCRAFT_REVIEW);
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Missing local Supabase service-role key.");
  const root =
    options.root ?? resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const client =
    options.client ??
    createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) => {
          const destination = new URL(
            typeof input === "string" || input instanceof URL
              ? input
              : input.url,
          );
          if (destination.origin !== url)
            throw new Error(
              "Seed refused a request outside the local review database.",
            );
          return globalThis.fetch(input, { ...init, redirect: "error" });
        },
      },
    });
  // Auth rows come first: the profiles table has a foreign key to auth.users.
  for (const user of REVIEW_USERS) {
    const existing = await client.auth.admin.getUserById(user.id);
    if (existing.error && existing.error.status !== 404) throw existing.error;
    if (existing.data?.user && existing.data.user.email !== user.email) {
      throw new Error(
        "A review user ID already belongs to an unexpected account.",
      );
    }
    if (!existing.data?.user) {
      const { error } = await client.auth.admin.createUser({
        id: user.id,
        email: user.email,
        email_confirm: true,
      });
      if (error) throw error;
    }
  }
  async function upsert(table, rows, conflict) {
    const { error } = await client
      .from(table)
      .upsert(rows, { onConflict: conflict });
    if (error) throw new Error(`Review ${table}: ${error.message}`);
  }
  await upsert(
    "profiles",
    REVIEW_USERS.map((user) => ({
      ...user,
      preferred_world_id: user.onboarding_completed ? "deep-orbit" : null,
      role: "user",
      email_alerts: false,
      weekly_digest: false,
    })),
    "id",
  );
  const lessons = readLessonFixtures(root);
  const now = new Date();
  await upsert(
    "world_progress",
    lessons.map((lesson, index) => {
      const completed = index < 7;
      const time = new Date(
        now.getTime() - (lessons.length - index) * 86400000,
      ).toISOString();
      return {
        ...lesson,
        user_id: REVIEW_USERS[0].id,
        status: completed ? "completed" : "in_progress",
        score: completed ? 90 : null,
        hints_used: 0,
        attempts: 1,
        started_at: time,
        completed_at: completed ? time : null,
      };
    }),
    "user_id,world_id,lesson_id",
  );
  await upsert(
    "streaks",
    [
      {
        user_id: REVIEW_USERS[0].id,
        world_id: "deep-orbit",
        current_streak: 3,
        longest_streak: 5,
        last_activity_date: now.toISOString().slice(0, 10),
      },
    ],
    "user_id,world_id",
  );
  await upsert(
    "purchases",
    [
      {
        user_id: REVIEW_USERS[0].id,
        plan_id: "world-single",
        world_ids: ["deep-orbit"],
        amount: 50,
        currency: "USD",
        stripe_session_id: "review_mock_deep_orbit_001",
        status: "completed",
      },
    ],
    "stripe_session_id",
  );
  return { users: REVIEW_USERS.length, progress: lessons.length, purchases: 1 };
}
