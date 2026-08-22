import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Guards the Vercel deploy gate in the repo-root vercel.json (see
 * docs/migration-runbook.md, "Deploy gating").
 *
 * The Vercel project's Root Directory is apps/web. Vercel reads the
 * repo-root vercel.json but executes its ignoreCommand with apps/web as
 * the working directory, and for an ignoreCommand exit 0 means SKIP the
 * deploy. Node exits 1 when its entry module is missing, the same code
 * the wrapper reads as "drift detected", so a wrong script path cancels
 * every production deploy while looking like a working gate. That is not
 * hypothetical: from 2026-08-22 to 2026-08-23 a repo-root-relative path
 * silently skipped three production pushes.
 *
 * Lives here (not in a per-app suite) because this package's __tests__
 * dir hosts the cross-cutting repo gates that CI's plain `pnpm test`
 * picks up.
 */

// Mirror of the Vercel project setting (dashboard, not in the repo).
// If the Root Directory ever changes, update this constant and the
// script path in vercel.json together.
const VERCEL_ROOT_DIRECTORY = "apps/web";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
}).trim();

const vercelJson = JSON.parse(readFileSync(join(root, "vercel.json"), "utf-8"));
const ignoreCommand: string = vercelJson.ignoreCommand;

describe("vercel.json ignoreCommand (migration deploy gate)", () => {
  it("has an ignoreCommand (the gate exists at all)", () => {
    expect(ignoreCommand).toBeTruthy();
  });

  it("references only scripts that exist relative to the Vercel Root Directory", () => {
    const scriptPaths = [...ignoreCommand.matchAll(/node\s+(\S+\.mjs)/g)].map(
      (m) => m[1],
    );
    expect(scriptPaths.length).toBeGreaterThan(0);
    for (const p of scriptPaths) {
      const resolved = join(root, VERCEL_ROOT_DIRECTORY, p);
      expect(
        existsSync(resolved),
        `${p} does not exist from ${VERCEL_ROOT_DIRECTORY}/ (resolved: ${resolved}); ` +
          `Vercel runs the ignoreCommand there and a missing module exits 1, ` +
          `which the wrapper treats as drift and SKIPS the deploy`,
      ).toBe(true);
    }
  });

  it("keeps the exit-code inversion: skip ONLY on script exit 1 (drift)", () => {
    // For an ignoreCommand, exit 0 = skip the deploy, non-zero = build.
    // Only the drift code (1) may map to a skip; 0 (in sync) and 2
    // (no creds / error) must fail OPEN and deploy.
    expect(ignoreCommand).toContain(
      "if [ $? -eq 1 ]; then exit 0; else exit 1; fi",
    );
  });

  it("fails open (exit 1 = deploy) when run from the Root Directory without creds", () => {
    // Reproduces Vercel's execution: cwd apps/web, no Supabase env. The
    // script then runs offline (exit 0 locally, exit 2 under CI) and the
    // wrapper must map either to 1 ("go ahead and build"). A broken
    // script path instead exits 1 from node itself, the wrapper flips it
    // to 0, and this assertion catches the deploy-freeze before Vercel
    // does it for real.
    const env = { ...process.env };
    delete env.SUPABASE_URL;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    const result = spawnSync("sh", ["-c", ignoreCommand], {
      cwd: join(root, VERCEL_ROOT_DIRECTORY),
      env,
      encoding: "utf-8",
    });
    expect(
      result.status,
      "ignoreCommand exited 0 (SKIP deploy) in the no-creds case; " +
        "the gate must only skip on genuine drift",
    ).toBe(1);
  });
});
