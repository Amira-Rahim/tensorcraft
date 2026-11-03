import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

export const REVIEW_URL = "http://127.0.0.1:56321";
// Next's local auth callback uses localhost as its origin. Keep the browser
// and callback on that same host so session cookies survive the redirect.
export const WEB_URL = "http://localhost:3100";
export const API_URL = "http://127.0.0.1:3101";

export function assertReviewUrl(value, enabled) {
  if (enabled !== "1") {
    throw new Error(
      "Set TENSORCRAFT_REVIEW=1 to seed the isolated local review database.",
    );
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Review requires the local Supabase URL on port 56321.");
  }
  if (
    url.origin !== REVIEW_URL ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Review refuses databases outside http://127.0.0.1:56321.");
  }
  return url.origin;
}

// A fresh child environment prevents shell credentials, proxies and Node
// preload options from leaking into the review process.
export function cleanEnvironment(source = process.env) {
  const env = {};
  for (const key of [
    "PATH",
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "TERM",
    "SYSTEMROOT",
    "ComSpec",
  ]) {
    if (source[key]) env[key] = source[key];
  }
  return {
    ...env,
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
    DO_NOT_TRACK: "1",
    DOCKER_HOST: reviewDockerHost(source.TENSORCRAFT_REVIEW_DOCKER_HOST),
    TENSORCRAFT_REVIEW: "1",
    NEXT_PUBLIC_TENSORCRAFT_REVIEW: "1",
  };
}

export function reviewDockerHost(value) {
  if (!value) return "unix:///var/run/docker.sock";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Review Docker host must be a local Unix socket URL.");
  }
  if (
    url.protocol !== "unix:" ||
    url.hostname ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith("/") ||
    !url.pathname.endsWith("/docker.sock")
  ) {
    throw new Error("Review Docker host must be a local Unix socket URL.");
  }
  return `unix://${url.pathname}`;
}

export function reviewEnvironment(status, source = process.env) {
  assertReviewUrl(status.API_URL, "1");
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
    throw new Error(
      "Local Supabase status did not return its anon and service-role keys.",
    );
  }
  return {
    ...cleanEnvironment(source),
    SUPABASE_URL: REVIEW_URL,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: REVIEW_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    NEXT_PUBLIC_API_URL: API_URL,
    API_URL,
    APP_URL: WEB_URL,
    CORS_ORIGINS: WEB_URL,
    PORT: "3101",
    // Startup requires these variables. These placeholders cannot authenticate
    // with Stripe. Seeded purchase rows provide course access for review.
    STRIPE_SECRET_KEY: "sk_test_tensorcraft_review_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_tensorcraft_review_placeholder",
    CERT_SIGNING_SECRET: "tensorcraft-local-review-certificates-only",
  };
}

export function forwardMigrations(names) {
  return (
    names
      .filter(
        (name) => /^\d+_.+\.sql$/.test(name) && !name.endsWith(".down.sql"),
      )
      // Same fresh-database exception as scripts/test-rls.mjs. Migration 027
      // contains a non-immutable index predicate. Migration 033 removes 027/028.
      .filter((name) => !/^(027|028)_/.test(name))
      .sort()
  );
}

export function prepareReviewProject(root) {
  const target = join(root, ".review", "supabase");
  mkdirSync(target, { recursive: true });
  copyFileSync(
    join(root, "supabase", "review.config.toml"),
    join(target, "config.toml"),
  );
  const migrations = join(target, "migrations");
  rmSync(migrations, { recursive: true, force: true });
  mkdirSync(migrations);
  const source = join(root, "packages", "supabase", "migrations");
  for (const name of forwardMigrations(readdirSync(source))) {
    symlinkSync(
      relative(migrations, join(source, name)),
      join(migrations, name),
    );
  }
  return dirname(target);
}

const excludedNames = new Set([
  ".git",
  ".review",
  ".next",
  ".turbo",
  ".temp",
  ".superpowers",
  ".claude",
  ".codex",
  ".aws",
  ".ssh",
  ".vercel",
  ".DS_Store",
  "node_modules",
  "dist",
  "test-results",
  "playwright-report",
  "learning-study-private",
  "art-src",
]);

export function includeReviewPath(path) {
  return path
    .split(/[\\/]/)
    .every(
      (name) =>
        !excludedNames.has(name) &&
        !name.startsWith(".env") &&
        !/\.(pem|key|p12|pfx|tsbuildinfo)$/.test(name),
    );
}

// Next automatically loads .env files from its app directory. Run a snapshot
// that contains source files and dependency links but no environment files.
export function snapshotReviewSource(root, files) {
  const target = join(root, ".review", "runtime");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  for (const path of files) {
    if (!includeReviewPath(path)) continue;
    const source = resolve(root, path);
    if (!source.startsWith(`${resolve(root)}${sep}`))
      throw new Error("Invalid source path.");
    if (!existsSync(source)) continue;
    // Never follow a tracked link into machine-local state or credentials.
    if (!lstatSync(source).isFile()) continue;
    const destination = join(target, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }
  const packages = [
    "",
    ...["apps", "packages"].flatMap((group) =>
      readdirSync(join(root, group), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(group, entry.name)),
    ),
  ];
  for (const path of packages) {
    const source = join(root, path, "node_modules");
    const destination = join(target, path, "node_modules");
    if (!existsSync(source) || !existsSync(dirname(destination))) continue;
    mkdirSync(destination);
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (!entry.name.startsWith("@")) {
        symlinkSync(join(source, entry.name), join(destination, entry.name));
        continue;
      }
      mkdirSync(join(destination, entry.name));
      for (const name of readdirSync(join(source, entry.name))) {
        const dependency =
          entry.name === "@tensorcraft"
            ? packages.find((path) => {
                const manifest = join(target, path, "package.json");
                return (
                  existsSync(manifest) &&
                  JSON.parse(readFileSync(manifest, "utf8")).name ===
                    `${entry.name}/${name}`
                );
              })
            : undefined;
        symlinkSync(
          dependency === undefined
            ? join(source, entry.name, name)
            : join(target, dependency),
          join(destination, entry.name, name),
          "dir",
        );
      }
    }
  }
  return target;
}

export function readLessonFixtures(root) {
  const world = "deep-orbit";
  return ["foundations", "neural-networks"].flatMap((module) => {
    const directory = join(
      root,
      "packages",
      "content",
      "content",
      world,
      module,
    );
    return readdirSync(directory)
      .filter((name) => name.endsWith(".mdx"))
      .sort()
      .map((name) => {
        const source = readFileSync(join(directory, name), "utf8");
        const slug = source.match(/^slug:\s*["']?([^\s"']+)/m)?.[1];
        if (!slug)
          throw new Error(
            `Missing lesson slug in ${basename(directory)}/${name}.`,
          );
        return { world_id: world, module_id: module, lesson_id: slug };
      });
  });
}
