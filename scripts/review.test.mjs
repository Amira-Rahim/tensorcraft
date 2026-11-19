import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import {
  assertReviewUrl,
  cleanEnvironment,
  forwardMigrations,
  includeReviewPath,
  prepareReviewProject,
  readLessonFixtures,
  reviewDockerHost,
  reviewEnvironment,
  snapshotReviewSource,
} from "./review-lib.mjs";
import {
  REVIEW_USERS,
  seedReviewDatabase,
} from "../packages/supabase/review-seed.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const local = {
  SUPABASE_URL: "http://127.0.0.1:56321",
  SUPABASE_SERVICE_ROLE_KEY: "mock-service-key",
  TENSORCRAFT_REVIEW: "1",
};
const { assertLocalRequest } = createRequire(import.meta.url)(
  "./review-network.cjs",
);

test("seed guard rejects hosted URLs, alternate ports and missing opt-in before any client call", async () => {
  for (const url of [
    "https://real.supabase.co",
    "http://127.0.0.1:54321",
    "http://127.0.0.1:56321@evil.test",
    "http://127.0.0.1.evil.test:56321",
    "http://127.0.0.1:56321/path",
    "http://127.0.0.1:56321/?x=1",
  ]) {
    assert.throws(() => assertReviewUrl(url, "1"));
    await assert.rejects(
      seedReviewDatabase({ ...local, SUPABASE_URL: url }, { client: {} }),
    );
  }
  assert.throws(() => assertReviewUrl(local.SUPABASE_URL, undefined));
  assert.equal(assertReviewUrl(local.SUPABASE_URL, "1"), local.SUPABASE_URL);
});

test("review environment drops inherited service keys, proxies and Node preloads", () => {
  const source = {
    PATH: "/bin",
    HOME: "/test/home",
    SUPABASE_URL: "https://real.supabase.co",
    STRIPE_SECRET_KEY: "sk_live_forbidden",
    POSTHOG_PROJECT_TOKEN: "forbidden",
    NEXT_PUBLIC_SENTRY_DSN: "forbidden",
    NODE_OPTIONS: "--require=bad.cjs",
    HTTPS_PROXY: "https://proxy.test",
    DOCKER_HOST: "tcp://remote.test:2375",
  };
  const env = reviewEnvironment(
    {
      API_URL: local.SUPABASE_URL,
      ANON_KEY: "mock-anon",
      SERVICE_ROLE_KEY: "mock-service",
    },
    source,
  );
  assert.equal(env.STRIPE_SECRET_KEY, "sk_test_tensorcraft_review_placeholder");
  assert.equal(env.SUPABASE_URL, local.SUPABASE_URL);
  assert.equal(env.CORS_ORIGINS, "http://localhost:3100");
  assert.equal(env.DOCKER_HOST, "unix:///var/run/docker.sock");
  for (const name of [
    "NODE_OPTIONS",
    "HTTPS_PROXY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "POSTHOG_PROJECT_TOKEN",
  ])
    assert.equal(env[name], undefined);
  assert.equal(cleanEnvironment(source).SUPABASE_URL, undefined);
  assert.throws(() =>
    reviewEnvironment({
      API_URL: "https://remote.test",
      ANON_KEY: "x",
      SERVICE_ROLE_KEY: "y",
    }),
  );
  assert.throws(() => reviewEnvironment({ API_URL: local.SUPABASE_URL }));
});

test("evaluation saving requires an explicit local review opt-in", () => {
  assert.equal(
    cleanEnvironment({}).NEXT_PUBLIC_EVALUATION_SAVES_ENABLED,
    "false",
  );
  assert.equal(
    cleanEnvironment({ NEXT_PUBLIC_EVALUATION_SAVES_ENABLED: "true" })
      .NEXT_PUBLIC_EVALUATION_SAVES_ENABLED,
    "false",
  );
  assert.equal(
    cleanEnvironment({ TENSORCRAFT_REVIEW_EVALUATION_SAVES: "true" })
      .NEXT_PUBLIC_EVALUATION_SAVES_ENABLED,
    "true",
  );
  assert.equal(
    cleanEnvironment({ TENSORCRAFT_REVIEW_EVALUATION_SAVES: "1" })
      .NEXT_PUBLIC_EVALUATION_SAVES_ENABLED,
    "false",
  );
});

test("review Docker selection accepts explicit local sockets and rejects remote engines", () => {
  assert.equal(reviewDockerHost(), "unix:///var/run/docker.sock");
  const socket = "unix:///test/home/.colima/tensorcraft-review/docker.sock";
  assert.equal(reviewDockerHost(socket), socket);
  assert.equal(
    cleanEnvironment({ TENSORCRAFT_REVIEW_DOCKER_HOST: socket }).DOCKER_HOST,
    socket,
  );
  for (const host of [
    "tcp://remote.test:2375",
    "https://remote.test/docker.sock",
    "unix://remote.test/docker.sock",
    "unix:///tmp/docker.sock?remote=1",
    "unix:///tmp/other.sock",
  ]) {
    assert.throws(() => reviewDockerHost(host), /local Unix socket/);
  }
});

test("migration preparation links only forward canonical migrations", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "tensorcraft-review-migrations-"),
  );
  try {
    mkdirSync(join(directory, "supabase"));
    writeFileSync(
      join(directory, "supabase", "review.config.toml"),
      'project_id="test"',
    );
    const source = join(directory, "packages", "supabase", "migrations");
    mkdirSync(source, { recursive: true });
    const names = [
      "001_initial.sql",
      "027_retired.sql",
      "028_retired.sql",
      "066_current.sql",
      "066_current.down.sql",
      "CONVENTIONS.md",
    ];
    for (const name of names) writeFileSync(join(source, name), "select 1;");
    const workdir = prepareReviewProject(directory);
    assert.deepEqual(forwardMigrations(names), [
      "001_initial.sql",
      "066_current.sql",
    ]);
    assert.equal(
      readlinkSync(join(workdir, "supabase", "migrations", "001_initial.sql")),
      "../../../packages/supabase/migrations/001_initial.sql",
    );
    assert.equal(
      existsSync(
        join(workdir, "supabase", "migrations", "066_current.down.sql"),
      ),
      false,
    );
    assert.equal(
      readFileSync(join(source, "027_retired.sql"), "utf8"),
      "select 1;",
    );
    prepareReviewProject(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("source snapshot excludes env and secret files and points workspace imports to the snapshot", () => {
  const directory = mkdtempSync(join(tmpdir(), "tensorcraft-review-snapshot-"));
  try {
    for (const path of [
      "apps/web/node_modules/@tensorcraft",
      "packages/shared",
      "node_modules",
    ])
      mkdirSync(join(directory, path), { recursive: true });
    const files = [
      "package.json",
      "apps/web/package.json",
      "packages/shared/package.json",
      "apps/web/page.ts",
      "apps/web/.env.local",
      "apps/web/server.key",
    ];
    for (const path of files)
      writeFileSync(
        join(directory, path),
        path.endsWith("package.json")
          ? JSON.stringify({
              name: path.startsWith("packages/shared")
                ? "@tensorcraft/shared"
                : "test",
            })
          : "fixture",
      );
    symlinkSync(
      join(directory, "packages/shared"),
      join(directory, "apps/web/node_modules/@tensorcraft/shared"),
    );
    symlinkSync(
      join(directory, "apps/web/.env.local"),
      join(directory, "apps/web/linked-env"),
    );
    const snapshot = snapshotReviewSource(directory, [
      ...files,
      "apps/web/linked-env",
    ]);
    assert.equal(
      readFileSync(join(snapshot, "apps/web/page.ts"), "utf8"),
      "fixture",
    );
    for (const path of [
      "apps/web/.env.local",
      "apps/web/server.key",
      "apps/web/linked-env",
    ])
      assert.equal(existsSync(join(snapshot, path)), false);
    assert.equal(
      readlinkSync(join(snapshot, "apps/web/node_modules/@tensorcraft/shared")),
      join(snapshot, "packages/shared"),
    );
    for (const path of [
      ".env",
      "apps/api/.env.production",
      "supabase/.temp/project-ref",
      ".review/runtime/x",
      ".aws/credentials",
    ])
      assert.equal(includeReviewPath(path), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function mockDatabase() {
  const users = new Map();
  const events = [];
  const writes = [];
  return {
    users,
    events,
    writes,
    client: {
      auth: {
        admin: {
          getUserById: async (id) =>
            users.has(id)
              ? { data: { user: users.get(id) }, error: null }
              : { data: { user: null }, error: { status: 404 } },
          createUser: async (user) => {
            users.set(user.id, user);
            events.push("auth");
            return { data: { user }, error: null };
          },
        },
      },
      from: (table) => ({
        upsert: async (rows, options) => {
          events.push(table);
          writes.push({ table, rows, options });
          return { error: null };
        },
      }),
    },
  };
}

test("seed creates auth identities before profiles and uses current lesson slugs", async () => {
  const db = mockDatabase();
  const counts = await seedReviewDatabase(local, { client: db.client, root });
  assert.deepEqual(db.events.slice(0, 4), ["auth", "auth", "auth", "profiles"]);
  assert.equal(counts.users, 3);
  const profiles = db.writes.find((entry) => entry.table === "profiles").rows;
  assert.ok(
    profiles.every(
      (row) =>
        row.email.endsWith("@example.test") &&
        row.role === "user" &&
        row.weekly_digest === false,
    ),
  );
  const progress = db.writes.find(
    (entry) => entry.table === "world_progress",
  ).rows;
  assert.deepEqual(
    progress.map((row) => row.lesson_id),
    readLessonFixtures(root).map((row) => row.lesson_id),
  );
  assert.ok(
    progress.some((row) => row.lesson_id === "introduction-to-tensors"),
  );
  await seedReviewDatabase(local, { client: db.client, root });
  assert.equal(db.events.filter((event) => event === "auth").length, 3);
  db.users.set(REVIEW_USERS[0].id, { email: "unexpected@example.test" });
  await assert.rejects(
    seedReviewDatabase(local, { client: db.client, root }),
    /unexpected account/,
  );
});

test("API outbound guard blocks remote destinations and URL option overrides", () => {
  assertLocalRequest("http://127.0.0.1:56321/rest/v1/profiles");
  assertLocalRequest({
    hostname: "127.0.0.1",
    port: 56321,
    path: "/auth/v1/user",
  });
  for (const input of [
    "https://api.stripe.com/v1/customers",
    "http://127.0.0.1:9999",
    { hostname: "remote.test", port: 56321 },
    { socketPath: "/tmp/proxy.sock" },
  ])
    assert.throws(() => assertLocalRequest(input), /disabled|blocks/);
  assert.throws(() =>
    assertLocalRequest(local.SUPABASE_URL, { hostname: "remote.test" }),
  );
});

test("preload actually intercepts fetch and HTTP(S) before opening a connection", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--require",
      join(root, "scripts/review-network.cjs"),
      "--input-type=module",
      "-e",
      `
    import http from 'node:http';
    import https from 'node:https';
    import assert from 'node:assert/strict';
    for (const operation of [() => http.get('http://example.test'), () => https.request('https://api.stripe.com'), () => fetch('https://example.test')]) {
      assert.throws(operation, /External service calls are disabled/);
    }
    console.log('blocked');
  `,
    ],
    { env: cleanEnvironment(), encoding: "utf8" },
  );
  assert.equal(output.trim(), "blocked");
});
