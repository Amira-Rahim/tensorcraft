/** Real RLS tests in a throwaway PostgreSQL cluster. Never reads DATABASE_URL. */
import { spawnSync } from "node:child_process";
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
  console.log("RLS assertions passed.");
} finally {
  if (started) run("pg_ctl", ["-D", data, "-m", "immediate", "-w", "stop"]);
  rmSync(temp, { recursive: true, force: true });
}
