/** Real RLS tests in a throwaway PostgreSQL cluster. Never reads DATABASE_URL. */
import { spawn, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pgBin =
  process.env.PG_BIN ??
  [
    "/opt/homebrew/opt/postgresql@17/bin",
    "/usr/lib/postgresql/17/bin",
    "/usr/lib/postgresql/16/bin",
  ].find((p) => existsSync(join(p, "postgres"))) ??
  "";
const temp = mkdtempSync(join(tmpdir(), "tensorcraft-rls-"));
const data = join(temp, "data");
const env = {
  ...process.env,
  PGHOST: temp,
  PGPORT: "55437",
  PGDATABASE: "postgres",
  PGUSER: "tensorcraft_test",
};
// libpq connection service settings must never redirect a test to a real database.
for (const name of [
  "PGSERVICE",
  "PGSERVICEFILE",
  "PGHOSTADDR",
  "PGPASSWORD",
  "PGPASSFILE",
  "PGOPTIONS",
])
  delete env[name];
let started = false;
function run(command, args, input) {
  const result = spawnSync(pgBin ? join(pgBin, command) : command, args, {
    env,
    input,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `${command}: ${result.error?.message ?? result.stderr ?? result.stdout}`,
    );
  return result.stdout;
}
function sql(input) {
  return run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-q"], input);
}

async function checkConsentRace(userId, firstGranted, expectedRevision) {
  sql(
    `insert into auth.users(id,email) values('${userId}','consent-race@example.test');`,
  );
  function client(applicationName) {
    const child = spawn(
      pgBin ? join(pgBin, "psql") : "psql",
      ["-X", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"],
      { env: { ...env, PGAPPNAME: applicationName }, stdio: "pipe" },
    );
    let output = "";
    let errors = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    const finished = new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve(output) : reject(new Error(errors)),
      );
    });
    // Both clients run while the lock assertions execute. Handle an early
    // rejection here, then surface it when the test awaits completion.
    void finished.catch(() => {});
    return { child, finished, output: () => output };
  }
  const first = client("tensorcraft-consent-race-first");
  const second = client("tensorcraft-consent-race-second");
  const identity = `set role authenticated; set request.jwt.claim.sub='${userId}';`;
  try {
    first.child.stdin.write(
      `begin; ${identity} select * from set_analytics_consent(${firstGranted},0);\n\\echo consent-lock-held\n`,
    );
    for (
      let attempt = 0;
      !first.output().includes("consent-lock-held");
      attempt++
    ) {
      if (attempt >= 100) throw new Error("Consent race setup timed out");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    second.child.stdin.end(
      `${identity} select * from set_analytics_consent(${!firstGranted},0);`,
    );
    let blocked = false;
    for (let attempt = 0; attempt < 100 && !blocked; attempt++) {
      blocked = sql(
        "select exists(select 1 from pg_stat_activity where application_name='tensorcraft-consent-race-second' and wait_event_type='Lock');",
      ).includes(" t");
      if (!blocked) await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (!blocked)
      throw new Error(
        "Concurrent consent choice did not wait for the transaction",
      );
    first.child.stdin.end("commit;");
    await Promise.all([first.finished, second.finished]);
    sql(
      `select test_assert((select not granted and revision=${expectedRevision} from public.analytics_consents where user_id='${userId}'), 'concurrent choices preserve withdrawal');`,
    );
  } finally {
    first.child.kill();
    second.child.kill();
    await Promise.allSettled([first.finished, second.finished]);
  }
}
try {
  run("initdb", [
    "-D",
    data,
    "-U",
    "tensorcraft_test",
    "--auth=trust",
    "--no-locale",
    "--encoding=UTF8",
  ]);
  run("pg_ctl", [
    "-D",
    data,
    "-l",
    join(temp, "postgres.log"),
    "-o",
    `-h '' -k ${temp} -p 55437`,
    "-w",
    "start",
  ]);
  started = true;
  sql(
    readFileSync(join(root, "packages/supabase/tests/bootstrap.sql"), "utf8"),
  );
  const dir = join(root, "packages/supabase/migrations");
  for (const name of readdirSync(dir)
    .filter((name) => /^\d+_.*(?<!\.down)\.sql$/.test(name))
    .sort()) {
    // 033 removed both features. 027 contains an invalid now()-based index;
    // it cannot be replayed on PostgreSQL. Do not rewrite applied history.
    if (/^(027|028)_/.test(name)) {
      console.log(`Skip retired migration ${name} (removed by 033)`);
      continue;
    }
    try {
      sql(readFileSync(join(dir, name), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${name}: ${error.message}`);
    }
  }
  console.log("Applied application migrations to isolated PostgreSQL.");
  console.log(
    sql(readFileSync(join(root, "packages/supabase/tests/rls.sql"), "utf8")),
  );
  console.log(
    sql(
      readFileSync(
        join(root, "packages/supabase/tests/learning-activity.sql"),
        "utf8",
      ),
    ),
  );
  console.log("RLS assertions passed.");
  console.log(
    sql(
      readFileSync(
        join(root, "packages/supabase/tests/analytics-consent.sql"),
        "utf8",
      ),
    ),
  );
  // Reapplying this migration must preserve choices and withdrawn revisions.
  sql(readFileSync(join(dir, "067_analytics_consent.sql"), "utf8"));
  sql(
    "select test_assert((select revision=5 and not granted from public.analytics_consents where user_id='11111111-1111-4111-8111-111111111111'), 'consent migration reapply preserves withdrawal');",
  );
  await checkConsentRace("44444444-4444-4444-8444-444444444444", true, 2);
  await checkConsentRace("55555555-5555-4555-8555-555555555555", false, 1);
  const consentDown = readFileSync(
    join(dir, "067_analytics_consent.down.sql"),
    "utf8",
  );
  sql(consentDown);
  sql(consentDown);
  sql(
    "select test_assert(to_regclass('public.analytics_consents') is null, 'consent rollback removes its table'); select test_assert(not exists(select 1 from public.schema_migrations where version=67), 'consent rollback clears its ledger entry');",
  );
  sql(readFileSync(join(dir, "067_analytics_consent.sql"), "utf8"));
  sql(
    "select test_assert((select count(*)=0 from public.analytics_consents), 'reapply after rollback requires fresh consent');",
  );
  console.log("Analytics consent assertions passed.");
  if (process.argv.includes("--types")) {
    const { PostgresMeta } = await import("@supabase/postgres-meta");
    const { getGeneratorMetadata } =
      await import("@supabase/postgres-meta/dist/lib/generators.js");
    const { generateTypes } = await import("./supabase-typegen.mjs");
    const { writeFileSync } = await import("node:fs");
    const meta = new PostgresMeta({
      host: temp,
      port: 55437,
      user: "tensorcraft_test",
      database: "postgres",
      ssl: false,
      max: 1,
    });
    try {
      const { data: schema, error } = await getGeneratorMetadata(meta, {
        includedSchemas: ["public"],
        excludedSchemas: [],
      });
      if (error) throw new Error(error.message);
      // Test-only helpers are not part of the application schema.
      schema.functions = schema.functions.filter(
        (fn) => !fn.name.startsWith("test_"),
      );
      const generated = await generateTypes(schema, "14.1");
      const filename = join(root, "packages/supabase/src/types.ts");
      const old = readFileSync(filename, "utf8"),
        header = old.slice(0, old.indexOf("export type Json"));
      writeFileSync(
        filename,
        header +
          generated +
          '\nexport type UserRole = Database["public"]["Enums"]["user_role"];\n',
      );
      console.log("Generated types from the isolated migrated schema.");
    } finally {
      await meta.end();
    }
  }
} finally {
  if (started) run("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
  rmSync(temp, { recursive: true, force: true });
}
