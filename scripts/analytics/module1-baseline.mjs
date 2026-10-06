#!/usr/bin/env node
/**
 * Module-1 baseline capture (lesson-format audit 2026-09-04, step 3).
 *
 * Pulls the pre-video-clip baseline numbers from PostHog (EU) and prints
 * them as markdown, ready to paste into a copy of
 * docs/audits/module1-baseline-template.md. Run it only AFTER the
 * 2026-09-04 in-lesson instrumentation is deployed; events from before
 * that date cannot answer these questions (the skip metric was
 * structurally biased low, and step views did not exist).
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=phx_... POSTHOG_PROJECT_ID=12345 \
 *     node scripts/analytics/module1-baseline.mjs --since 2026-09-05
 *
 * Env:
 *   POSTHOG_PERSONAL_API_KEY  personal API key (Settings -> Personal API keys)
 *   POSTHOG_PROJECT_ID        numeric project id
 *   POSTHOG_HOST              default https://eu.posthog.com
 *
 * The earned-pass rate needs solution_viewed, which lives in Supabase, not
 * in the event stream; its SQL is in the template doc, not here.
 */

const HOST = process.env.POSTHOG_HOST ?? "https://eu.posthog.com";
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID;

const sinceArg = process.argv.indexOf("--since");
const SINCE = sinceArg !== -1 ? process.argv[sinceArg + 1] : "2026-09-05";

if (!KEY || !PROJECT) {
  console.error(
    "Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID (see file header).",
  );
  process.exit(1);
}

// Module-1 scope: the free tier, the only surface every prospect sees.
const SCOPE = `properties.worldId = 'deep-orbit' AND properties.moduleId = 'foundations' AND timestamp >= toDateTime('${SINCE} 00:00:00')`;

// The five module-1 lessons: the free tier, and the only per-lesson scope
// that keeps paid-module activity out of a "module 1" number.
const M1_LESSONS = `('introduction-to-tensors','tensor-shapes','tensor-operations','data-loading','normalization')`;

// Boolean properties arrive as JSON booleans; toString() makes the
// comparison robust whether PostHog has typed the new property or not.
const QUERIES = {
  "Step funnel (first views, module 1)": `
    SELECT toInt64(coalesce(properties.stepsVersion, 1)) AS steps_version,
           toInt64(properties.step) AS step,
           any(properties.stepName) AS name,
           count() AS views,
           count(DISTINCT person_id) AS people
    FROM events
    WHERE event = 'lesson_step_viewed'
      AND toString(properties.revisit) = 'false' AND ${SCOPE}
    GROUP BY steps_version, step ORDER BY steps_version, step`,

  "Dwell per step (ms, from the NEXT view's prevStepMs)": `
    SELECT toInt64(coalesce(properties.stepsVersion, 1)) AS steps_version,
           toInt64(properties.prevStep) AS step,
           count() AS samples,
           round(quantile(0.5)(toFloat(properties.prevStepMs))) AS median_ms,
           round(quantile(0.9)(toFloat(properties.prevStepMs))) AS p90_ms
    FROM events
    WHERE event = 'lesson_step_viewed'
      AND properties.prevStep IS NOT NULL AND ${SCOPE}
    GROUP BY steps_version, step ORDER BY steps_version, step`,

  "Honest narrative skip rate (the >40% rule)": `
    SELECT countIf(event = 'script_skipped') AS skips,
           countIf(event = 'script_skipped' AND properties.via = 'button') AS via_button,
           countIf(event = 'script_skipped' AND properties.via = 'continue') AS via_continue,
           countIf(event = 'script_skipped' AND properties.via = 'auto') AS via_auto,
           countIf(event = 'script_finished' AND properties.run = 'auto') AS finished,
           round(100 * countIf(event = 'script_skipped')
             / greatest(1, countIf(event = 'script_skipped')
               + countIf(event = 'script_finished' AND properties.run = 'auto')), 1) AS skip_rate_pct
    FROM events
    WHERE event IN ('script_skipped', 'script_finished')
      AND properties.worldId = 'deep-orbit'
      AND timestamp >= toDateTime('${SINCE} 00:00:00')`,

  "Lesson start/complete (module 1)": `
    SELECT countIf(event = 'lesson_started') AS starts,
           countIf(event = 'lesson_completed') AS completions,
           count(DISTINCT if(event = 'lesson_started', person_id, NULL)) AS people_started,
           count(DISTINCT if(event = 'lesson_completed', person_id, NULL)) AS people_completed,
           round(quantile(0.5)(if(event = 'lesson_completed',
             toFloat(properties.durationMs), NULL)) / 60000, 1) AS median_completion_minutes
    FROM events
    WHERE event IN ('lesson_started', 'lesson_completed') AND ${SCOPE}`,

  "Exercise attempts (module 1 lessons only)": `
    SELECT count() AS attempts,
           countIf(toString(properties.passed) = 'true') AS passes,
           countIf(toString(properties.errored) = 'true') AS crashed_or_timed_out,
           round(quantile(0.5)(toFloat(properties.durationMs)) / 60000, 1) AS median_minutes_to_attempt
    FROM events
    WHERE event = 'exercise_attempted'
      AND properties.worldId = 'deep-orbit'
      AND properties.lessonId IN ${M1_LESSONS}
      AND timestamp >= toDateTime('${SINCE} 00:00:00')`,

  "Paywall to purchase (payments here are CONSENT-GATED; take the real payment count from Stripe/purchases per the template)": `
    SELECT countIf(event = 'paywall_hit') AS paywall_hits,
           count(DISTINCT if(event = 'paywall_hit', person_id, NULL)) AS people_hit,
           countIf(event = 'checkout_started') AS checkouts,
           countIf(event = 'payment_completed') AS payments_consented_only
    FROM events
    WHERE event IN ('paywall_hit', 'checkout_started', 'payment_completed')
      AND timestamp >= toDateTime('${SINCE} 00:00:00')`,

  "Skip rate + survival inputs BY BRIEFING VARIANT (the launch-with-video holdback read)": `
    SELECT toString(properties.briefingVariant) AS variant,
           countIf(event = 'script_skipped') AS skips,
           countIf(event = 'script_finished' AND properties.run = 'auto') AS finished,
           countIf(event = 'lesson_step_viewed' AND toInt64(properties.step) = 0
             AND toString(properties.revisit) = 'false') AS step0_first_views,
           countIf(event = 'lesson_step_viewed' AND toInt64(properties.step) = 1
             AND toString(properties.revisit) = 'false') AS step1_first_views
    FROM events
    WHERE event IN ('script_skipped', 'script_finished', 'lesson_step_viewed')
      AND properties.worldId = 'deep-orbit'
      AND timestamp >= toDateTime('${SINCE} 00:00:00')
    GROUP BY variant ORDER BY variant`,

  "Clip playback (clip-variant browsers only)": `
    SELECT countIf(event = 'scene_clip_played' AND properties.trigger = 'auto') AS auto_plays,
           countIf(event = 'scene_clip_played' AND properties.trigger = 'manual') AS manual_plays,
           countIf(event = 'scene_clip_completed') AS completions,
           round(quantile(0.5)(if(event = 'scene_clip_completed',
             toFloat(properties.watchedMs), NULL)) / 1000, 1) AS median_watched_s
    FROM events
    WHERE event IN ('scene_clip_played', 'scene_clip_completed')
      AND properties.worldId = 'deep-orbit'
      AND timestamp >= toDateTime('${SINCE} 00:00:00')`,

  "Consent numerator": `
    SELECT count() AS consent_granted,
           count(DISTINCT person_id) AS browsers
    FROM events
    WHERE event = 'consent_granted'
      AND timestamp >= toDateTime('${SINCE} 00:00:00')`,
};

async function hogql(query) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json();
}

function toMarkdown(title, data) {
  const cols = (data.columns ?? []).map(String);
  const rows = data.results ?? [];
  const lines = [
    `### ${title}`,
    "",
    `| ${cols.join(" | ")} |`,
    `| ${cols.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map((v) => String(v ?? "")).join(" | ")} |`),
    "",
  ];
  return lines.join("\n");
}

console.log(`# Module-1 baseline pull (since ${SINCE})\n`);
console.log(
  `Captured ${new Date().toISOString()} from project ${PROJECT} on ${HOST}.\n`,
);
for (const [title, query] of Object.entries(QUERIES)) {
  try {
    const data = await hogql(query);
    console.log(toMarkdown(title, data));
  } catch (err) {
    console.log(`### ${title}\n\nFAILED: ${err.message}\n`);
    process.exitCode = 1;
  }
}
console.log(
  "Remember: the earned-pass rate and hint dependency come from Supabase\n" +
    "(solution_viewed lives only there); run the SQL in the template doc.\n" +
    "Coverage caveat: every number above covers only consented browsers.",
);
