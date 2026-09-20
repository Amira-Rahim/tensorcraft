import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The mid-module catch-up is held back during scene playback by an
// attribute contract spread over three files: the reader stamps it, the
// stylesheet hides it while the scene plays, and the no-JS override puts it
// back for a client that never runs the timeline.
//
// Nothing else catches a break here. jsdom component tests see the
// attribute but never apply globals.css, and every lesson URL the e2e suite
// visits is in the free module, where the catch-up does not render at all,
// so a real browser never exercises it either. Rename the attribute in one
// file and the recap either sits on screen through the whole scene or
// disappears for readers without JavaScript, silently, in both cases only
// on paid module openers.

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../../../../..");
const ATTR = "data-post-scene";

const read = (p: string) => fs.readFileSync(path.join(webRoot, p), "utf8");

describe("post-scene catch-up attribute contract", () => {
  it("is stamped by the Briefing, on the recap and nothing else", () => {
    const reader = read("app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx");
    const stamps = reader.match(new RegExp(`${ATTR}=`, "g")) ?? [];
    expect(stamps).toHaveLength(1);
    // It must not also be a playback beat, or it would reveal mid-scene on
    // the timeline instead of after it.
    expect(reader).not.toMatch(
      new RegExp(`${ATTR}[^>]*data-script-beat|data-script-beat[^>]*${ATTR}`),
    );
  });

  it("is hidden while the scene plays, and only while it plays", () => {
    const css = read("app/globals.css");
    expect(css).toMatch(
      new RegExp(
        `\\[data-script-state="playing"\\]\\s*\\[${ATTR}\\]\\s*\\{\\s*display:\\s*none;`,
      ),
    );
    expect(css).not.toMatch(
      new RegExp(`\\[data-script-state="done"\\]\\s*\\[${ATTR}\\]`),
    );
  });

  it("is restored for a client that never runs JavaScript", () => {
    const noscript = read(
      "app/worlds/[slug]/[module]/[lesson]/noscript-reveal.tsx",
    );
    expect(noscript).toContain(`[${ATTR}] {\n  display: revert !important;`);
    // The override has to cover the idle state too: without JS the reader
    // never leaves it.
    const rule = noscript
      .split("\n")
      .find((line) => line.includes(`[${ATTR}]`));
    expect(rule).toContain('data-script-state="idle"');
    expect(rule).toContain('data-script-state="playing"');
  });
});
