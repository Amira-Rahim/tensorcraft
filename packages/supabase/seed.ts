/**
 * Tensorcraft Database Seed Script
 *
 * Seeds the database with demo users, progress, streaks, and purchases
 * for local development and testing.
 *
 * Uses service role key to bypass RLS.
 * Uses upsert (ON CONFLICT) so the script is idempotent, safe to run repeatedly.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Deterministic IDs (idempotent across runs)
// ---------------------------------------------------------------------------

const USER_IDS = {
  alex: "00000000-0000-0000-0000-000000000001",
  jordan: "00000000-0000-0000-0000-000000000002",
  sam: "00000000-0000-0000-0000-000000000003",
} as const;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

async function seedProfiles() {
  const profiles = [
    {
      id: USER_IDS.alex,
      email: "alex.chen@demo.tensorcraft.app",
      display_name: "Alex Chen",
      onboarding_completed: true,
      preferred_theme_id: "deep-orbit",
    },
    {
      id: USER_IDS.jordan,
      email: "jordan.park@demo.tensorcraft.app",
      display_name: "Jordan Park",
      onboarding_completed: true,
      preferred_theme_id: "deep-orbit",
    },
    {
      id: USER_IDS.sam,
      email: "sam.rivera@demo.tensorcraft.app",
      display_name: "Sam Rivera",
      onboarding_completed: false,
    },
  ];

  const { data, error } = await supabase
    .from("profiles")
    .upsert(profiles, { onConflict: "id" })
    .select();

  if (error) throw new Error(`Failed to seed profiles: ${error.message}`);
  console.log(`[seed] Upserted ${data.length} profiles`);
  return data;
}

async function seedProgress() {
  const themeId = "deep-orbit";
  const userId = USER_IDS.alex;

  // Module 1: signals-in-space, all 5 lessons completed
  const completedLessons = Array.from({ length: 5 }, (_, i) => ({
    user_id: userId,
    theme_id: themeId,
    module_id: "signals-in-space",
    lesson_id: `signals-in-space-${i + 1}`,
    status: "completed" as const,
    score: 95 + i,
    hints_used: i,
    attempts: 1,
    started_at: new Date(2026, 2, 1 + i).toISOString(),
    completed_at: new Date(2026, 2, 1 + i).toISOString(),
  }));

  // Module 2: neural-navigation, lessons 1-3 completed, 4-5 in progress
  const navCompleted = Array.from({ length: 3 }, (_, i) => ({
    user_id: userId,
    theme_id: themeId,
    module_id: "neural-navigation",
    lesson_id: `neural-navigation-${i + 1}`,
    status: "completed" as const,
    score: 88 + i * 3,
    hints_used: i,
    attempts: 1,
    started_at: new Date(2026, 2, 6 + i).toISOString(),
    completed_at: new Date(2026, 2, 6 + i).toISOString(),
  }));

  const navInProgress = Array.from({ length: 2 }, (_, i) => ({
    user_id: userId,
    theme_id: themeId,
    module_id: "neural-navigation",
    lesson_id: `neural-navigation-${i + 4}`,
    status: "in_progress" as const,
    score: null,
    hints_used: 0,
    attempts: i + 1,
    started_at: new Date(2026, 2, 9 + i).toISOString(),
    completed_at: null,
  }));

  const allProgress = [...completedLessons, ...navCompleted, ...navInProgress];

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(allProgress, { onConflict: "user_id,theme_id,lesson_id" })
    .select();

  if (error) throw new Error(`Failed to seed progress: ${error.message}`);
  console.log(`[seed] Upserted ${data.length} progress records`);
  console.log(`  - signals-in-space: 5 completed`);
  console.log(`  - neural-navigation: 3 completed, 2 in_progress`);
  return data;
}

async function seedStreaks() {
  const streak = {
    user_id: USER_IDS.alex,
    theme_id: "deep-orbit",
    current_streak: 5,
    longest_streak: 12,
    last_activity_date: "2026-03-12",
  };

  const { data, error } = await supabase
    .from("streaks")
    .upsert([streak], { onConflict: "user_id,theme_id" })
    .select();

  if (error) throw new Error(`Failed to seed streaks: ${error.message}`);
  console.log(`[seed] Upserted streak for Alex Chen: current=5, longest=12`);
  return data;
}

async function seedPurchases() {
  const purchase = {
    user_id: USER_IDS.alex,
    plan_id: "theme-single",
    theme_ids: ["deep-orbit"],
    amount: 59.0,
    currency: "USD",
    stripe_session_id: "demo_session_deep_orbit_001",
    status: "completed" as const,
  };

  const { data, error } = await supabase
    .from("purchases")
    .upsert([purchase], { onConflict: "stripe_session_id" })
    .select();

  if (error) throw new Error(`Failed to seed purchases: ${error.message}`);
  console.log(`[seed] Upserted purchase for Alex Chen: deep-orbit ($59.00)`);
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[seed] Starting Tensorcraft database seed...\n");

  try {
    await seedProfiles();
    await seedProgress();
    await seedStreaks();
    await seedPurchases();

    console.log("\n[seed] Done! Seed data applied successfully.");
  } catch (err) {
    console.error("\n[seed] Seed failed:", err);
    process.exit(1);
  }
}

main();
