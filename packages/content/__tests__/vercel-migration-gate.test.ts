import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Guards the Vercel migration deploy gate in apps/web/vercel.json (see
 * docs/migration-runbook.md, "Deploy gating").
 *
 * The Vercel project's Root Directory is apps/web, so Vercel reads that
 * directory's vercel.json and starts its buildCommand there. The command
 * moves to the repo root, runs scripts/migration-status.mjs with CI=1, and
 * only then starts the Turbo build. With CI=1 the script exits 2 when the
 * Supabase credentials are missing and 1 on ledger drift; the `&&` chain
 * turns either into a failed build. This form replaced a repo-root
 * ignoreCommand on 2026-09-19 (docs/audits/learning-product-release-2026-09-19.md).
 * The old form had two traps this file pins against reappearing: inverted
 * exit codes (for an ignoreCommand, exit 0 meant skip) and a script path that
 * resolved from the wrong directory, which canceled every production deploy
 * from 2026-08-22 to 2026-08-23.
 *
 * Verified live: the 2026-09-19 production build log echoes this exact
 * command and prints "applied (ledger): 65" and "IN SYNC".
 *
 * Lives here (not in a per-app suite) because this package's __tests__ dir
 * hosts the cross-cutting repo gates that CI's plain `pnpm test` picks up.
 */

// Mirror of the Vercel project setting (dashboard, not in the repo). If the
// Root Directory ever changes, update this constant and the leading `cd` in
// the buildCommand together.
const VERCEL_ROOT_DIRECTORY = "apps/web";
const GATE_SCRIPT = "scripts/migration-status.mjs";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8",
}).trim();

const vercelJsonPath = join(root, VERCEL_ROOT_DIRECTORY, "vercel.json");
const vercelJson = JSON.parse(readFileSync(vercelJsonPath, "utf-8"));
const buildCommand: string = vercelJson.buildCommand;

/**
 * The buildCommand up to and including the gate script. Tests execute this
 * part and never the Turbo build that follows it.
 */
function gatePortion(command: string): string {
  const at = command.indexOf(GATE_SCRIPT);
  return at === -1 ? "" : command.slice(0, at + GATE_SCRIPT.length);
}

describe("apps/web/vercel.json buildCommand (migration deploy gate)", () => {
  it("has a buildCommand that runs the gate script (the gate exists at all)", () => {
    expect(buildCommand).toBeTruthy();
    expect(buildCommand).toContain(`node ${GATE_SCRIPT}`);
  });

  it("keeps the gate in one place: no ignoreCommand and no repo-root vercel.json", () => {
    // The fail-open ignoreCommand form was retired on 2026-09-19. A second
    // config file would split the gate across two locations, and the
    // deployment guide records that this project does not apply a repo-root
    // vercel.json, so a gate placed there is a silent no-op.
    expect(vercelJson.ignoreCommand).toBeUndefined();
    expect(
      existsSync(join(root, "vercel.json")),
      "repo-root vercel.json exists; the deploy gate lives in apps/web/vercel.json only",
    ).toBe(false);
  });

  it("runs the gate with CI=1 and chains it to the build with &&", () => {
    // CI=1 is what makes missing credentials exit 2 instead of 0; without it
    // a Vercel environment that lost the Supabase vars would build blind.
    // `&&` is what makes a non-zero exit stop the build; a `;` would run the
    // gate for show and build anyway.
    expect(buildCommand).toMatch(
      /CI=1\s+node\s+scripts\/migration-status\.mjs\s*&&/,
    );
    expect(buildCommand.indexOf(GATE_SCRIPT)).toBeLessThan(
      buildCommand.indexOf("turbo build"),
    );
  });

  it("references a gate script that exists from the directory the command runs in", () => {
    // Vercel starts the buildCommand in the Root Directory. The leading `cd`
    // decides where the script path resolves. A path that resolves nowhere
    // makes node exit 1 with "Cannot find module", which the && chain treats
    // as a failed build, so a typo here freezes deploys until someone reads
    // the log.
    const cd = /^\s*cd\s+(\S+)\s*&&/.exec(buildCommand);
    const cwd = cd
      ? join(root, VERCEL_ROOT_DIRECTORY, cd[1])
      : join(root, VERCEL_ROOT_DIRECTORY);
    const resolved = join(cwd, GATE_SCRIPT);
    expect(
      existsSync(resolved),
      `${GATE_SCRIPT} does not exist from ${cwd}; Vercel would fail every build with "Cannot find module"`,
    ).toBe(true);
  });

  it("fails closed: without credentials the gate exits 2 and the build never starts", () => {
    // Reproduces Vercel's execution with the Supabase env removed: cwd is the
    // Root Directory and only the gate portion runs, never Turbo. CI is
    // removed from the environment as well, so the command itself has to set
    // it. The script must actually run (it prints OFFLINE) and exit 2 through
    // the CI branch. Exit 1 here would mean "Cannot find module", the path
    // bug from 2026-08-22; exit 0 would mean CI=1 is missing and a credential
    // loss on Vercel would deploy unchecked.
    const gate = gatePortion(buildCommand);
    expect(gate).toContain(GATE_SCRIPT);
    expect(gate).not.toContain("turbo");

    const env = { ...process.env };
    delete env.SUPABASE_URL;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.CI;
    const result = spawnSync("sh", ["-c", gate], {
      cwd: join(root, VERCEL_ROOT_DIRECTORY),
      env,
      encoding: "utf-8",
    });
    expect(result.stdout + result.stderr).toContain("OFFLINE");
    expect(
      result.status,
      "gate did not exit 2 in the no-credentials case; the build must stop, not continue blind",
    ).toBe(2);
  });
});
