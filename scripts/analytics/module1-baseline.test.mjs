import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { buildQueries, main, parseArgs } from "./module1-baseline.mjs";

const run = promisify(execFile);
const script = fileURLToPath(
  new URL("./module1-baseline.mjs", import.meta.url),
);
const dates = ["--since", "2026-11-11", "--until", "2026-11-15"];

test("requires a real explicit UTC window and rejects SQL-bearing input", () => {
  assert.deepEqual(parseArgs([...dates, "--dry-run"]), {
    since: "2026-11-11",
    until: "2026-11-15",
    dryRun: true,
    help: false,
  });
  for (const args of [
    [],
    ["--since", "2026-11-11"],
    ["--until", "2026-11-15"],
    ["--since", "2026-02-30", "--until", "2026-03-01"],
    ["--since", "2026-11-15", "--until", "2026-11-15"],
    ["--since", "2026-11-16", "--until", "2026-11-15"],
    ["--since", "2026-11-11' OR 1=1", "--until", "2026-11-15"],
    [...dates, "--since", "2026-11-12"],
    [...dates, "--unknown"],
  ])
    assert.throws(() => parseArgs(args));
  assert.throws(() =>
    buildQueries({ since: "2026-02-30", until: "2026-03-01" }),
  );
  assert.equal(parseArgs(["--help"]).help, true);
});

test("every query has both UTC timestamp bounds and declared browser/server populations", () => {
  const queries = buildQueries(parseArgs(dates));
  for (const [title, query] of Object.entries(queries)) {
    assert.match(
      query,
      /timestamp >= toDateTime\('2026-11-11 00:00:00', 'UTC'\)/,
      title,
    );
    assert.match(
      query,
      /timestamp < toDateTime\('2026-11-15 00:00:00', 'UTC'\)/,
      title,
    );
    assert.match(query, /\$internal_or_test_user/, title);
    assert.match(query, /verificationOnly/, title);
    assert.match(query, /tc_internal/, title);
    assert.doesNotMatch(query, /2026-09-05/, title);
    if (/Learning population/.test(title)) {
      assert.match(query, /unclassified_marker/);
      assert.match(query, /unclassified_or_nonproduction_host/);
    } else if (/cash evidence|Payment evidence/.test(title)) {
      assert.match(
        query,
        /IN \('', 'tensorcraft.app', 'www.tensorcraft.app'\)/,
      );
      assert.doesNotMatch(query, /tc_internal\), ''\) = 'false'/);
    } else {
      assert.match(query, /tc_internal\), ''\) = 'false'/, title);
      assert.match(
        query,
        /IN \('tensorcraft.app', 'www.tensorcraft.app'\)/,
        title,
      );
    }
  }
  const cash =
    queries["Consented live cash evidence, deduplicated by checkout"];
  assert.match(cash, /eventSource = 'stripe_webhook'/);
  assert.match(cash, /analyticsVersion\) = '2'/);
  assert.match(cash, /livemode\) = 'true'/);
  assert.match(cash, /paymentKind = 'cash'/);
  assert.match(cash, /'cs_live_'/);
  assert.match(
    cash,
    /amountMinor IS NOT NULL AND toFloat\(properties.amountMinor\) > 0/,
  );
  assert.match(cash, /GROUP BY checkout_id/);
  assert.match(
    cash,
    /HAVING count\(DISTINCT lower\(toString\(properties.currency\)\)\) = 1/,
  );
  assert.match(cash, /GROUP BY currency/);
  const intent =
    queries["Browser paid-intent observations, not a conversion rate"];
  assert.doesNotMatch(intent, /payment_completed/);
  assert.match(queries["Narrative skip observations, Module 1"], /nullIf\(/);
  assert.doesNotMatch(
    queries["Narrative skip observations, Module 1"],
    /greatest\(1/,
  );
  assert.match(
    queries["Briefing-variant observations, Module 1"],
    /GROUP BY steps_version, variant/,
  );
});

test("all lesson-specific reports stay within the five free lessons", () => {
  const queries = buildQueries(parseArgs(dates));
  for (const [title, query] of Object.entries(queries)) {
    if (/cash evidence|Payment evidence|paid-intent|consent grants/.test(title))
      continue;
    assert.match(query, /worldId = 'deep-orbit'/, title);
    assert.match(
      query,
      /moduleId = 'foundations' OR properties.lessonId IN/,
      title,
    );
    for (const lesson of [
      "introduction-to-tensors",
      "tensor-shapes",
      "tensor-operations",
      "data-loading",
      "normalization",
    ]) {
      assert.ok(query.includes(`'${lesson}'`), title);
    }
  }
});

test("CLI dry-run works without credentials and never includes an available secret", async () => {
  const { stdout, stderr } = await run(
    process.execPath,
    [script, ...dates, "--dry-run"],
    {
      env: {
        PATH: process.env.PATH,
        POSTHOG_PERSONAL_API_KEY: "do-not-print-this-key",
      },
    },
  );
  assert.equal(stderr, "");
  assert.doesNotMatch(stdout, /do-not-print-this-key/);
  const plan = JSON.parse(stdout);
  assert.equal(plan.window.since, "2026-11-11");
  assert.equal(plan.window.until, "2026-11-15");
  assert.equal(Object.keys(plan.queries).length, 12);
  assert.ok(plan.notes.some((note) => note.includes("Unmarked historical")));
});

test("execution sends only the validated bounded queries and formats unknown values", async (t) => {
  const logs = [];
  const calls = [];
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
  });
  console.log = (message) => logs.push(message);
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        columns: ["observations", "rate"],
        results: [[0, null]],
      }),
    };
  };
  await main(dates, {
    POSTHOG_PERSONAL_API_KEY: "secret",
    POSTHOG_PROJECT_ID: "257980",
  });
  assert.equal(calls.length, 12);
  for (const { url, options } of calls) {
    assert.equal(url, "https://eu.posthog.com/api/projects/257980/query/");
    assert.equal(options.headers.Authorization, "Bearer secret");
    const payload = JSON.parse(options.body);
    assert.equal(payload.query.kind, "HogQLQuery");
    assert.match(payload.query.query, /timestamp </);
  }
  assert.ok(logs.some((line) => line.includes("| 0 | unknown |")));
  assert.ok(logs.every((line) => !line.includes("Bearer secret")));
});

test("invalid execution destinations fail before sending credentials", async () => {
  for (const host of [
    "http://eu.posthog.com",
    "https://secret@eu.posthog.com",
    "https://eu.posthog.com/path",
    "https://eu.posthog.com?token=secret",
  ]) {
    await assert.rejects(
      main(dates, {
        POSTHOG_PERSONAL_API_KEY: "secret",
        POSTHOG_PROJECT_ID: "257980",
        POSTHOG_HOST: host,
      }),
    );
  }
  await assert.rejects(main(dates, { POSTHOG_PROJECT_ID: "257980" }));
});

test("failed API responses expose status without printing provider bodies or keys", async (t) => {
  const logs = [];
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalExit = process.exitCode;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    process.exitCode = originalExit;
  });
  console.log = (message) => logs.push(message);
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    text: () => {
      throw new Error("Never print the provider's private diagnostic body.");
    },
  });
  await main(dates, {
    POSTHOG_PERSONAL_API_KEY: "private-api-key",
    POSTHOG_PROJECT_ID: "257980",
  });
  assert.equal(process.exitCode, 1);
  assert.ok(logs.some((line) => line.includes("PostHog returned HTTP 429.")));
  assert.ok(logs.every((line) => !line.includes("private-api-key")));
  assert.ok(logs.every((line) => !line.includes("private diagnostic body")));
});
