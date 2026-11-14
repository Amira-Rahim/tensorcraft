import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "vitest";

describe("public reproduction export", () => {
  it("checks the allowlist, source identity, starter boundary and tamper rejection", () => {
    execFileSync("python3", ["scripts/package-room-evidence.test.py"], {
      cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
      stdio: "pipe",
      timeout: 10_000,
    });
  });
});
