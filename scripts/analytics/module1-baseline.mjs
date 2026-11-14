#!/usr/bin/env node
/**
 * Module 1 reporting for an explicit UTC window and declared populations.
 * Preview without credentials or network access:
 * node scripts/analytics/module1-baseline.mjs --since 2026-11-11 --until 2026-11-15 --dry-run
 * Execution requires POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.
 * POSTHOG_HOST defaults to https://eu.posthog.com.
 * --since is inclusive and --until exclusive, both at midnight UTC.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_HOSTS = "('tensorcraft.app', 'www.tensorcraft.app')";
const M1_LESSONS =
  "('introduction-to-tensors', 'tensor-shapes', 'tensor-operations', 'data-loading', 'normalization')";
const MARKER = "coalesce(toString(properties.tc_internal), '')";
const HOST = "lower(coalesce(toString(properties.$host), ''))";
const PERSON_IS_TEST =
  "coalesce(toString(person.properties.$internal_or_test_user), 'false') = 'true'";
const VERIFICATION =
  "coalesce(toString(properties.verificationOnly), 'false') = 'true'";
const KNOWN_TEST = `(${PERSON_IS_TEST} OR ${VERIFICATION})`;
const PUBLIC_BROWSER = `(${MARKER} = 'false' AND ${HOST} IN ${PUBLIC_HOSTS} AND NOT ${KNOWN_TEST})`;
// Webhooks have no browser host or marker. Preserve them while excluding
// explicit internal/test evidence and explicitly nonproduction hosts.
const SERVER_POPULATION = `(${MARKER} != 'true' AND ${HOST} IN ('', 'tensorcraft.app', 'www.tensorcraft.app') AND NOT ${KNOWN_TEST})`;
const M1 = `properties.worldId = 'deep-orbit' AND (properties.moduleId = 'foundations' OR properties.lessonId IN ${M1_LESSONS})`;

export const USAGE = `Usage: node scripts/analytics/module1-baseline.mjs --since YYYY-MM-DD --until YYYY-MM-DD [--dry-run]
Both dates are required. The UTC window includes --since and excludes --until.
--dry-run prints the query plan without credentials or network requests.
Execution requires POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.
POSTHOG_HOST defaults to https://eu.posthog.com.`;

function validateDate(value, flag) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? ""))
    throw new Error(`${flag} requires YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    date.getUTCFullYear() < 1970
  ) {
    throw new Error(`${flag} requires a valid calendar date from 1970 onward.`);
  }
  return value;
}

export function parseArgs(args) {
  const options = { dryRun: false, help: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error(`Duplicate argument: ${flag}`);
    seen.add(flag);
    if (flag === "--help") options.help = true;
    else if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--since" || flag === "--until")
      options[flag.slice(2)] = validateDate(args[++index], flag);
    else throw new Error(`Unknown argument: ${flag}`);
  }
  if (options.help) return options;
  if (!options.since || !options.until)
    throw new Error("Provide both --since and --until. No date is implicit.");
  if (options.until <= options.since)
    throw new Error("--until must be later than --since.");
  return options;
}

export function buildQueries(options) {
  const since = validateDate(options.since, "--since");
  const until = validateDate(options.until, "--until");
  if (until <= since) throw new Error("--until must be later than --since.");
  const window = `timestamp >= toDateTime('${since} 00:00:00', 'UTC') AND timestamp < toDateTime('${until} 00:00:00', 'UTC')`;
  const browser = `${window} AND ${PUBLIC_BROWSER}`;
  const scope = `${browser} AND ${M1}`;
  const payment = `${window} AND ${SERVER_POPULATION}`;
  const classification = `CASE
      WHEN ${VERIFICATION} THEN 'verification'
      WHEN ${PERSON_IS_TEST} THEN 'known_internal_or_test_person'
      WHEN ${MARKER} = 'true' THEN 'marked_internal'
      WHEN ${MARKER} != 'false' THEN 'unclassified_marker'
      WHEN ${HOST} NOT IN ${PUBLIC_HOSTS} THEN 'unclassified_or_nonproduction_host'
      ELSE 'marked_public_production' END`;
  return {
    "Learning population coverage, Module 1": `
    SELECT ${classification} AS reporting_population, count() AS events
    FROM events WHERE ${window} AND ${M1}
    GROUP BY reporting_population ORDER BY reporting_population`,

    "Step views, first visits by reader version": `
    SELECT toInt64(coalesce(properties.stepsVersion, 1)) AS steps_version,
           toInt64(properties.step) AS step, any(properties.stepName) AS name,
           count() AS views, count(DISTINCT person_id) AS people
    FROM events WHERE event = 'lesson_step_viewed'
      AND toString(properties.revisit) = 'false' AND ${scope}
    GROUP BY steps_version, step ORDER BY steps_version, step`,

    "Dwell samples from the following step view": `
    SELECT toInt64(coalesce(properties.stepsVersion, 1)) AS steps_version,
           toInt64(properties.prevStep) AS step, count() AS samples,
           round(quantile(0.5)(toFloat(properties.prevStepMs))) AS median_ms,
           round(quantile(0.9)(toFloat(properties.prevStepMs))) AS p90_ms
    FROM events WHERE event = 'lesson_step_viewed'
      AND properties.prevStep IS NOT NULL AND properties.prevStepMs IS NOT NULL AND ${scope}
    GROUP BY steps_version, step ORDER BY steps_version, step`,

    "Narrative skip observations, Module 1": `
    SELECT countIf(event = 'script_skipped') AS skips,
           countIf(event = 'script_skipped' AND properties.via = 'button') AS via_button,
           countIf(event = 'script_skipped' AND properties.via = 'continue') AS via_continue,
           countIf(event = 'script_skipped' AND properties.via = 'auto') AS via_auto,
           countIf(event = 'script_finished' AND properties.run = 'auto') AS finished,
           round(100 * countIf(event = 'script_skipped')
             / nullIf(countIf(event = 'script_skipped')
               + countIf(event = 'script_finished' AND properties.run = 'auto'), 0), 1) AS skip_rate_pct
    FROM events WHERE event IN ('script_skipped', 'script_finished') AND ${scope}`,

    "Lesson arrival and completion observations, Module 1": `
    SELECT countIf(event = 'lesson_started') AS starts,
           countIf(event = 'lesson_completed') AS completions,
           count(DISTINCT if(event = 'lesson_started', person_id, NULL)) AS people_started,
           count(DISTINCT if(event = 'lesson_completed', person_id, NULL)) AS people_completed,
           countIf(event = 'lesson_completed' AND properties.durationMs IS NOT NULL) AS duration_samples,
           if(countIf(event = 'lesson_completed' AND properties.durationMs IS NOT NULL) = 0, NULL,
             round(quantile(0.5)(if(event = 'lesson_completed',
               toFloat(properties.durationMs), NULL)) / 60000, 1)) AS median_completion_minutes
    FROM events WHERE event IN ('lesson_started', 'lesson_completed') AND ${scope}`,

    "Exercise graded runs, Module 1": `
    SELECT count() AS attempts,
           countIf(toString(properties.passed) = 'true') AS passes,
           countIf(toString(properties.errored) = 'true') AS crashed_or_timed_out,
           countIf(properties.durationMs IS NOT NULL) AS duration_samples,
           if(countIf(properties.durationMs IS NOT NULL) = 0, NULL,
             round(quantile(0.5)(toFloat(properties.durationMs)) / 60000, 1)) AS median_minutes_to_attempt
    FROM events WHERE event = 'exercise_attempted' AND ${scope}`,

    "Browser paid-intent observations, not a conversion rate": `
    SELECT countIf(event = 'paywall_hit') AS paywall_hits,
           count(DISTINCT if(event = 'paywall_hit', person_id, NULL)) AS people_hit,
           countIf(event = 'checkout_started') AS checkouts
    FROM events WHERE event IN ('paywall_hit', 'checkout_started') AND ${browser}`,

    "Consented live cash evidence, deduplicated by checkout": `
    SELECT currency, count() AS consented_live_cash_checkouts,
           sum(amount_minor) AS observed_amount_minor, sum(captured_events) AS captured_events
    FROM (
      SELECT toString(properties.sessionId) AS checkout_id,
             any(lower(toString(properties.currency))) AS currency,
             any(toFloat(properties.amountMinor)) AS amount_minor, count() AS captured_events
      FROM events WHERE event = 'payment_completed' AND ${payment}
        AND properties.eventSource = 'stripe_webhook'
        AND toString(properties.analyticsVersion) = '2'
        AND toString(properties.livemode) = 'true' AND properties.paymentKind = 'cash'
        AND startsWith(coalesce(toString(properties.sessionId), ''), 'cs_live_')
        AND properties.amountMinor IS NOT NULL AND toFloat(properties.amountMinor) > 0
        AND match(lower(coalesce(toString(properties.currency), '')), '^[a-z]{3}$')
      GROUP BY checkout_id
      HAVING count(DISTINCT lower(toString(properties.currency))) = 1
         AND count(DISTINCT toFloat(properties.amountMinor)) = 1
    ) GROUP BY currency ORDER BY currency`,

    "Payment evidence coverage, not a transaction total": `
    SELECT coalesce(toString(properties.eventSource), 'unknown') AS event_source,
           coalesce(toString(properties.analyticsVersion), 'unknown') AS analytics_version,
           coalesce(toString(properties.livemode), 'unknown') AS livemode,
           coalesce(toString(properties.paymentKind), 'unknown') AS payment_kind, count() AS captured_events
    FROM events WHERE event = 'payment_completed' AND ${payment}
    GROUP BY event_source, analytics_version, livemode, payment_kind
    ORDER BY event_source, analytics_version, livemode, payment_kind`,

    "Briefing-variant observations, Module 1": `
    SELECT toInt64(coalesce(properties.stepsVersion, 1)) AS steps_version,
           coalesce(toString(properties.briefingVariant), 'unknown') AS variant,
           countIf(event = 'script_skipped') AS skips,
           countIf(event = 'script_finished' AND properties.run = 'auto') AS finished,
           countIf(event = 'lesson_step_viewed' AND toInt64(properties.step) = 0
             AND toString(properties.revisit) = 'false') AS step0_first_views,
           countIf(event = 'lesson_step_viewed' AND toInt64(properties.step) = 1
             AND toString(properties.revisit) = 'false') AS step1_first_views
    FROM events WHERE event IN ('script_skipped', 'script_finished', 'lesson_step_viewed') AND ${scope}
    GROUP BY steps_version, variant ORDER BY steps_version, variant`,

    "Clip playback observations, Module 1": `
    SELECT countIf(event = 'scene_clip_played' AND properties.trigger = 'auto') AS auto_plays,
           countIf(event = 'scene_clip_played' AND properties.trigger = 'manual') AS manual_plays,
           countIf(event = 'scene_clip_completed') AS completions,
           countIf(event = 'scene_clip_completed' AND properties.watchedMs IS NOT NULL) AS duration_samples,
           if(countIf(event = 'scene_clip_completed' AND properties.watchedMs IS NOT NULL) = 0, NULL,
             round(quantile(0.5)(if(event = 'scene_clip_completed',
               toFloat(properties.watchedMs), NULL)) / 1000, 1)) AS median_watched_s
    FROM events WHERE event IN ('scene_clip_played', 'scene_clip_completed') AND ${scope}`,

    "Observed consent grants, not an opt-in rate": `
    SELECT count() AS consent_granted, count(DISTINCT person_id) AS people
    FROM events WHERE event = 'consent_granted' AND ${browser}`,
  };
}

export const POPULATION_NOTES = [
  "Browser reports require tc_internal=false, a production host and no positive internal/test person or verification flag. Unmarked historical rows are separate and are not classified as external.",
  "Person-property exclusions follow the project's person-property resolution mode. A false marker does not prove that an owner remembered to mark every browser.",
  "Server payment evidence retains missing browser hosts/markers. It excludes explicit internal/test evidence and requires version 2 live cash settlement fields. Consistent checkout snapshots are deduplicated; conflicting amounts/currencies are excluded pending reconciliation.",
  "Payment evidence here is consent-gated and may be incomplete. Reconcile all payments and refunds with Stripe/purchase records. Amounts use each currency's minor units and are never summed across currencies.",
  "The separate browser and payment tables are not a conversion funnel. Join a supported observed journey before attributing a payment, and keep unknown acquisition separate.",
  "Lesson duration can include time before consent or omit earlier resumed sessions. Graded passes and supplied demo outputs do not establish independent mastery.",
  "A missing denominator is unknown, not zero percent. Earned-pass and solution-view evidence require the Supabase records in docs/audits/module1-baseline-template.md.",
];

function toMarkdown(title, data) {
  const cell = (value) => String(value ?? "unknown").replaceAll("|", "\\|");
  const columns = (data.columns ?? []).map(cell);
  return [
    `### ${title}`,
    "",
    `| ${columns.join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...(data.results ?? []).map((row) => `| ${row.map(cell).join(" | ")} |`),
    "",
  ].join("\n");
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const options = parseArgs(args);
  if (options.help) {
    console.log(USAGE);
    return;
  }
  const queries = buildQueries(options);
  if (options.dryRun) {
    console.log(
      JSON.stringify(
        { window: options, notes: POPULATION_NOTES, queries },
        null,
        2,
      ),
    );
    return;
  }
  const key = env.POSTHOG_PERSONAL_API_KEY;
  const project = env.POSTHOG_PROJECT_ID;
  if (!key || !/^\d+$/.test(project ?? ""))
    throw new Error(
      "Set POSTHOG_PERSONAL_API_KEY and numeric POSTHOG_PROJECT_ID.",
    );
  const host = new URL(env.POSTHOG_HOST ?? "https://eu.posthog.com");
  if (host.protocol !== "https:" || host.username || host.password)
    throw new Error(
      "POSTHOG_HOST must be an HTTPS origin without credentials.",
    );
  if (host.pathname !== "/" || host.search || host.hash)
    throw new Error(
      "POSTHOG_HOST must be an origin without a path, query or fragment.",
    );
  console.log(
    `# Module 1 reporting, ${options.since} inclusive to ${options.until} exclusive (UTC)\n`,
  );
  for (const note of POPULATION_NOTES) console.log(`- ${note}`);
  console.log("");
  for (const [title, query] of Object.entries(queries)) {
    try {
      const response = await fetch(
        `${host.origin}/api/projects/${project}/query/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!response.ok)
        throw new Error(`PostHog returned HTTP ${response.status}.`);
      console.log(toMarkdown(title, await response.json()));
    } catch (error) {
      // Avoid printing provider response bodies or credential-bearing URLs.
      const failure =
        error.name === "TimeoutError"
          ? "Request timed out."
          : /^PostHog returned HTTP \d{3}\.$/.test(error.message)
            ? error.message
            : "Query did not complete. Check the PostHog query editor.";
      console.log(`### ${title}\n\nFAILED: ${failure}\n`);
      process.exitCode = 1;
    }
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
