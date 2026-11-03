import { execFile, spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  cleanEnvironment,
  prepareReviewProject,
  reviewEnvironment,
  snapshotReviewSource,
  WEB_URL,
} from "./review-lib.mjs";
import { seedReviewDatabase } from "../packages/supabase/review-seed.mjs";

const exec = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const review = join(root, ".review");
const env = cleanEnvironment();
const command = process.argv[2];
const allowed = ["prepare", "dev", "stop", "snapshot"];
if (!allowed.includes(command) || process.argv.length !== 3) {
  console.error("Usage: node scripts/review.mjs prepare|dev|stop|snapshot");
  process.exit(1);
}

async function run(binary, args, cwd = root, childEnv = env) {
  try {
    return await exec(binary, args, {
      cwd,
      env: childEnv,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    // Supabase output may include generated keys. Keep it out of terminal logs.
    if (binary === "supabase")
      throw new Error(
        `Local Supabase ${args[0]} failed. Check Docker and the review configuration. No remote commands were run.`,
      );
    throw new Error(`${binary} failed: ${error.stderr || error.message}`);
  }
}

async function dockerReady() {
  try {
    await run("docker", ["info", "--format", "{{.ServerVersion}}"]);
  } catch {
    throw new Error(
      "Start a local Docker-compatible engine. For another local socket, set TENSORCRAFT_REVIEW_DOCKER_HOST=unix:///absolute/path/to/docker.sock. No review database has been contacted.",
    );
  }
  const { stdout } = await run("supabase", ["--version"]);
  const version = stdout.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!version || Number(version[1]) !== 2 || Number(version[2]) < 117) {
    throw new Error(
      "Review setup requires Supabase CLI 2.117.0 or a later 2.x release.",
    );
  }
}

async function status() {
  const { stdout } = await run("supabase", [
    "status",
    "--workdir",
    review,
    "-o",
    "json",
  ]);
  return reviewEnvironment(JSON.parse(stdout));
}

async function snapshot() {
  const { stdout } = await run("git", [
    "ls-files",
    "-z",
    "--cached",
    "--others",
    "--exclude-standard",
  ]);
  const runtime = snapshotReviewSource(
    root,
    stdout.split("\0").filter(Boolean),
  );
  console.log("Building course content in the review source snapshot...");
  await run("pnpm", [
    "--dir",
    join(runtime, "packages", "content"),
    "build:content",
  ]);
  return runtime;
}

async function assertFreePort(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", () =>
      reject(new Error(`Review port ${port} is already in use.`)),
    );
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

async function dev() {
  await dockerReady();
  if (!existsSync(join(review, "supabase", "config.toml")))
    throw new Error("Run pnpm review:prepare first.");
  const childEnv = await status();
  await Promise.all([assertFreePort(3100), assertFreePort(3101)]);
  const runtime = await snapshot();
  const children = [];
  let stopping = false;
  let failed = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (child.exitCode === null) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          /* Already exited. */
        }
      }
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const start = (cwd, args, api = false) => {
    const processEnv = api
      ? {
          ...childEnv,
          NODE_OPTIONS: `--require=${JSON.stringify(join(runtime, "scripts", "review-network.cjs"))}`,
        }
      : childEnv;
    const child = spawn("pnpm", args, {
      cwd,
      env: processEnv,
      stdio: "inherit",
      detached: true,
    });
    children.push(child);
    return new Promise((resolve, reject) => {
      child.once("error", (error) => {
        failed = true;
        stop();
        reject(error);
      });
      child.once("exit", (code) => {
        if (!stopping && code !== 0) failed = true;
        stop();
        resolve();
      });
    });
  };
  console.log(`Review website: ${WEB_URL}`);
  console.log(
    "Mock sign-in inbox: http://127.0.0.1:56324. Sign in with alex@example.test.",
  );
  console.log(
    "Checkout, OAuth and external integrations have no credentials in review mode.",
  );
  await Promise.all([
    start(join(runtime, "apps", "api"), ["exec", "tsx", "src/index.ts"], true),
    start(join(runtime, "apps", "web"), [
      "exec",
      "next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3100",
    ]),
  ]);
  if (failed)
    throw new Error(
      "A review server exited. Supabase remains available until pnpm review:stop.",
    );
}

mkdirSync(review, { recursive: true });
const lock = join(review, "runner.lock");
let locked = false;
try {
  try {
    closeSync(openSync(lock, "wx"));
    locked = true;
  } catch {
    throw new Error(
      "Another review command is running. If it stopped unexpectedly, remove .review/runner.lock and retry.",
    );
  }
  if (command === "snapshot") {
    await snapshot();
    console.log(
      "Review source snapshot ready in .review/runtime. Existing environment files were excluded.",
    );
  } else if (command === "prepare") {
    await dockerReady();
    prepareReviewProject(root);
    console.log("Starting the isolated local Supabase review stack...");
    await run("supabase", ["start", "--workdir", review]);
    await run("supabase", ["migration", "up", "--local", "--workdir", review]);
    const counts = await seedReviewDatabase(await status());
    console.log(
      `Mock data ready: ${counts.users} users, ${counts.progress} lesson records, ${counts.purchases} purchase.`,
    );
    console.log("Run pnpm review:dev. Supabase Studio: http://127.0.0.1:56323");
  } else if (command === "dev") {
    await dev();
  } else {
    await dockerReady();
    if (!existsSync(join(review, "supabase", "config.toml")))
      throw new Error("No local review stack has been prepared.");
    await run("supabase", ["stop", "--workdir", review]);
    console.log(
      "Stopped the TensorCraft review stack. Its mock database is preserved locally.",
    );
  }
} catch (error) {
  console.error(`[review] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (locked) unlinkSync(lock);
}
