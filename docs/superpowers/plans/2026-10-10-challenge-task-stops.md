# Challenge Task Stops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the lesson 1 Challenge brief ("Complete two lines") with the approved "Tab stops" design: a brief at the head of the editor column whose Line keys select each `null`, framed placeholders and marked line numbers in the editor, and help in the editor footer.

**Architecture:** A pure scanner in `packages/shared` finds each step's declaration in code. The velite build uses it to stamp build-time line numbers on `taskBrief.steps`, and a CodeMirror StateField in `packages/ui` uses it on every edit to draw the marks and publish live stop states to a small store. The brief component reads that store. In the challenge workspace only, the brief and the hint ladder move from the left reading column into the `Exercise` pane.

**Tech Stack:** TypeScript, React 19, CodeMirror 6 via Sandpack 2.20.0, velite 0.4.0 (bundled Zod 3), Zod, Vitest (jsdom), Playwright, Turborepo 2.11.4, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-10-challenge-task-stops-design.md`. Visual reference: `docs/design-previews/challenge-task-stops/` (open `mockup.html`; add `?scheme=light`, `?state=typed` or `?hint=1`).

---

## Ground rules for every task

- **Never commit.** `CLAUDE.md` forbids `git add`, `git commit` and `git push` on the owner's behalf. Each checkpoint below stops and hands the listed files to the owner, who commits.
- **Commit groups.** The owner commits in three groups, each green on its own: A (Tasks 1 to 3), B (Tasks 4 to 6), C (Tasks 7 to 12). Inside group C the workspace is incoherent until Task 10 lands, so no checkpoint sits between Tasks 7 and 12.
- **No em dash** (U+2014) anywhere: code, comments, tests, copy. No colored left border on any element.
- **Copy** follows `docs/writing-quality-rubric.md`. Use only the strings this plan gives.
- **Commands run from the repo root** (`/Users/amira.salah/Desktop/tensorcraft`) unless a step says otherwise. Run unit tests with `pnpm exec vitest run <path>`. Read the exit code, not just the tail of the output.
- **Ports 3000 and 3001 belong to the owner's other apps.** Never start, test against or kill anything on them.

## File map

| File | Status | Responsibility |
| --- | --- | --- |
| `packages/shared/src/scan-stops.ts` | Create | Pure scanner: each step's declaration line, state and right-hand side columns |
| `packages/shared/src/scan-stops.test.ts` | Create | Scanner tests |
| `packages/shared/src/index.ts` | Modify | Re-export the scanner |
| `packages/content/src/task-brief-lines.ts` | Create | Build-time lines and validation for `taskBrief.steps` |
| `packages/content/src/task-brief-lines.test.ts` | Create | Its tests, plus a check on the built exercise |
| `packages/content/velite.config.ts` | Modify | `target`/`placeholder` fields, optional `title`/`intro`, the transform |
| `packages/content/src/schemas.ts` | Modify | Mirror the built `taskBrief` shape, including `line` |
| `packages/content/tsconfig.json` | Modify | Drop `rootDir` (it rejects the relatively imported scanner) |
| `turbo.json` | Modify | Hash the scanner as a `build:content` input |
| `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml` | Modify | Targets (Task 3), then the new copy (Task 9) |
| `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` | Modify | The two-rung ladder |
| `packages/content/__tests__/metadata-consistency.test.ts` | Modify | Gate B count pin 56 to 55 |
| `packages/ui/src/mdx/exercise.tsx` | Modify | Types, workspace brief, editor extensions, footer ladder, help group |
| `packages/ui/src/mdx/task-stops.ts` | Create | StateField, marks, store and `useTaskStops` |
| `packages/ui/src/mdx/task-stops.test.ts` | Create | Field, store and hook tests (real CodeMirror under jsdom) |
| `packages/ui/src/mdx/task-stops-brief.tsx` | Create | The brief component and `finishHeading` |
| `packages/ui/src/mdx/task-stops-brief.test.tsx` | Create | Its tests |
| `packages/ui/src/mdx/hint-panel.tsx` | Modify | `useHintLadder`, `HintRungs`, `HintButton`; drop `inline` (Task 8) |
| `packages/ui/src/mdx/hint-panel.test.tsx` | Modify | Split-ladder tests |
| `packages/ui/src/mdx/exercise-brief.tsx` | Modify | Drop the workspace branch |
| `packages/ui/src/mdx/exercise-workspace.test.ts` | Create | Source pins for the pane wiring |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx` | Modify | No left wrapper when `left` is null |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | Modify | Hints into the workspace pane; no lesson-level panel there |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | Modify | Empty left slot in the workspace; hint hook to the pane |
| `apps/web/app/components/lesson-visuals/lesson-visuals.css` | Modify | Brief, editor marks, footer help, brass scope, prose overrides |
| Three test files beside the web files | Modify | Shell, content and steps tests |
| `e2e/challenge-workspace.spec.ts` | Modify | Rewritten workspace contract |
| `e2e/lesson-layout.spec.ts`, `e2e/exercise-run.spec.ts`, `e2e/lesson-continuity.spec.ts`, `e2e/lesson-characters.spec.ts` | Modify | Assertions the new layout and copy change |
| `e2e/editor-drafts.spec.ts` | Modify | Drop a phone toggle the workspace never renders (red on main already) |
| `docs/architecture.md` | Modify | Component rows |
| `docs/post-launch-backlog.md` | Modify | Two findings this change does not fix |

---

## Group A: foundations (no visible change)

### Task 1: The shared scanner

**Files:**
- Create: `packages/shared/src/scan-stops.ts`
- Create: `packages/shared/src/scan-stops.test.ts`
- Modify: `packages/shared/src/index.ts` (append one line at the end)

- [ ] **Step 1: Write the failing test**

Create `packages/shared/src/scan-stops.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scanStops, type StopSpec } from "./scan-stops";

// The editor's text: the BUILT starter of create-a-tensor (tsToJs drops the
// YAML's blank lines).
const STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
];
const STEPS: StopSpec[] = [
  { target: "reading", code: "tf.tensor(streamValues)" },
  { target: "shape", code: "reading.shape" },
];
const replaceLine = (index: number, text: string) =>
  STARTER.map((line, i) => (i === index ? text : line));

describe("scanStops", () => {
  it("finds both starter stops waiting on lines 3 and 4", () => {
    expect(scanStops(STARTER, STEPS)).toEqual([
      { line: 3, state: "waiting", rhsStart: 16, rhsEnd: 20, matches: 1 },
      { line: 4, state: "waiting", rhsStart: 14, rhsEnd: 18, matches: 1 },
    ]);
  });

  it("reads the step's code as typed, ignoring spaces and the semicolon", () => {
    for (const text of [
      "const reading = tf.tensor(streamValues);",
      "const reading=tf.tensor( streamValues )",
      "  let reading = tf.tensor(streamValues) ;",
    ]) {
      expect(scanStops(replaceLine(2, text), STEPS)[0].state, text).toBe(
        "typed",
      );
    }
  });

  it("reads any other right-hand side as other code", () => {
    expect(
      scanStops(
        replaceLine(2, "const reading = tf.tensor1d(streamValues);"),
        STEPS,
      )[0],
    ).toMatchObject({ line: 3, state: "other", matches: 1 });
  });

  it("reports a deleted or commented-out declaration as missing", () => {
    const missing = {
      line: null,
      state: "missing",
      rhsStart: 0,
      rhsEnd: 0,
      matches: 0,
    };
    expect(
      scanStops(replaceLine(2, "// const reading = null;"), STEPS)[0],
    ).toEqual(missing);
    expect(
      scanStops(
        STARTER.filter((_, i) => i !== 2),
        STEPS,
      )[0],
    ).toEqual(missing);
  });

  it("does not take a longer name that starts with the target", () => {
    expect(scanStops(["const readings = null;"], STEPS)[0].state).toBe(
      "missing",
    );
  });

  it("counts every declaration and reports the first", () => {
    expect(
      scanStops([...STARTER, "const reading = null;"], STEPS)[0],
    ).toMatchObject({ line: 3, matches: 2 });
  });

  it("follows the code when lines are inserted above", () => {
    expect(
      scanStops(["// a new first line", ...STARTER], STEPS).map(
        (scan) => scan.line,
      ),
    ).toEqual([4, 5]);
  });

  it("handles empty and one-line inputs", () => {
    expect(scanStops([], STEPS).map((scan) => scan.state)).toEqual([
      "missing",
      "missing",
    ]);
    expect(
      scanStops(["const reading = null;"], STEPS).map((scan) => scan.line),
    ).toEqual([1, null]);
  });

  it("honours a custom placeholder and escapes the target", () => {
    expect(
      scanStops(
        ["let total = 0;"],
        [{ target: "total", code: "sum(xs)", placeholder: "0" }],
      )[0].state,
    ).toBe("waiting");
    expect(
      scanStops(["const $x = null;"], [{ target: "$x", code: "1" }])[0].state,
    ).toBe("waiting");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run packages/shared/src/scan-stops.test.ts`
Expected: FAIL, `Failed to resolve import "./scan-stops"`.

- [ ] **Step 3: Write the scanner**

Create `packages/shared/src/scan-stops.ts`:

```ts
/**
 * Where each step of a challenge brief lives in the learner's code.
 *
 * A step fills one variable (its `target`) whose starter declaration holds
 * a placeholder, `null` by default: `const reading = null;`. This scans code
 * line by line for each target's declaration and reports its state, so the
 * build (packages/content) and the editor (packages/ui) agree on every line
 * number (spec 2026-10-10, sections 4 and 5).
 *
 * Self-contained on purpose. The velite transform imports this file by
 * RELATIVE path, because velite bundles its config with esbuild and leaves
 * bare package imports to Node, which cannot load this package's
 * extensionless re-exports. Keep it free of imports, and use only
 * TypeScript that type erasure can remove.
 */

/** One stop's state (spec 2026-10-10, section 4). */
export type StopState = "waiting" | "other" | "typed" | "missing";

export interface StopSpec {
  /** The variable the step fills, for example `reading`. */
  target: string;
  /** The code the brief shows, for example `tf.tensor(streamValues)`. */
  code: string;
  /** The starter's stand-in value. Defaults to `null`. */
  placeholder?: string;
}

export interface StopScan {
  /** 1-based line of the first declaration of the target, or null. */
  line: number | null;
  state: StopState;
  /** 0-based columns of the right-hand side in that line, end exclusive. */
  rhsStart: number;
  rhsEnd: number;
  /** How many lines declare the target. The build requires exactly one. */
  matches: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whitespace and one trailing semicolon do not change what was typed. */
function squash(code: string): string {
  return code.replace(/\s+/g, "").replace(/;$/, "");
}

export function scanStops(
  lines: readonly string[],
  steps: readonly StopSpec[],
): StopScan[] {
  return steps.map((step) => {
    const declaration = new RegExp(
      `^(\\s*(?:const|let|var)\\s+${escapeRegExp(step.target)}\\s*=\\s*)(.*?)\\s*;?\\s*$`,
    );
    let line: number | null = null;
    let prefix = "";
    let rhs = "";
    let matches = 0;
    for (let index = 0; index < lines.length; index += 1) {
      const match = declaration.exec(lines[index]);
      if (!match) continue;
      matches += 1;
      if (line === null) {
        line = index + 1;
        prefix = match[1];
        rhs = match[2];
      }
    }
    if (line === null) {
      return {
        line: null,
        state: "missing",
        rhsStart: 0,
        rhsEnd: 0,
        matches: 0,
      };
    }
    const written = squash(rhs);
    const state: StopState =
      written === squash(step.placeholder ?? "null")
        ? "waiting"
        : written === squash(step.code)
          ? "typed"
          : "other";
    return {
      line,
      state,
      rhsStart: prefix.length,
      rhsEnd: prefix.length + rhs.length,
      matches,
    };
  });
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm exec vitest run packages/shared/src/scan-stops.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Export it from the package**

Append to the end of `packages/shared/src/index.ts`:

```ts
export * from "./scan-stops";
```

Run: `pnpm --filter @tensorcraft/shared typecheck`
Expected: exit 0, no errors.

### Task 2: Build-time lines for a brief

**Files:**
- Create: `packages/content/src/task-brief-lines.ts`
- Create: `packages/content/src/task-brief-lines.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/content/src/task-brief-lines.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { taskBriefLines } from "./task-brief-lines";

// create-a-tensor's BUILT starter: tsToJs drops the YAML's blank lines.
const BUILT_STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
].join("\n");

const STEPS = [
  {
    title: "Create the tensor",
    instruction: "Set `reading` to:",
    code: "tf.tensor(streamValues)",
    target: "reading",
  },
  {
    title: "Read its shape",
    instruction: "Set `shape` to:",
    code: "reading.shape",
    target: "shape",
  },
];

describe("taskBriefLines (spec 2026-10-10, section 5 item 10)", () => {
  it("adds each step's line in the built starter", () => {
    expect(taskBriefLines(BUILT_STARTER, STEPS)).toEqual({
      ok: true,
      steps: [
        { ...STEPS[0], line: 3 },
        { ...STEPS[1], line: 4 },
      ],
    });
  });

  it("fails a target the starter never declares", () => {
    const result = taskBriefLines(BUILT_STARTER, [
      { ...STEPS[0], target: "readingX" },
    ]);
    expect(result).toEqual({
      ok: false,
      errors: [
        "taskBrief step 1 (readingX): the built starter must declare it exactly once; found 0.",
      ],
    });
  });

  it("fails a target declared twice", () => {
    const result = taskBriefLines(
      `${BUILT_STARTER}\nconst reading = null;`,
      STEPS,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/found 2\.$/);
  });

  it("fails a declaration that no longer holds its placeholder", () => {
    const result = taskBriefLines(
      BUILT_STARTER.replace("const reading = null;", "const reading = 1;"),
      STEPS,
    );
    expect(result).toEqual({
      ok: false,
      errors: [
        "taskBrief step 1 (reading): its starter declaration must hold null.",
      ],
    });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run packages/content/src/task-brief-lines.test.ts`
Expected: FAIL, `Failed to resolve import "./task-brief-lines"`.

- [ ] **Step 3: Write the module**

Create `packages/content/src/task-brief-lines.ts`:

```ts
/**
 * Build-time line numbers for a challenge brief (spec 2026-10-10, section 5
 * item 10). The editor shows the TRANSPILED starter, and tsToJs drops blank
 * lines, so the YAML's own line numbers are wrong. Velite runs this on the
 * built starter and fails the build unless every step's target is declared
 * exactly once, still holding its placeholder.
 */
// Relative on purpose (spec section 5 item 1): velite bundles its config
// with esbuild and leaves bare package imports to Node, which cannot load
// @tensorcraft/shared's extensionless re-exports. A relative import is
// bundled. turbo.json hashes this file for build:content.
import { scanStops, type StopSpec } from "../../shared/src/scan-stops";

export type BriefLines<Step extends StopSpec> =
  | { ok: true; steps: Array<Step & { line: number }> }
  | { ok: false; errors: string[] };

export function taskBriefLines<Step extends StopSpec>(
  starterCode: string,
  steps: readonly Step[],
): BriefLines<Step> {
  const scans = scanStops(starterCode.split("\n"), steps);
  const errors: string[] = [];
  scans.forEach((scan, index) => {
    const { target, placeholder = "null" } = steps[index];
    const name = `taskBrief step ${index + 1} (${target})`;
    if (scan.matches !== 1) {
      errors.push(
        `${name}: the built starter must declare it exactly once; found ${scan.matches}.`,
      );
    } else if (scan.state !== "waiting") {
      errors.push(`${name}: its starter declaration must hold ${placeholder}.`);
    }
  });
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    steps: steps.map((step, index) => ({
      ...step,
      line: scans[index].line as number,
    })),
  };
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `pnpm exec vitest run packages/content/src/task-brief-lines.test.ts`
Expected: PASS, 4 tests.

### Task 3: Targets in the schema, lines in the build

**Files:**
- Modify: `packages/content/velite.config.ts` (imports; the `taskBrief` block at lines 211 to 232; the end of the exercises collection)
- Modify: `packages/content/src/schemas.ts` (the `taskBrief` block from line 106)
- Modify: `packages/content/tsconfig.json`
- Modify: `turbo.json`
- Modify: `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml`
- Modify: `packages/ui/src/mdx/exercise.tsx` (the `ExerciseData.taskBrief` type, lines 81 to 92)
- Modify: `packages/ui/src/mdx/exercise-brief.tsx` (one guard)
- Modify: `packages/content/src/task-brief-lines.test.ts` (one more test)

- [ ] **Step 1: Add the failing build check**

Append inside the `describe` block of `packages/content/src/task-brief-lines.test.ts`, and add the import at the top:

```ts
import { exercises } from "../.velite";
```

```ts
  it("the built create-a-tensor brief carries lines 3 and 4", () => {
    const exercise = exercises.find((e) => e.slug === "create-a-tensor");
    expect(exercise?.taskBrief?.steps.map((step) => step.line)).toEqual([
      3, 4,
    ]);
  });
```

Run: `pnpm exec vitest run packages/content/src/task-brief-lines.test.ts`
Expected: FAIL on the new test (`expected [ undefined, undefined ] to deeply equal [ 3, 4 ]`).

- [ ] **Step 2: Extend the velite schema and add the transform**

In `packages/content/velite.config.ts`, add this import after the existing local imports near the top of the file:

```ts
import { taskBriefLines } from "./src/task-brief-lines";
```

Replace the start of the `taskBrief` block in the exercises collection:

```ts
    taskBrief: s
      .object({
        title: s.string().min(1),
        intro: s.string().min(1),
        steps: s
          .array(
            s.object({
              title: s.string().min(1),
              instruction: s.string().min(1),
              code: s.string().min(1),
              result: s.string().optional(),
            }),
          )
          .min(1),
```

with:

```ts
    taskBrief: s
      .object({
        title: s.string().min(1).optional(),
        intro: s.string().min(1).optional(),
        steps: s
          .array(
            s.object({
              title: s.string().min(1),
              instruction: s.string().min(1),
              code: s.string().min(1),
              result: s.string().optional(),
              // The variable this step fills. The transform below finds its
              // declaration in the built starter (spec 2026-10-10).
              target: s.string().regex(/^[A-Za-z_$][\w$]*$/),
              placeholder: s.string().min(1).optional(),
            }),
          )
          .min(1),
```

Then find the end of the exercises collection, where the `skillAxis` field closes the schema object:

```ts
        "js_integration",
      ])
      .optional(),
  }),
});
```

and replace it with:

```ts
        "js_integration",
      ])
      .optional(),
  })
    // Each brief step's line in the BUILT starter, for the Line keys (spec
    // 2026-10-10, section 5 item 10). A bad target throws. velite 0.4's CLI
    // defaults --strict to false, and that overrides the config's
    // strict: true, so an issue added with ctx.addIssue would only be logged
    // and the build would ship an empty step list.
    .transform((data) => {
      const { taskBrief, ...rest } = data;
      if (!taskBrief) return { ...rest, taskBrief: undefined };
      const lines = taskBriefLines(data.starterCode, taskBrief.steps);
      if (!lines.ok) {
        throw new Error(`${data.slug}: ${lines.errors.join(" ")}`);
      }
      return { ...rest, taskBrief: { ...taskBrief, steps: lines.steps } };
    }),
});
```

If the Edit tool reports the `"js_integration", ... }),\n});` text as not unique, include the preceding `skillAxis: s` line in the match.

- [ ] **Step 3: Mirror the shape in the public schema**

In `packages/content/src/schemas.ts`, replace:

```ts
  taskBrief: z
    .object({
      title: z.string().min(1),
      intro: z.string().min(1),
      steps: z
        .array(
          z.object({
            title: z.string().min(1),
            instruction: z.string().min(1),
            code: z.string().min(1),
            result: z.string().optional(),
          }),
        )
        .min(1),
```

with:

```ts
  taskBrief: z
    .object({
      title: z.string().min(1).optional(),
      intro: z.string().min(1).optional(),
      steps: z
        .array(
          z.object({
            title: z.string().min(1),
            instruction: z.string().min(1),
            code: z.string().min(1),
            result: z.string().optional(),
            target: z.string().regex(/^[A-Za-z_$][\w$]*$/),
            placeholder: z.string().min(1).optional(),
            // Computed by the velite transform from the built starter.
            line: z.number().int().positive(),
          }),
        )
        .min(1),
```

- [ ] **Step 4: Let content's typecheck accept the shared file, and hash it**

In `packages/content/tsconfig.json`, delete this line. The config is `noEmit`, so `rootDir` only adds check TS6059, which the relatively imported scanner trips:

```json
    "rootDir": "./src",
```

In `turbo.json`, change the `build:content` inputs to:

```json
      "inputs": [
        "content/**",
        "src/**",
        "velite.config.ts",
        "package.json",
        "$TURBO_ROOT$/packages/shared/src/scan-stops.ts"
      ]
```

- [ ] **Step 5: Name the targets in the exercise**

In `create-a-tensor.yaml`, add a `target` line to each step and change nothing else yet:

```yaml
  steps:
    - title: "Create the tensor"
      instruction: "Set `reading` to:"
      code: "tf.tensor(streamValues)"
      target: reading
    - title: "Read its shape"
      instruction: "Set `shape` to:"
      code: "reading.shape"
      result: "Expect `[5]`: a list of five readings."
      target: shape
```

- [ ] **Step 6: Widen the UI type so the build output still type-checks**

In `packages/ui/src/mdx/exercise.tsx`, replace the `taskBrief` member of `ExerciseData`:

```ts
  /** Authored steps for a compact workspace; instructions remain the fallback. */
  taskBrief?: {
    title?: string;
    intro?: string;
    steps: Array<{
      title: string;
      instruction: string;
      code: string;
      result?: string;
      /** The variable this step fills; its starter declaration holds `placeholder`. */
      target: string;
      placeholder?: string;
      /** 1-based line of that declaration in the built starter (velite). */
      line: number;
    }>;
    support: string;
    expectedTensor?: { values: number[]; shape: number[] };
  };
```

In `packages/ui/src/mdx/exercise-brief.tsx`, `intro` is now optional, so guard its one use. Replace:

```tsx
          <InstructionText text={task.intro} className="challenge-task-intro" />
```

with:

```tsx
          {task.intro && (
            <InstructionText
              text={task.intro}
              className="challenge-task-intro"
            />
          )}
```

- [ ] **Step 7: Build for real and run the tests**

Run: `pnpm turbo build:content --force`
Expected: exit 0. `--force` matters: without it, a turbo cache hit can pass without building.

Run: `pnpm exec vitest run packages/content/src/task-brief-lines.test.ts packages/content/src/contract.test.ts`
Expected: PASS, including "the built create-a-tensor brief carries lines 3 and 4" and "preserves every exercise".

- [ ] **Step 8: Prove the build gate fails when it should**

Temporarily change `target: reading` to `target: readingX` in the YAML, then run `pnpm turbo build:content --force`.
Expected: the build FAILS with a non-zero exit, and its output names `create-a-tensor: taskBrief step 1 (readingX): the built starter must declare it exactly once; found 0.` If it exits 0 and only logs the message, the transform is calling `ctx.addIssue` instead of throwing; see the comment in Step 2.
Change the YAML back to `target: reading` and run `pnpm turbo build:content --force` again. Expected: exit 0.

- [ ] **Step 9: Typecheck the whole repo**

Run: `pnpm typecheck`
Expected: exit 0 with no errors. It runs several packages' typecheck tasks; report "no errors", not a count.

- [ ] **Step 10: Checkpoint A (owner commits)**

Stop and hand over. Do not run git. Files for commit group A:
`packages/shared/src/scan-stops.ts`, `packages/shared/src/scan-stops.test.ts`, `packages/shared/src/index.ts`, `packages/content/src/task-brief-lines.ts`, `packages/content/src/task-brief-lines.test.ts`, `packages/content/velite.config.ts`, `packages/content/src/schemas.ts`, `packages/content/tsconfig.json`, `turbo.json`, `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml`, `packages/ui/src/mdx/exercise.tsx`, `packages/ui/src/mdx/exercise-brief.tsx`.
Suggested message: `feat(content): build-time task brief lines from a shared scanner`.

---

## Group B: new UI units (built, not yet mounted)

### Task 4: The editor extension, the store and the hook

**Files:**
- Create: `packages/ui/src/mdx/task-stops.ts`
- Create: `packages/ui/src/mdx/task-stops.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/mdx/task-stops.test.ts`:

```ts
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  createTaskStopsStore,
  measureStops,
  taskStops,
  useTaskStops,
  type TaskStep,
} from "./task-stops";

// jsdom has no layout. CodeMirror's measure pass calls Range#getClientRects,
// which jsdom does not implement, and the throw lands in a later animation
// frame as an unhandled error that fails the run (probed 2026-10-10).
beforeAll(() => {
  Range.prototype.getClientRects = () =>
    Object.assign([], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
});

const STARTER = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "// Your work: replace the two nulls.",
  "const reading = null;",
  "const shape = null;",
  "// Supplied: copy the readings into a JavaScript array for Farah.",
  "const values = reading?.arraySync();",
  "// Supplied: release memory after copying the values.",
  "reading?.dispose();",
  "",
].join("\n");
const SOLUTION = [
  "const streamValues = [0.12, 0.94, 0.31, 0.88, 0.47];",
  "const reading = tf.tensor(streamValues);",
  "const shape = reading.shape;",
  "const values = reading.arraySync();",
  "reading?.dispose();",
].join("\n");
const STEPS: TaskStep[] = [
  {
    title: "Create the tensor",
    instruction: "Set `reading` to:",
    code: "tf.tensor(streamValues)",
    target: "reading",
    line: 3,
  },
  {
    title: "Read its shape",
    instruction: "Set `shape` to:",
    code: "reading.shape",
    target: "shape",
    line: 4,
  },
];

const views: EditorView[] = [];
afterEach(() => {
  for (const view of views.splice(0)) view.destroy();
});
function mount(doc: string) {
  const store = createTaskStopsStore(STEPS);
  const view = new EditorView({
    state: EditorState.create({ doc, extensions: [taskStops(STEPS, store)] }),
    parent: document.body,
  });
  views.push(view);
  return { store, view };
}
const docOf = (code: string) => EditorState.create({ doc: code }).doc;

describe("measureStops (spec 2026-10-10, section 4 table)", () => {
  it("frames each waiting null and marks its line", () => {
    const doc = docOf(STARTER);
    const value = measureStops(doc, STEPS);
    const framed: string[] = [];
    value.slots.between(0, doc.length, (from, to) => {
      framed.push(doc.sliceString(from, to));
    });
    const marked: number[] = [];
    value.lines.between(0, doc.length, (from) => {
      marked.push(doc.lineAt(from).number);
    });
    expect(framed).toEqual(["null", "null"]);
    expect(marked).toEqual([3, 4]);
  });

  it("keeps the line mark for other code and drops both marks once typed", () => {
    const doc = docOf(
      STARTER.replace(
        "const reading = null;",
        "const reading = tf.tensor1d(streamValues);",
      ).replace("const shape = null;", "const shape = reading.shape;"),
    );
    const value = measureStops(doc, STEPS);
    expect(value.scans.map((scan) => scan.state)).toEqual(["other", "typed"]);
    expect(value.slots.size).toBe(0);
    const marked: number[] = [];
    value.lines.between(0, doc.length, (from) => {
      marked.push(doc.lineAt(from).number);
    });
    expect(marked).toEqual([3]);
  });
});

describe("taskStops in an editor", () => {
  it("publishes the starter's stops when the view attaches", () => {
    const { store } = mount(STARTER);
    expect(store.getSnapshot().attached).toBe(true);
    expect(store.getSnapshot().scans.map((scan) => scan.line)).toEqual([3, 4]);
  });

  it("recomputes after a whole-document replace, as Reset and Show Solution send", () => {
    const { store, view } = mount(STARTER);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: SOLUTION },
    });
    expect(store.getSnapshot().scans).toMatchObject([
      { line: 2, state: "typed" },
      { line: 3, state: "typed" },
    ]);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: STARTER },
    });
    expect(store.getSnapshot().scans).toMatchObject([
      { line: 3, state: "waiting" },
      { line: 4, state: "waiting" },
    ]);
  });

  it("selects the waiting null and focuses the editor", () => {
    const { store, view } = mount(STARTER);
    store.select(0);
    const { from, to } = view.state.selection.main;
    expect(view.state.sliceDoc(from, to)).toBe("null");
    expect(view.hasFocus).toBe(true);
  });

  it("selects the right-hand side of a typed line", () => {
    const { store, view } = mount(
      STARTER.replace(
        "const reading = null;",
        "const reading = tf.tensor(streamValues);",
      ),
    );
    store.select(0);
    const { from, to } = view.state.selection.main;
    expect(view.state.sliceDoc(from, to)).toBe("tf.tensor(streamValues)");
  });

  it("puts the caret on the build-time line, clamped, when a declaration is missing", () => {
    const { store, view } = mount("// My tensor draft\nconst reading = null;");
    store.select(1);
    const { from, to } = view.state.selection.main;
    expect(from).toBe(to);
    expect(view.state.doc.lineAt(from).number).toBe(2);
  });

  it("detaches only when the view it holds is destroyed", () => {
    const store = createTaskStopsStore(STEPS);
    const make = () =>
      new EditorView({
        state: EditorState.create({
          doc: STARTER,
          extensions: [taskStops(STEPS, store)],
        }),
        parent: document.body,
      });
    const first = make();
    const second = make();
    first.destroy();
    expect(store.getSnapshot().attached).toBe(true);
    second.destroy();
    expect(store.getSnapshot().attached).toBe(false);
  });
});

describe("useTaskStops", () => {
  it("keeps one store and one extension array while the steps stay the same", () => {
    const { result, rerender } = renderHook(
      ({ steps }) => useTaskStops(steps),
      { initialProps: { steps: STEPS } },
    );
    const first = result.current;
    expect(first).not.toBeNull();
    rerender({ steps: STEPS });
    expect(result.current).toBe(first);
    rerender({ steps: [...STEPS] });
    expect(result.current).not.toBe(first);
  });

  it("returns null without steps", () => {
    const { result } = renderHook(() => useTaskStops(undefined));
    expect(result.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run packages/ui/src/mdx/task-stops.test.ts`
Expected: FAIL, `Failed to resolve import "./task-stops"`.

- [ ] **Step 3: Write the module**

Create `packages/ui/src/mdx/task-stops.ts`:

```ts
import { useMemo } from "react";
import {
  EditorSelection,
  RangeSet,
  StateField,
  type Extension,
  type Range,
  type Text,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  GutterMarker,
  ViewPlugin,
  gutterLineClass,
  type DecorationSet,
} from "@codemirror/view";
import { scanStops, type StopScan } from "@tensorcraft/shared";
import { EXERCISE_EDITOR_EXTENSIONS } from "./exercise-autocomplete";
import type { ExerciseData } from "./exercise";

/** One step of a challenge brief, as velite builds it. */
export type TaskStep = NonNullable<ExerciseData["taskBrief"]>["steps"][number];

export interface TaskStopsSnapshot {
  /** True while an editor is attached; until then the brief shows build-time lines. */
  attached: boolean;
  scans: readonly StopScan[];
}

/** What the brief may use: read the stops, and select one in the editor. */
export interface TaskStopsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): TaskStopsSnapshot;
  select(index: number): void;
}

/** What the editor extension also needs. */
export interface TaskStopsWiring extends TaskStopsStore {
  attach(view: EditorView, scans: readonly StopScan[]): void;
  detach(view: EditorView): void;
  publish(scans: readonly StopScan[]): void;
}

function sameScans(a: readonly StopScan[], b: readonly StopScan[]): boolean {
  return (
    a.length === b.length &&
    a.every((scan, index) => {
      const other = b[index];
      return (
        scan.line === other.line &&
        scan.state === other.state &&
        scan.rhsStart === other.rhsStart &&
        scan.rhsEnd === other.rhsEnd &&
        scan.matches === other.matches
      );
    })
  );
}

export function createTaskStopsStore(
  steps: readonly TaskStep[],
): TaskStopsWiring {
  let view: EditorView | null = null;
  let snapshot: TaskStopsSnapshot = { attached: false, scans: [] };
  const listeners = new Set<() => void>();
  const emit = (next: TaskStopsSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    attach(next, scans) {
      view = next;
      emit({ attached: true, scans });
    },
    detach(old) {
      // Sandpack can build the next view before it destroys the old one.
      if (view !== old) return;
      view = null;
      emit({ attached: false, scans: snapshot.scans });
    },
    publish(scans) {
      if (sameScans(snapshot.scans, scans)) return;
      emit({ attached: view !== null, scans });
    },
    select(index) {
      const step = steps[index];
      if (!view || !step) return;
      const doc = view.state.doc;
      const scan = snapshot.scans[index];
      let anchor: number;
      let head: number;
      if (scan && scan.line !== null && scan.line <= doc.lines) {
        // A waiting placeholder IS the right-hand side; other and typed
        // code select what is there now.
        const line = doc.line(scan.line);
        anchor = line.from + scan.rhsStart;
        head = line.from + scan.rhsEnd;
      } else {
        // Missing: the build-time line, clamped to the document.
        anchor = head = doc.line(
          Math.min(Math.max(step.line, 1), doc.lines),
        ).from;
      }
      view.focus();
      view.dispatch({
        selection: EditorSelection.range(anchor, head),
        scrollIntoView: true,
      });
    },
  };
}

const slotMark = Decoration.mark({ class: "cm-task-slot" });

class TaskLineMarker extends GutterMarker {
  elementClass = "cm-task-line";
}
const taskLineMarker = new TaskLineMarker();

export interface MeasuredStops {
  scans: StopScan[];
  /** A frame on each waiting placeholder. */
  slots: DecorationSet;
  /** A gutter mark on each line still to finish: waiting or other code. */
  lines: RangeSet<GutterMarker>;
}

/** The marks for one document (spec 2026-10-10, section 4 table). */
export function measureStops(
  doc: Text,
  steps: readonly TaskStep[],
): MeasuredStops {
  const scans = scanStops(doc.toJSON(), steps);
  const slots: Range<Decoration>[] = [];
  const lines: Range<GutterMarker>[] = [];
  for (const scan of scans) {
    if (scan.line === null) continue;
    const line = doc.line(scan.line);
    if (scan.state === "waiting") {
      slots.push(
        slotMark.range(line.from + scan.rhsStart, line.from + scan.rhsEnd),
      );
    }
    if (scan.state === "waiting" || scan.state === "other") {
      lines.push(taskLineMarker.range(line.from));
    }
  }
  return {
    scans,
    slots: Decoration.set(slots, true),
    lines: RangeSet.of(lines, true),
  };
}

/**
 * Marks each stop's line in the editor and keeps the store in step. The
 * field recomputes from the document on every change instead of mapping old
 * positions: Sandpack's Reset, Show Solution and Restore My Code replace
 * the whole document, which drops mapped marks.
 */
export function taskStops(
  steps: readonly TaskStep[],
  store: TaskStopsWiring,
): Extension {
  const field = StateField.define<MeasuredStops>({
    create: (state) => measureStops(state.doc, steps),
    update: (value, transaction) =>
      transaction.docChanged
        ? measureStops(transaction.state.doc, steps)
        : value,
    provide: (self) => [
      EditorView.decorations.from(self, (value) => value.slots),
      gutterLineClass.from(self, (value) => value.lines),
    ],
  });
  const publisher = ViewPlugin.define((view) => {
    store.attach(view, view.state.field(field).scans);
    return {
      update(update) {
        const next = update.state.field(field);
        if (next !== update.startState.field(field, false)) {
          store.publish(next.scans);
        }
      },
      destroy() {
        store.detach(view);
      },
    };
  });
  return [field, publisher];
}

/**
 * The workspace's store and editor extensions, built once per step list.
 * Stable identity matters: sandpack-react 2.20.0's applyExtensions effect
 * appends the whole array again whenever it is not shallow-equal to the
 * previous one, which would stack a second copy of every extension. The
 * steps come from the page's exercise data, whose objects keep their
 * identity across renders.
 */
export function useTaskStops(steps: readonly TaskStep[] | undefined) {
  return useMemo(() => {
    if (!steps || steps.length === 0) return null;
    const store = createTaskStopsStore(steps);
    return {
      store: store as TaskStopsStore,
      extensions: [...EXERCISE_EDITOR_EXTENSIONS, taskStops(steps, store)],
    };
  }, [steps]);
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `pnpm exec vitest run packages/ui/src/mdx/task-stops.test.ts`
Expected: PASS, 10 tests, and no "Unhandled errors" section in the output.

### Task 5: One ladder, two places

**Files:**
- Modify: `packages/ui/src/mdx/hint-panel.tsx` (full replacement)
- Modify: `packages/ui/src/mdx/hint-panel.test.tsx`

The `inline` presentation stays until Task 8, because `lesson-content.tsx` still uses it.

- [ ] **Step 1: Write the failing tests**

In `packages/ui/src/mdx/hint-panel.test.tsx`, change the imports to:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  HintButton,
  HintPanel,
  HintRungs,
  useHintLadder,
  type Hint,
} from "./hint-panel";
```

Append this block at the end of the file:

```tsx
function Split({
  hints: list,
  onHintRevealed,
}: {
  hints: Hint[] | undefined;
  onHintRevealed?: (level: 1 | 2 | 3) => void;
}) {
  const ladder = useHintLadder(list, onHintRevealed);
  return (
    <>
      <HintRungs ladder={ladder} />
      <div data-testid="actions">
        <HintButton ladder={ladder} />
      </div>
    </>
  );
}

describe("the workspace's split ladder (spec 2026-10-10)", () => {
  it("reveals rungs in order, relabels the button and reports each level", () => {
    const spy = vi.fn();
    render(<Split hints={hints.slice(0, 2)} onHintRevealed={spy} />);
    fireEvent.click(screen.getByRole("button", { name: "Get a nudge" }));
    expect(screen.getByText("A nudge")).toBeInTheDocument();
    expect(
      screen.getByText("Think about array operations"),
    ).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Get more guidance" }));
    expect(spy).toHaveBeenLastCalledWith(2);
    // Two rungs: the ladder is spent, so the button goes.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces the reveal and moves focus to the new rung", async () => {
    render(<Split hints={hints} />);
    fireEvent.click(screen.getByRole("button", { name: "Get a nudge" }));
    expect(screen.getByRole("status")).toHaveTextContent("Nudge revealed.");
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent(
        "Think about array operations",
      ),
    );
  });

  it("mounts the live region before the first reveal", () => {
    render(<Split hints={hints} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("renders nothing without hints", () => {
    const { container } = render(<Split hints={undefined} />);
    expect(container.querySelector(".challenge-hints")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run packages/ui/src/mdx/hint-panel.test.tsx`
Expected: FAIL. The new tests error on missing exports (`useHintLadder is not a function` or similar).

- [ ] **Step 3: Replace `hint-panel.tsx`**

Replace the whole file with:

```tsx
"use client";

import { useRef, useState, type RefObject } from "react";
import { InstructionText } from "./instruction-text";

export interface Hint {
  level: "nudge" | "guidance" | "solution";
  content: string;
}

interface HintPanelProps {
  hints: Hint[] | undefined;
  presentation?: "ladder" | "inline";
  /**
   * Called when the user reveals a hint tier. The consumer wires this up
   * to analytics, kept here as a pure callback so the UI package has no
   * PostHog dependency (Session 8b rule).
   */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}

const HINT_LEVEL_TO_INDEX: Record<Hint["level"], 1 | 2 | 3> = {
  nudge: 1,
  guidance: 2,
  solution: 3,
};

const levelConfig = {
  nudge: { label: "Nudge", color: "var(--tc-tier-identity)" },
  guidance: { label: "Guidance", color: "var(--tc-tier-structural)" },
  solution: { label: "Solution", color: "var(--tc-tier-intuition)" },
};

/** The challenge workspace's words for a revealed rung and for the next. */
const RUNG_TITLE: Record<Hint["level"], string> = {
  nudge: "A nudge",
  guidance: "More guidance",
  solution: "The solution",
};
const NEXT_LABEL: Record<Hint["level"], string> = {
  nudge: "Get a nudge",
  guidance: "Get more guidance",
  solution: "Reveal solution",
};

export interface HintLadder {
  hints: Hint[];
  /** Index of the last revealed rung; -1 before the first reveal. */
  revealedLevel: number;
  /** The rung the next reveal shows, while one is left. */
  next: Hint | undefined;
  reveal: () => void;
  /** Focus target: the rung revealed last. */
  revealedRef: RefObject<HTMLDivElement | null>;
}

/**
 * One ladder's state. HintPanel renders it as one block; the challenge
 * workspace renders its rungs and its button in different places of the
 * editor footer (spec 2026-10-10, section 5 item 5).
 */
export function useHintLadder(
  hints: Hint[] | undefined,
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void,
): HintLadder {
  const [revealedLevel, setRevealedLevel] = useState(-1);
  const revealedRef = useRef<HTMLDivElement | null>(null);
  const list = hints ?? [];
  const next = list[revealedLevel + 1];
  const reveal = () => {
    if (!next) return;
    setRevealedLevel(revealedLevel + 1);
    onHintRevealed?.(HINT_LEVEL_TO_INDEX[next.level]);
    // After paint, move focus onto the revealed hint. The button that was
    // just pressed may no longer exist, so without this focus resets to
    // <body> and a keyboard user has to tab from the top of the document.
    requestAnimationFrame(() => revealedRef.current?.focus());
  };
  return { hints: list, revealedLevel, next, reveal, revealedRef };
}

/*
  Revealing a hint replaced the button with its own result in the same
  commit. Focus fell to <body>, and nothing announced, so a screen reader
  user pressed "Reveal Nudge", heard silence, and had no way to find the
  text they had just asked for. Across all 56 lessons.

  Two fixes, matching the model in exercise.tsx: an ALWAYS-MOUNTED live
  region (a region created in the same commit as its content is not
  reliably announced), plus focus moved onto the revealed panel. WCAG 4.1.3
  and 2.4.3.

  The region announces the EVENT only, never the hint text. Focus lands on
  the hint itself, so repeating the content here would make a screen reader
  read it twice: once from the announcement, again on arrival.
*/
function RevealAnnouncer({ ladder }: { ladder: HintLadder }) {
  const revealed =
    ladder.revealedLevel >= 0 ? ladder.hints[ladder.revealedLevel] : undefined;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {revealed ? `${levelConfig[revealed.level].label} revealed.` : ""}
    </div>
  );
}

function HintBody({ hint, className }: { hint: Hint; className: string }) {
  return hint.level === "solution" ? (
    // Solution hints are code excerpts by convention (Gate B: the hint is an
    // excerpt of solutionCode). Rendering them as a wrapped sans-serif
    // paragraph made the longest one a 1,031-char unbroken line of
    // prose-styled code (fresh-eyes rerun T1-15). Monospace, preserved
    // whitespace, scroll.
    <pre className="text-[13px] leading-relaxed text-text-primary/90 font-mono whitespace-pre-wrap break-words overflow-x-auto m-0">
      <code>{hint.content}</code>
    </pre>
  ) : (
    // Guidance hints are authored prose with the same backticks, lists and
    // line breaks the instructions use, so they share the instructions'
    // renderer (2026-09-13).
    <InstructionText text={hint.content} className={className} />
  );
}

function QuestionIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3" />
      <path d="M12 16h.01" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function HintPanel({
  hints,
  onHintRevealed,
  presentation = "ladder",
}: HintPanelProps) {
  const inline = presentation === "inline";
  const ladder = useHintLadder(hints, onHintRevealed);
  if (ladder.hints.length === 0) return null;

  return (
    <div
      className={
        inline
          ? "challenge-hints"
          : "p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
      }
    >
      <RevealAnnouncer ladder={ladder} />

      {!inline && (
        <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-text-muted">
          Need a hint?
        </h4>
      )}

      <div className="flex flex-col gap-3">
        {ladder.hints.map((hint, index) => {
          const config = levelConfig[hint.level];
          const isRevealed = index <= ladder.revealedLevel;
          const isNext = index === ladder.revealedLevel + 1;
          if (inline && !isRevealed && !isNext) return null;

          return (
            <div key={hint.level}>
              {isRevealed ? (
                <div
                  // tabIndex -1 keeps this out of the tab sequence while
                  // still being programmatically focusable, so the reader
                  // lands on the hint it just asked for rather than <body>.
                  ref={
                    index === ladder.revealedLevel
                      ? ladder.revealedRef
                      : undefined
                  }
                  tabIndex={index === ladder.revealedLevel ? -1 : undefined}
                  className={
                    inline
                      ? "challenge-hint-content"
                      : "p-3 bg-surface outline-none"
                  }
                >
                  <span
                    className={
                      inline
                        ? "challenge-hint-title"
                        : "text-xs font-mono font-semibold uppercase tracking-widest block mb-1"
                    }
                    style={inline ? undefined : { color: config.color }}
                  >
                    {inline ? RUNG_TITLE[hint.level] : config.label}
                  </span>
                  <HintBody
                    hint={hint}
                    className="text-sm leading-relaxed text-text-primary/80"
                  />
                </div>
              ) : isNext ? (
                <button
                  onClick={ladder.reveal}
                  className={
                    inline
                      ? "challenge-hint-action"
                      : "w-full text-left p-3 transition-colors duration-100 hover:bg-surface border border-dashed border-border brutalist-hover"
                  }
                  style={inline ? undefined : { color: config.color }}
                >
                  {inline && <QuestionIcon />}
                  <span className={inline ? undefined : "text-xs font-medium"}>
                    {inline
                      ? NEXT_LABEL[hint.level]
                      : `Reveal ${config.label} →`}
                  </span>
                </button>
              ) : (
                // opacity-40 rendered the locked label at 2.31:1, and the
                // opacity-75 that replaced it still failed in the light
                // scheme (#555555 at 75% over white computes to #808080,
                // 3.94:1, axe, 2026-07-23). WCAG 1.4.3 arguably exempts an
                // inactive component, but the label is what tells you which
                // hint is locked, so it has to be readable. No opacity: the
                // muted token alone is AA in both schemes, and the dashed
                // border carries the locked affordance.
                <div className="p-3 border border-dashed border-border text-text-muted">
                  <span className="text-xs">{config.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The challenge workspace's revealed rungs, with the ladder's live region.
 * Renders while the ladder has hints, so the region is mounted before the
 * first reveal.
 */
export function HintRungs({ ladder }: { ladder: HintLadder }) {
  if (ladder.hints.length === 0) return null;
  return (
    <div className="challenge-hints">
      <RevealAnnouncer ladder={ladder} />
      {ladder.hints.slice(0, ladder.revealedLevel + 1).map((hint, index) => (
        <div
          key={hint.level}
          ref={index === ladder.revealedLevel ? ladder.revealedRef : undefined}
          tabIndex={index === ladder.revealedLevel ? -1 : undefined}
          className="challenge-hint-content"
        >
          <span className="challenge-hint-title">{RUNG_TITLE[hint.level]}</span>
          <HintBody
            hint={hint}
            className="text-sm leading-relaxed text-text-primary/80"
          />
        </div>
      ))}
    </div>
  );
}

/** The workspace's next-rung button. Renders nothing once the ladder is spent. */
export function HintButton({ ladder }: { ladder: HintLadder }) {
  if (!ladder.next) return null;
  return (
    <button
      type="button"
      onClick={ladder.reveal}
      className="challenge-hint-action"
    >
      <QuestionIcon />
      <span>{NEXT_LABEL[ladder.next.level]}</span>
    </button>
  );
}
```

- [ ] **Step 4: Run every hint test and watch them pass**

Run: `pnpm exec vitest run packages/ui/src/mdx/hint-panel.test.tsx packages/ui/src/mdx/exercise-brief.test.tsx`
Expected: PASS. The existing `ladder` and `inline` tests pass unchanged next to the four new ones.

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts"`
Expected: PASS. `hint-panel.tsx` still carries its one `brutalist-shadow`.

### Task 6: The brief component

**Files:**
- Create: `packages/ui/src/mdx/task-stops-brief.tsx`
- Create: `packages/ui/src/mdx/task-stops-brief.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/mdx/task-stops-brief.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StopScan } from "@tensorcraft/shared";
import { finishHeading, TaskStopsBrief } from "./task-stops-brief";
import type {
  TaskStep,
  TaskStopsSnapshot,
  TaskStopsStore,
} from "./task-stops";

const here = path.dirname(fileURLToPath(import.meta.url));

const STEPS: TaskStep[] = [
  {
    title: "Create the tensor",
    instruction: "Set `reading` to:",
    code: "tf.tensor(streamValues)",
    target: "reading",
    line: 3,
  },
  {
    title: "Read its shape",
    instruction: "Set `shape` to:",
    code: "reading.shape",
    result: "Expect `[5]`: a list of five readings.",
    target: "shape",
    line: 4,
  },
];
const BRIEF = {
  steps: STEPS,
  support: "TensorFlow.js is loaded as `tf`. Leave the other lines as they are.",
};

function fakeStore(initial: TaskStopsSnapshot) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    select: vi.fn(),
    set(next: TaskStopsSnapshot) {
      snapshot = next;
      for (const listener of listeners) listener();
    },
  } satisfies TaskStopsStore & { set(next: TaskStopsSnapshot): void };
}
const scan = (line: number | null, state: StopScan["state"]): StopScan => ({
  line,
  state,
  rhsStart: 0,
  rhsEnd: 0,
  matches: line === null ? 0 : 1,
});

describe("finishHeading", () => {
  it("names one, two and more lines, sorted and de-duplicated", () => {
    expect(finishHeading([3])).toBe("Finish line 3");
    expect(finishHeading([4, 3])).toBe("Finish lines 3 and 4");
    expect(finishHeading([8, 3, 5, 5])).toBe("Finish lines 3, 5 and 8");
    expect(finishHeading([4, 4])).toBe("Finish line 4");
  });
});

describe("TaskStopsBrief (spec 2026-10-10)", () => {
  it("shows build-time lines and inert keys until the editor attaches", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 3 and 4",
    );
    const key = screen.getByRole("button", { name: "Line 3" });
    expect(key).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(key);
    expect(store.select).not.toHaveBeenCalled();
  });

  it("follows the editor's line numbers once attached", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    act(() =>
      store.set({
        attached: true,
        scans: [scan(4, "waiting"), scan(5, "waiting")],
      }),
    );
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 4 and 5",
    );
    expect(screen.getByRole("button", { name: "Line 4" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("selects a stop through the store; each key is described by its title", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(3, "waiting"), scan(4, "waiting")],
    });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    const key = screen.getByRole("button", { name: "Line 4" });
    expect(key).toHaveAccessibleDescription("Read its shape");
    fireEvent.click(key);
    expect(store.select).toHaveBeenCalledWith(1);
  });

  it("quiets a typed stop and says so to screen readers", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(3, "typed"), scan(4, "waiting")],
    });
    const { container } = render(
      <TaskStopsBrief brief={BRIEF} store={store} />,
    );
    const items = container.querySelectorAll(".challenge-stops > li");
    expect(items[0]).toHaveAttribute("data-stop-state", "typed");
    expect(items[1]).toHaveAttribute("data-stop-state", "waiting");
    expect(
      screen.getByRole("button", { name: "Line 3" }),
    ).toHaveAccessibleDescription("Create the tensor, typed");
  });

  it("keeps a missing stop on its build-time line", () => {
    const store = fakeStore({
      attached: true,
      scans: [scan(2, "waiting"), scan(null, "missing")],
    });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Finish lines 2 and 4",
    );
  });

  it("prints the code to type, the note and the result", () => {
    const store = fakeStore({ attached: false, scans: [] });
    render(<TaskStopsBrief brief={BRIEF} store={store} />);
    expect(screen.getByText("tf.tensor(streamValues)")).toBeInTheDocument();
    expect(screen.getByText("reading.shape")).toBeInTheDocument();
    expect(screen.getByText(/a list of five readings/)).toBeInTheDocument();
    expect(screen.getByText(/is loaded as/)).toBeInTheDocument();
    expect(screen.getByTestId("exercise-brief")).toHaveClass("challenge-brief");
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const store = fakeStore({ attached: false, scans: [] });
    const { container } = render(
      <TaskStopsBrief brief={BRIEF} store={store} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("loads no CodeMirror: it imports only types from task-stops", () => {
    const src = fs.readFileSync(path.join(here, "task-stops-brief.tsx"), "utf8");
    expect(src).not.toMatch(/^import [^\n]*@codemirror/m);
    expect(src).toMatch(/^import type \{[^}]*\} from "\.\/task-stops";$/m);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm exec vitest run packages/ui/src/mdx/task-stops-brief.test.tsx`
Expected: FAIL, `Failed to resolve import "./task-stops-brief"`.

- [ ] **Step 3: Write the component**

Create `packages/ui/src/mdx/task-stops-brief.tsx`:

```tsx
"use client";

import { useId, useSyncExternalStore } from "react";
import { InstructionText } from "./instruction-text";
import type { TaskStep, TaskStopsStore } from "./task-stops";

export interface TaskStopsBriefData {
  steps: TaskStep[];
  support: string;
}

/** "Finish line 3", "Finish lines 3 and 4", "Finish lines 3, 5 and 8". */
export function finishHeading(lines: readonly number[]): string {
  const numbers = [...new Set(lines)].sort((a, b) => a - b);
  if (numbers.length === 1) return `Finish line ${numbers[0]}`;
  const last = numbers[numbers.length - 1];
  return `Finish lines ${numbers.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * The challenge workspace's brief: the lines to finish, as the head of the
 * editor column (spec 2026-10-10). Line numbers and states come from the
 * editor through the store once it attaches, and from the build until then.
 * A Missing stop keeps its build-time line (spec section 4).
 */
export function TaskStopsBrief({
  brief,
  store,
}: {
  brief: TaskStopsBriefData;
  store: TaskStopsStore;
}) {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const id = useId();
  const stops = brief.steps.map((step, index) => {
    const scan = snapshot.attached ? snapshot.scans[index] : undefined;
    return {
      step,
      line: scan?.line ?? step.line,
      state: scan?.state ?? "waiting",
      titleId: `${id}-stop-${index}`,
    };
  });

  return (
    <section
      className="challenge-brief"
      data-testid="exercise-brief"
      aria-labelledby={`${id}-heading`}
    >
      <h3 id={`${id}-heading`}>{finishHeading(stops.map((s) => s.line))}</h3>
      <InstructionText text={brief.support} className="challenge-brief-note" />
      <ol className="challenge-stops" aria-label="Lines to finish">
        {stops.map(({ step, line, state, titleId }, index) => (
          <li key={step.target} data-stop-state={state}>
            <button
              type="button"
              className="challenge-stop-key"
              aria-describedby={titleId}
              aria-disabled={snapshot.attached ? undefined : true}
              onClick={() => {
                if (snapshot.attached) store.select(index);
              }}
            >
              Line {line}
            </button>
            <h4 id={titleId} className="challenge-stop-title">
              {step.title}
              {state === "typed" && <span className="sr-only">, typed</span>}
            </h4>
            <div className="challenge-stop-do">
              <InstructionText
                text={step.instruction}
                className="challenge-stop-instruction"
              />
              <code className="challenge-stop-code">{step.code}</code>
            </div>
            {step.result && (
              <InstructionText
                text={step.result}
                className="challenge-stop-result"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `pnpm exec vitest run packages/ui/src/mdx/task-stops-brief.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm --filter @tensorcraft/ui lint`
Expected: exit 0.

Run: `pnpm typecheck`
Expected: exit 0, no errors. `@tensorcraft/ui` has no typecheck script of its own; the root task checks it through the packages that import it.

- [ ] **Step 6: Checkpoint B (owner commits)**

Stop and hand over. Do not run git. Files for commit group B:
`packages/ui/src/mdx/task-stops.ts`, `packages/ui/src/mdx/task-stops.test.ts`, `packages/ui/src/mdx/hint-panel.tsx`, `packages/ui/src/mdx/hint-panel.test.tsx`, `packages/ui/src/mdx/task-stops-brief.tsx`, `packages/ui/src/mdx/task-stops-brief.test.tsx`.
Suggested message: `feat(ui): task stops extension, split hint ladder, stops brief`.

---

## Group C: the switch-over (one commit after Task 12)

### Task 7: Mount the brief, the marks and the footer ladder in the pane

**Files:**
- Modify: `packages/ui/src/mdx/exercise.tsx`
- Create: `packages/ui/src/mdx/exercise-workspace.test.ts`

- [ ] **Step 1: Write the failing source pins**

The pane needs Sandpack to render, so its wiring is pinned in source, the way `exercise-brief.test.tsx` already does. The Playwright spec (Task 11) proves the page. Create `packages/ui/src/mdx/exercise-workspace.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "exercise.tsx"), "utf8");

describe("exercise pane, workspace wiring (spec 2026-10-10)", () => {
  it("right-aligns Show Solution and Restore My Code as one group for every exercise", () => {
    expect(src).toMatch(
      /data-help-group=""\s+className="ml-auto flex flex-wrap items-center gap-2"/,
    );
    const buttons =
      src.match(/data-solution-action=""[\s\S]*?className="[^"]*"/g) ?? [];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).not.toMatch(/\bml-auto\b/);
  });

  it("gives the editor the task-stops extensions when the workspace has a brief", () => {
    expect(src).toMatch(
      /extensions=\{taskStops\?\.extensions \?\? EXERCISE_EDITOR_EXTENSIONS\}/,
    );
  });

  it("renders the stops brief instead of the eyebrow row in the workspace", () => {
    expect(src).toMatch(/<TaskStopsBrief\s+brief=\{exercise\.taskBrief\}/);
    expect(src).toMatch(/\{taskStops && <h4 className="sr-only">Your JavaScript<\/h4>\}/);
  });
});
```

Run: `pnpm exec vitest run packages/ui/src/mdx/exercise-workspace.test.ts`
Expected: FAIL, 3 tests.

- [ ] **Step 2: Imports, the `hints` prop and the hooks**

In `packages/ui/src/mdx/exercise.tsx`:

1. Add `type ReactNode` to the existing React import list (the block that starts `import {\n  lazy,`):

```ts
import {
  lazy,
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useContext,
  type ReactNode,
} from "react";
```

2. Replace `import { HintPanel } from "./hint-panel";` with:

```ts
import {
  HintButton,
  HintPanel,
  HintRungs,
  useHintLadder,
  type Hint,
} from "./hint-panel";
import { useTaskStops } from "./task-stops";
import { TaskStopsBrief } from "./task-stops-brief";
```

3. In `interface ExerciseProps`, add after the `onHintRevealed` member:

```ts
  /**
   * The lesson's ladder, shown in the challenge workspace's editor footer
   * (spec 2026-10-10). The exercise's own `hints` win when it has them.
   */
  hints?: Hint[];
```

4. In `export function Exercise({`, add `hints,` to the destructured props after `onHintRevealed,`. Then insert directly after `const scheme = useScheme();`:

```ts
  // The challenge workspace: its brief's stops and the ladder its footer
  // shows (spec 2026-10-10). Both are inert outside the workspace.
  const taskStops = useTaskStops(
    workspace ? exercise?.taskBrief?.steps : undefined,
  );
  const ladder = useHintLadder(
    workspace ? (exercise?.hints ?? hints) : undefined,
    onHintRevealed,
  );
```

- [ ] **Step 3: The brief replaces the eyebrow row in the workspace**

Find the header row: the comment that starts `{/* Header row. Wraps between whole items only: at 390 px the old` and the `<div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">` element under it, through that div's closing `</div>`. Wrap it so it renders only without a stops brief:

```tsx
      {taskStops && exercise.taskBrief ? (
        <TaskStopsBrief
          brief={exercise.taskBrief}
          store={taskStops.store}
        />
      ) : (
        <>
          {/* (the existing "Header row" comment, unchanged) */}
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* (the existing header row contents, unchanged) */}
          </div>
        </>
      )}
```

Keep the existing comment and contents verbatim. `exercise-brief.test.tsx` pins `mb-4 flex flex-wrap items-center gap-x-3 gap-y-1` and `titled ? (<span ... data-testid="exercise-pane-title"` in this file.

- [ ] **Step 4: Name the editor for screen readers and give it the extensions**

Replace:

```tsx
        <div
          ref={setEditorBox}
          data-editor-frame=""
          className="overflow-hidden border border-border rounded-none"
        >
          {!draftState.ready ? (
```

with:

```tsx
        <div
          ref={setEditorBox}
          data-editor-frame=""
          className="overflow-hidden border border-border rounded-none"
        >
          {/* The brief is the column's visible title; the editor keeps its
              name for screen readers (spec 2026-10-10, section 3). */}
          {taskStops && <h4 className="sr-only">Your JavaScript</h4>}
          {!draftState.ready ? (
```

Replace `extensions={EXERCISE_EDITOR_EXTENSIONS}` with `extensions={taskStops?.extensions ?? EXERCISE_EDITOR_EXTENSIONS}`.

- [ ] **Step 5: Pass the footer ladder to the controls**

In the `<ExerciseControls` element inside `SandpackProvider`, add after `showSolution={showSolution}`:

```tsx
                  rungs={workspace ? <HintRungs ladder={ladder} /> : undefined}
                  help={workspace ? <HintButton ladder={ladder} /> : undefined}
```

- [ ] **Step 6: Give `ExerciseControls` the two slots and the help group**

Add the two props to its destructuring (after `showSolution,`) and to its type (after `showSolution: boolean;`):

```ts
  rungs,
  help,
```

```ts
  /** Revealed hint rungs, between the draft note and the actions row. */
  rungs?: ReactNode;
  /** The next-rung button, first in the right-aligned help group. */
  help?: ReactNode;
```

In its returned JSX, insert `{rungs}` between the `{draftNotice && (...)}` block and `<div className="flex flex-wrap items-center gap-2 mt-3">`.

Then replace the two solution buttons, from `{!showSolution && (` through the `)}` that closes the `{hasStash && (` block, with this group. It keeps both buttons' attributes and classes, except that `ml-auto` moves from the buttons to the group:

```tsx
        {/* Help and the solution controls sit together at the right for
            every exercise; only the challenge workspace passes `help`
            (spec 2026-10-10, section 5 item 3). */}
        <div data-help-group="" className="ml-auto flex flex-wrap items-center gap-2">
          {help}
          {!showSolution && (
            <button
              type="button"
              data-solution-action=""
              onClick={handleShowSolution}
              className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-warning/10 text-warning border border-warning/20 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            >
              Show Solution
            </button>
          )}
          {hasStash && (
            <button
              type="button"
              data-solution-action=""
              onClick={handleRestoreMyCode}
              className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-surface-overlay text-text-primary border border-interactive rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
            >
              Restore My Code
            </button>
          )}
        </div>
```

- [ ] **Step 7: Run the pins and the neighbours**

Run: `pnpm exec vitest run packages/ui/src/mdx/exercise-workspace.test.ts packages/ui/src/mdx/exercise-brief.test.tsx "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts"`
Expected: PASS. Exactly one `brutalist-shadow` remains in `exercise.tsx`.

### Task 8: Wire the page: empty left slot, hints into the pane, no `inline`

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx`
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`
- Modify: `packages/ui/src/mdx/exercise-brief.tsx` (full replacement)
- Modify: `packages/ui/src/mdx/hint-panel.tsx` (drop `inline`)
- Modify: `packages/ui/src/mdx/hint-panel.test.tsx` (drop the `inline` test)
- Test: `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx`, `.../lesson-content.test.tsx`, `.../lesson-steps.test.tsx`

- [ ] **Step 1: Write the failing shell test**

Append to `__tests__/lesson-shell.test.tsx`, inside `describe("LessonShell", ...)`:

```tsx
  it("renders no left wrapper when the left slot is null", () => {
    // The challenge workspace keeps its brief in the pane (spec 2026-10-10);
    // an empty wrapper would still take a grid row and a 24 px gap.
    const { container } = render(
      <LessonShell
        left={null}
        right={<aside>pane</aside>}
        rightKind="pane"
        workspace
      />,
    );
    const grid = container.querySelector("[data-testid='lesson-grid']")!;
    expect(grid.children).toHaveLength(1);
    expect(grid.firstElementChild).toBe(screen.getByTestId("lesson-right"));
  });
```

- [ ] **Step 2: Write the failing content tests**

In `lesson-content.test.tsx`, replace the `Exercise:` entry of the `vi.mock("@tensorcraft/ui", ...)` factory with:

```tsx
  Exercise: ({
    brief,
    titled,
    workspace,
    hints,
    onHintRevealed,
  }: {
    brief?: "inline" | "external";
    titled?: boolean;
    workspace?: boolean;
    hints?: Array<{ level: string; content: string }>;
    onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
  }) => (
    <div
      data-testid="exercise-pane"
      data-brief={brief ?? "inline"}
      data-titled={titled ? "true" : undefined}
      data-workspace={workspace ? "true" : undefined}
      data-hints={hints?.map((hint) => hint.level).join(",")}
    >
      <button type="button" onClick={() => onHintRevealed?.(1)}>
        pane reveal
      </button>
    </div>
  ),
```

Append these tests inside the describe block that defines `one` and `lessonBody` (the one holding "renders the brief and no pane for a set that names ExerciseBrief"):

```tsx
  const ladder = [
    { level: "nudge" as const, content: "n" },
    { level: "guidance" as const, content: "g" },
  ];

  it("hands the lesson's ladder to the workspace pane and wires it to the page hook", async () => {
    vi.mocked(trackHintRequested).mockClear();
    const spy = vi.fn();
    render(
      <LessonContent
        lesson={{ ...lessonBody, hints: ladder }}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["Exercise"])}
        exerciseWorkspace
        onHintRevealed={spy}
      />,
    );
    const pane = await screen.findByTestId("exercise-pane");
    expect(pane).toHaveAttribute("data-workspace", "true");
    expect(pane).toHaveAttribute("data-hints", "nudge,guidance");
    fireEvent.click(screen.getByRole("button", { name: "pane reveal" }));
    expect(spy).toHaveBeenCalledWith(1);
    expect(trackHintRequested).toHaveBeenCalledWith(1, {
      worldId: "deep-orbit",
      lessonId: "introduction-to-tensors",
    });
  });

  it("gives a non-workspace pane no ladder", async () => {
    render(
      <LessonContent
        lesson={{ ...lessonBody, hints: ladder }}
        exercises={one}
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    expect(await screen.findByTestId("exercise-pane")).not.toHaveAttribute(
      "data-hints",
    );
  });

  it("renders no lesson-level hint panel in the workspace", () => {
    render(
      <LessonContent
        lesson={{ ...lesson, hints: ladder }}
        visibleComponents={new Set(["challenge", "HintPanel"])}
        exerciseWorkspace
      />,
    );
    expect(screen.queryByTestId("hint-panel")).toBeNull();
  });
```

- [ ] **Step 3: Write the failing steps test**

In `lesson-steps.test.tsx`, extend the `LessonContent` stub. Add `exerciseWorkspace` and `onHintRevealed` to its destructured props and to its prop type (`exerciseWorkspace?: boolean; onHintRevealed?: (level: 1 | 2 | 3) => void;`), and add these two attributes to the stub's `<div>`:

```tsx
          data-workspace={exerciseWorkspace ? "true" : undefined}
          data-hint-callback={onHintRevealed ? "true" : undefined}
```

Append this test inside `describe("LessonSteps, skip to the challenge (2026-09-04 audit step 2)", ...)`. Its one-exercise fixture on this lesson is the workspace case:

```tsx
  it("leaves the workspace's left slot empty and hands the hint hook to the pane", () => {
    localStorage.setItem(STEP_KEY, "2");
    localStorage.setItem(MAX_KEY, "2");
    renderWithExercise();
    const contents = screen.getAllByTestId("lesson-content");
    expect(contents).toHaveLength(1);
    expect(contents[0]).toHaveAttribute("data-visible", "Exercise");
    expect(contents[0]).toHaveAttribute("data-workspace", "true");
    expect(contents[0]).toHaveAttribute("data-hint-callback", "true");
    expect(screen.getByTestId("lesson-grid").children).toHaveLength(1);
  });
```

- [ ] **Step 4: Run the three web test files and watch the new tests fail**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx"`
Expected: FAIL on four of the five new tests. "gives a non-workspace pane no ladder" already passes, because today no pane receives hints; it guards the change.

- [ ] **Step 5: `lesson-shell.tsx`: no wrapper for a null left slot**

Replace:

```tsx
          <div
            className={`min-w-0 ${!workspace && pane && paneOpenOnMobile ? "hidden lg:block" : ""}`}
          >
            {left}
          </div>
```

with:

```tsx
          {left != null && (
            <div
              className={`min-w-0 ${!workspace && pane && paneOpenOnMobile ? "hidden lg:block" : ""}`}
            >
              {left}
            </div>
          )}
```

- [ ] **Step 6: `lesson-content.tsx`: hints into the workspace pane**

In the `base.Exercise` binding, drop `workspace={exerciseWorkspace}` from `<ExerciseBrief ... />`, so it reads:

```tsx
          <ExerciseBrief
            slug={props.slug}
            onHintRevealed={handleHintRevealed}
          />
```

In the `<Exercise ... />` element of the same binding, add the `hints` line after `workspace={exerciseWorkspace}`:

```tsx
          workspace={exerciseWorkspace}
          hints={exerciseWorkspace ? lesson.hints : undefined}
          onHintRevealed={handleHintRevealed}
```

Add `lesson.hints,` to the components memo's dependency list, after `exerciseWorkspace,`.

Replace the lesson-level panel block at the end of the root:

```tsx
          {shouldShow("HintPanel") &&
            lesson.hints &&
            (exerciseWorkspace ? (
              <HintPanel
                hints={lesson.hints}
                presentation="inline"
                onHintRevealed={handleHintRevealed}
              />
            ) : (
              <HintPanel
                hints={lesson.hints}
                onHintRevealed={handleHintRevealed}
              />
            ))}
```

with:

```tsx
          {/* The workspace's ladder lives in its editor footer (spec
              2026-10-10, section 5). */}
          {shouldShow("HintPanel") && lesson.hints && !exerciseWorkspace && (
            <HintPanel
              hints={lesson.hints}
              onHintRevealed={handleHintRevealed}
            />
          )}
```

- [ ] **Step 7: `lesson-steps.tsx`: the workspace's empty left slot**

In the Challenge branch, replace:

```tsx
    rightKind = "pane";
    shellLeft = (
      <StepChallenge
        {...sharedContentProps}
        workspace={challengeWorkspace}
        onHintRevealed={handleHintLevelRevealed}
      />
    );
```

with:

```tsx
    rightKind = "pane";
    // The workspace's brief and help live in its editor pane (spec
    // 2026-10-10), so its left slot renders nothing.
    shellLeft = challengeWorkspace ? null : (
      <StepChallenge
        {...sharedContentProps}
        onHintRevealed={handleHintLevelRevealed}
      />
    );
```

In the same branch's right `<LessonContent`, add after `exerciseWorkspace={challengeWorkspace}`:

```tsx
          onHintRevealed={
            challengeWorkspace ? handleHintLevelRevealed : undefined
          }
```

In the `<LessonShell` props, make `left` null when `shellLeft` is null. Change `left={` followed by `<div` and `key={currentStep}` to:

```tsx
          left={
            shellLeft === null ? null : (
              <div
                key={currentStep}
```

and close the parenthesis after that div's closing `</div>` (before `}` and `right={shellRight}`). Let Prettier reindent.

In `function StepChallenge`, remove the `workspace` prop entirely:
- delete `workspace = false,` from the destructuring and `workspace?: boolean;` from its type;
- change `<div className={workspace ? "challenge-task-panel" : undefined}>` to `<div>`;
- change `{worldSlug === "deep-orbit" && !workspace && (` to `{worldSlug === "deep-orbit" && (`;
- delete the `exerciseWorkspace={workspace}` line from its `<LessonContent`.

Do not retype the `PhaseChip` line above them. It holds a unicode escape that tool parameters would decode.

- [ ] **Step 8: Drop the workspace branch from `ExerciseBrief`**

Replace `packages/ui/src/mdx/exercise-brief.tsx` with:

```tsx
"use client";

import { useContext } from "react";
import { useScheme } from "../use-scheme";
import { InstructionText } from "./instruction-text";
import { HintPanel } from "./hint-panel";
import {
  ExerciseDataContext,
  ExerciseNotFound,
  difficultyConfig,
  mlContentConfig,
} from "./exercise-data";

interface ExerciseBriefProps {
  slug: string;
  /** The exercise's own ladder reports here, like the lesson-level one. */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}

/* The exercise's chips, title, instructions and its own hint ladder, for
   the Challenge step's reading column (spec 2026-09-24, section 3). The
   pane (exercise.tsx with brief="external") keeps the editor. Rendered
   inside .lesson-prose, so the title pins every property the prose h3
   rule sets, as LearningObjectives does for its heading. The challenge
   workspace's brief is TaskStopsBrief, inside the pane (spec 2026-10-10). */
export function ExerciseBrief({ slug, onHintRevealed }: ExerciseBriefProps) {
  const exercise = useContext(ExerciseDataContext).get(slug);
  const scheme = useScheme();
  if (!exercise) return <ExerciseNotFound slug={slug} />;
  const diff = difficultyConfig[exercise.difficulty];
  const diffColor = scheme === "light" ? diff.light : diff.color;
  const ml = exercise.mlContent ? mlContentConfig[exercise.mlContent] : null;
  const mlTone = ml ? (scheme === "light" ? ml.light : ml.tone) : null;
  return (
    <div data-testid="exercise-brief" className="my-6">
      {/* Wraps between whole items only (the phone fix, section 3). */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="whitespace-nowrap text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          <span className="text-base" aria-hidden="true">
            ⚡
          </span>{" "}
          Exercise
        </span>
        <span
          className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
          style={{ background: `${diffColor}15`, color: diffColor }}
          title="Cognitive difficulty"
        >
          {diff.label}
        </span>
        {ml && mlTone && (
          <span
            className="whitespace-nowrap text-xs font-mono font-medium px-2 py-0.5"
            style={{ background: `${mlTone}15`, color: mlTone }}
            title="ML content axis: what skill the exercise actually builds"
            data-testid="mlcontent-badge"
          >
            {ml.label}
          </span>
        )}
        <span className="whitespace-nowrap text-xs text-text-muted">
          ~{exercise.estimatedMinutes} min
        </span>
      </div>
      <h3
        className="text-lg font-semibold mb-2 text-text-primary"
        style={{
          marginTop: 0,
          marginBottom: "0.5rem",
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "var(--tc-text)",
        }}
      >
        {exercise.title}
      </h3>
      <InstructionText
        text={exercise.instructions}
        className="text-sm leading-relaxed mb-4 text-text-primary/65"
      />
      {exercise.hints && exercise.hints.length > 0 && (
        <div data-testid="exercise-hints">
          <HintPanel hints={exercise.hints} onHintRevealed={onHintRevealed} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Remove the `inline` presentation**

In `packages/ui/src/mdx/hint-panel.tsx`:
- delete `presentation?: "ladder" | "inline";` from `HintPanelProps`;
- replace the whole `export function HintPanel(...) {...}` with:

```tsx
export function HintPanel({ hints, onHintRevealed }: HintPanelProps) {
  const ladder = useHintLadder(hints, onHintRevealed);
  if (ladder.hints.length === 0) return null;

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <RevealAnnouncer ladder={ladder} />

      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-4 text-text-muted">
        Need a hint?
      </h4>

      <div className="flex flex-col gap-3">
        {ladder.hints.map((hint, index) => {
          const config = levelConfig[hint.level];
          const isRevealed = index <= ladder.revealedLevel;
          const isNext = index === ladder.revealedLevel + 1;

          return (
            <div key={hint.level}>
              {isRevealed ? (
                <div
                  // tabIndex -1 keeps this out of the tab sequence while
                  // still being programmatically focusable, so the reader
                  // lands on the hint it just asked for rather than <body>.
                  ref={
                    index === ladder.revealedLevel
                      ? ladder.revealedRef
                      : undefined
                  }
                  tabIndex={index === ladder.revealedLevel ? -1 : undefined}
                  className="p-3 bg-surface outline-none"
                >
                  <span
                    className="text-xs font-mono font-semibold uppercase tracking-widest block mb-1"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                  <HintBody
                    hint={hint}
                    className="text-sm leading-relaxed text-text-primary/80"
                  />
                </div>
              ) : isNext ? (
                <button
                  onClick={ladder.reveal}
                  className="w-full text-left p-3 transition-colors duration-100 hover:bg-surface border border-dashed border-border brutalist-hover"
                  style={{ color: config.color }}
                >
                  <span className="text-xs font-medium">
                    {`Reveal ${config.label} →`}
                  </span>
                </button>
              ) : (
                // opacity-40 rendered the locked label at 2.31:1, and the
                // opacity-75 that replaced it still failed in the light
                // scheme (#555555 at 75% over white computes to #808080,
                // 3.94:1, axe, 2026-07-23). WCAG 1.4.3 arguably exempts an
                // inactive component, but the label is what tells you which
                // hint is locked, so it has to be readable. No opacity: the
                // muted token alone is AA in both schemes, and the dashed
                // border carries the locked affordance.
                <div className="p-3 border border-dashed border-border text-text-muted">
                  <span className="text-xs">{config.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

In `hint-panel.test.tsx`, delete the first test, "reveals inline help directly, preserving progressive hints and analytics". The split-ladder tests cover that path now.

- [ ] **Step 10: Run the web and UI tests**

Run: `pnpm exec vitest run "apps/web/app/worlds/[slug]/[module]/[lesson]" packages/ui/src/mdx`
Expected: PASS, including the five tests from Steps 1 to 3.

Run: `pnpm typecheck`
Expected: exit 0, no errors.

### Task 9: The content copy

**Files:**
- Modify: `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml`
- Modify: `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx` (frontmatter `hints`)
- Modify: `packages/content/__tests__/metadata-consistency.test.ts` (line 354)

- [ ] **Step 1: The brief's copy**

Replace the whole `taskBrief:` block of `create-a-tensor.yaml` with:

```yaml
taskBrief:
  steps:
    - title: "Create the tensor"
      instruction: "Set `reading` to:"
      code: "tf.tensor(streamValues)"
      target: reading
    - title: "Read its shape"
      instruction: "Set `shape` to:"
      code: "reading.shape"
      result: "Expect `[5]`: a list of five readings."
      target: shape
  support: "TensorFlow.js is loaded as `tf`. Leave the other lines as they are."
  expectedTensor:
    values: [0.12, 0.94, 0.31, 0.88, 0.47]
    shape: [5]
```

- [ ] **Step 2: The two-rung ladder**

In `01-introduction-to-tensors.mdx`, replace the frontmatter `hints:` block, all three entries, with:

```yaml
hints:
  - level: nudge
    content: "Select Line 3 or Line 4 above the code. It highlights that line’s `null`, so you can type the new code over it."
  - level: guidance
    content: "`shape` is a property, so `reading.shape` takes no parentheses. Pass `streamValues` on its own: wrapping it in another pair of brackets makes the shape `[1, 5]`."
```

The apostrophe in "line’s" is the curly U+2019, as in the file's other hints. Type the character itself.

- [ ] **Step 3: Lower the Gate B count pin**

In `packages/content/__tests__/metadata-consistency.test.ts`, replace `const EXPECTED_SOLUTION_HINTS = 56;` with:

```ts
// 56 -> 55 (2026-10-10): introduction-to-tensors drops its solution rung.
// Its challenge brief prints both lines, and Show Solution stays (spec
// 2026-10-10, decision 4).
const EXPECTED_SOLUTION_HINTS = 55;
```

- [ ] **Step 4: Rebuild and run the content gates**

Run: `pnpm turbo build:content --force`
Expected: exit 0.

Run: `pnpm exec vitest run packages/content`
Expected: PASS. That includes `metadata-consistency`, `guidance-hint-dictation`, `slop-lexicon`, `em-dash-ban`, `contract` and `task-brief-lines`.

### Task 10: The styles

**Files:**
- Modify: `apps/web/app/components/lesson-visuals/lesson-visuals.css`

The line numbers below are where each rule STARTS, before this task. Delete rules by selector, each whole (selector, braces and body), never by line range: the grid rule `.lesson-challenge-workspace [data-exercise-workspace] {` sits right after the old brief rules and must stay.

- [ ] **Step 1: Delete the rules the new design replaces**

Delete exactly these rules:
1. Inside `@media (max-width: 639px)` (line 1139): `.lesson-challenge-workspace .challenge-task-steps` (line 1140) and `.lesson-challenge-workspace [data-solution-action]` (line 1161). Keep the block's other rules.
2. Inside `@media (max-width: 1023px)` (line 1119): `.challenge-task-panel .lesson-step-content` (line 1120) and `.challenge-task-panel .challenge-hints` (line 1124). Keep the block's other rules.
3. The hint rules: `.lesson-challenge-workspace .challenge-hints` (1001), `.challenge-hint-action` (1004), `.challenge-hint-action svg` (1020), `.challenge-hint-action:hover` (1024), the shared `.challenge-hint-action:focus-visible, .challenge-hint-content:focus-visible` rule (1028), `.challenge-hint-content` (1033), `.challenge-hint-title` (1037) and `.lesson-challenge-workspace .challenge-hint-content p` (1044).
4. `.lesson-challenge-workspace [data-exercise-workspace] > div:first-child` (957) and `.lesson-challenge-workspace .challenge-editor-heading` (963).
5. The old brief: every rule from `.challenge-task-panel` (864) through `.lesson-challenge-workspace .challenge-task-support` (945), that is, `.challenge-task-panel`, `.challenge-task-panel .lesson-prose`, `.challenge-task-panel .lesson-step-content`, `.challenge-task-panel .challenge-hints`, `.lesson-challenge-workspace .challenge-task-instructions p`, `.lesson-challenge-workspace .challenge-task-steps`, `.lesson-challenge-workspace .challenge-task-steps > li`, `.challenge-task-number`, `.lesson-challenge-workspace .challenge-task-step h4`, `.lesson-challenge-workspace .challenge-task-step pre`, `.lesson-challenge-workspace .challenge-task-step pre code`, `.lesson-challenge-workspace .challenge-task-result` and `.lesson-challenge-workspace .challenge-task-support`.

Keep `.lesson-challenge-workspace [data-testid="exercise-brief"]` (line 881), which sits inside that range but is not in the list: it sets `margin: 0`, and the new brief carries the same test id.

Then run `grep -n "challenge-task\|challenge-editor-heading\|challenge-hint" apps/web/app/components/lesson-visuals/lesson-visuals.css`. Expected: no output. Also confirm that `grep -n "\[data-exercise-workspace\] {" apps/web/app/components/lesson-visuals/lesson-visuals.css` still finds the grid rule.

- [ ] **Step 2: Add the brief, marks and help styles**

Insert this block directly after the rule `.lesson-challenge-workspace [data-exercise-workspace] p` (the one setting `font-size: 14px; line-height: 1.6;`). `.lesson-challenge-workspace .challenge-hint-content p` ties that rule's specificity, so it must come after it.

```css
/* The challenge brief: the lines to finish, as the head of the editor
   column (spec 2026-10-10). It renders inside the pane's .lesson-prose, so
   every rule here outranks the prose rules, which reach (0,1,2) at most:
   globals.css `.lesson-prose :not(pre) > code` would turn the code into a
   bordered 0.85em chip again. Brass marks help only, and appears here for
   the first time on purpose: --iv-brass is otherwise scoped to the
   workbench and the mission scene. */
.lesson-challenge-workspace {
  --iv-brass: #c1a678;
}
[data-scheme="light"] .lesson-challenge-workspace {
  --iv-brass: #7c5a23;
}
.lesson-challenge-workspace .challenge-brief {
  grid-column: 1;
  grid-row: 1;
  container-type: inline-size;
  margin: 0;
  padding: 20px 24px 22px;
  background: var(--tc-surface);
}
.lesson-challenge-workspace .challenge-brief h3 {
  margin: 0;
  color: var(--tc-text);
  font-size: 20px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.lesson-challenge-workspace .challenge-brief .challenge-brief-note p {
  margin: 4px 0 0;
  color: var(--tc-muted);
  font-size: 15px;
  line-height: 1.6;
}
.lesson-challenge-workspace .challenge-brief code {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tc-text);
  font-family: var(--font-mono), monospace;
  font-size: 0.93em;
  font-weight: 500;
}
.lesson-challenge-workspace .challenge-stops {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}
.lesson-challenge-workspace .challenge-stops > li {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 6px;
  align-items: baseline;
  margin: 0;
  padding: 0;
}
.lesson-challenge-workspace .challenge-stop-key {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -10px 0 -10px -8px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--tc-primary);
  font:
    600 13px/1.4 var(--font-mono),
    monospace;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  white-space: nowrap;
  cursor: pointer;
}
/* A neutral wash: primary text on the green code wash measures 4.12:1 in
   dark, under AA; on this one it measures 4.87:1 (5.77:1 light). */
.lesson-challenge-workspace .challenge-stop-key:hover {
  background: color-mix(in srgb, var(--tc-text) 7%, var(--tc-surface));
  text-decoration-thickness: 2px;
}
.lesson-challenge-workspace .challenge-stop-key:focus-visible {
  outline: 2px solid var(--tc-primary);
  outline-offset: 2px;
}
.lesson-challenge-workspace .challenge-stop-key[aria-disabled="true"] {
  cursor: default;
}
.lesson-challenge-workspace .challenge-brief .challenge-stop-title {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
  color: var(--tc-text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
}
.lesson-challenge-workspace .challenge-stop-do {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
}
.lesson-challenge-workspace .challenge-brief .challenge-stop-instruction p {
  margin: 0;
  color: var(--tc-text);
  font-size: 15px;
  line-height: 1.5;
}
/* The code to type: the editor's own 16 px, on the one green wash. */
.lesson-challenge-workspace .challenge-brief code.challenge-stop-code {
  display: inline-block;
  padding: 2px 10px;
  background: color-mix(in srgb, var(--tc-primary) 20%, var(--tc-surface));
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
[data-scheme="light"]
  .lesson-challenge-workspace
  .challenge-brief
  code.challenge-stop-code {
  background: color-mix(in srgb, var(--tc-primary) 12%, var(--tc-surface));
}
.lesson-challenge-workspace .challenge-stop-result {
  grid-column: 2;
  grid-row: 3;
}
.lesson-challenge-workspace .challenge-brief .challenge-stop-result p {
  margin: 0;
  color: var(--tc-muted);
  font-size: 14px;
  line-height: 1.5;
}
/* Typed: the line holds the code shown. The stop goes quiet and nothing
   moves; Run Tests still decides pass or fail. */
.lesson-challenge-workspace
  .challenge-stops
  > li[data-stop-state="typed"]
  .challenge-stop-key {
  color: var(--tc-muted);
  text-decoration-color: transparent;
}
.lesson-challenge-workspace
  .challenge-stops
  > li[data-stop-state="typed"]
  :is(.challenge-stop-title, p) {
  color: var(--tc-muted);
}
.lesson-challenge-workspace
  .challenge-stops
  > li[data-stop-state="typed"]
  code.challenge-stop-code {
  background: transparent;
  color: var(--tc-muted);
}
/* A wide brief: one row per stop, the result under its code. */
@container (min-width: 720px) {
  .lesson-challenge-workspace .challenge-stops {
    gap: 12px;
  }
  .lesson-challenge-workspace .challenge-stops > li {
    grid-template-columns: 4.5rem 10.5rem 8.5rem minmax(0, 1fr);
    align-items: center;
    row-gap: 4px;
  }
  .lesson-challenge-workspace .challenge-stop-do {
    display: contents;
  }
  .lesson-challenge-workspace .challenge-stop-instruction {
    grid-column: 3;
    grid-row: 1;
  }
  .lesson-challenge-workspace .challenge-brief code.challenge-stop-code {
    grid-column: 4;
    grid-row: 1;
    justify-self: start;
  }
  .lesson-challenge-workspace .challenge-stop-result {
    grid-column: 4;
    grid-row: 2;
  }
}
/* A narrow brief: the code always takes its own line, so every stop reads
   the same way. */
@container (max-width: 480px) {
  .lesson-challenge-workspace .challenge-stops > li {
    grid-template-columns: 4rem minmax(0, 1fr);
  }
  .lesson-challenge-workspace .challenge-stop-do {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .lesson-challenge-workspace .challenge-brief code.challenge-stop-code {
    padding: 2px 8px;
    font-size: 15px;
  }
}
/* In the editor: a waiting line's null gets a tight frame inside its glyph
   box (5.65:1 dark, 6.64:1 light), and the number of a line still to finish
   turns primary. No line wash: it loses to the focused active line. */
.lesson-challenge-workspace .cm-editor .cm-task-slot {
  box-shadow: inset 0 0 0 1px var(--tc-primary);
  padding: 0 3px;
  margin: 0 -3px;
}
.lesson-challenge-workspace .cm-editor .cm-gutterElement.cm-task-line {
  color: var(--tc-primary);
  font-weight: 700;
}
/* Help sits with Show Solution under the code; its rungs open above the
   actions, so the code never moves (spec 2026-10-10, section 2). */
.lesson-challenge-workspace .challenge-hint-content {
  margin-top: 12px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--tc-text) 6%, var(--tc-surface));
}
.lesson-challenge-workspace .challenge-hint-content:focus-visible {
  outline: 2px solid var(--tc-primary);
  outline-offset: 2px;
}
.lesson-challenge-workspace .challenge-hint-title {
  display: block;
  color: var(--iv-brass);
  font-size: 14px;
  font-weight: 600;
}
.lesson-challenge-workspace .challenge-hint-content p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.7;
}
.lesson-challenge-workspace .challenge-hint-content code {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tc-text);
  font-size: 0.93em;
  font-weight: 500;
}
/* Scoped under [data-editor-frame] to outrank the frame's button rule,
   `.lesson-challenge-workspace [data-editor-frame] button` (0,2,1), which
   would otherwise set the label to 13 px. */
.lesson-challenge-workspace [data-editor-frame] .challenge-hint-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: var(--tc-text);
  font-family: var(--font-sans), sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.lesson-challenge-workspace [data-editor-frame] .challenge-hint-action svg {
  flex-shrink: 0;
  color: var(--iv-brass);
}
.lesson-challenge-workspace [data-editor-frame] .challenge-hint-action:hover {
  background: color-mix(in srgb, var(--tc-text) 7%, var(--tc-surface));
}
.lesson-challenge-workspace
  [data-editor-frame]
  .challenge-hint-action:focus-visible {
  outline: 2px solid var(--tc-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Phone rules**

Inside the existing `@media (max-width: 639px)` block, add:

```css
  .lesson-challenge-workspace .challenge-brief {
    padding: 18px 16px;
  }
  .lesson-challenge-workspace .challenge-brief h3 {
    font-size: 18px;
  }
  .lesson-challenge-workspace .challenge-brief .challenge-brief-note p {
    font-size: 14px;
  }
  /* The help pair takes its own row under Run Tests and Reset, flush with
     their left edge. */
  .lesson-challenge-workspace [data-help-group] {
    flex-basis: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
  /* No side padding on phones, so the pair fits one row even at 320 px
     (it needs 236 px of the 246 px there). */
  .lesson-challenge-workspace
    [data-editor-frame]
    [data-help-group]
    .challenge-hint-action {
    padding-left: 0;
    padding-right: 0;
  }
  .lesson-challenge-workspace [data-help-group] [data-solution-action] {
    padding-right: 0;
  }
```

- [ ] **Step 4: Gates on the stylesheet**

Run: `git diff -U0 -- apps/web/app/components/lesson-visuals/lesson-visuals.css | grep '^+' | grep -n 'border-left\|border-inline-start'`
Expected: no output. The file already holds five neutral pane dividers (lines 236, 1055, 1135, 1182 and 1209 before this task); this task must add no `border-left` of any kind. `git diff` only reads the working tree.

Run: `pnpm exec vitest run packages/content/__tests__/em-dash-ban.test.ts`
Expected: PASS.

### Task 11: The end-to-end contract

**Files:**
- Modify: `e2e/challenge-workspace.spec.ts` (full replacement)
- Modify: `e2e/lesson-layout.spec.ts` (lines 710 to 731)
- Modify: `e2e/exercise-run.spec.ts` (lines 104 to 111)
- Modify: `e2e/lesson-continuity.spec.ts` (lines 169 to 171)
- Modify: `e2e/lesson-characters.spec.ts` (lines 74 to 78)
- Modify: `e2e/editor-drafts.spec.ts` (lines 17 to 21)

- [ ] **Step 1: Replace `e2e/challenge-workspace.spec.ts`**

```ts
import path from "node:path";
import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const SCREENSHOT_STYLE = readFileSync(
  path.join(__dirname, "visual/screenshot.css"),
  "utf8",
);

for (const [width, scheme] of [
  [1920, "light"],
  [1440, "dark"],
  [1024, "dark"],
  [390, "dark"],
  [320, "light"],
] as const) {
  test(`tensor challenge stays connected at ${width}px ${scheme}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("tc-cookie-consent", "declined");
      localStorage.setItem("tc-script-skip", "1");
      localStorage.setItem(
        "tc_step_v2_deep-orbit_introduction-to-tensors",
        "2",
      );
      localStorage.setItem(
        "tc_step_max_v2_deep-orbit_introduction-to-tensors",
        "2",
      );
    });
    await page.goto(LESSON, { waitUntil: "domcontentloaded" });
    const workspace = page.locator(".lesson-challenge-workspace");
    const mission = workspace.locator(".challenge-mission-header");
    const pane = page.locator("[data-exercise-workspace]");
    const brief = pane.getByTestId("exercise-brief");
    const codeFrame = pane.locator("[data-editor-frame]");
    const editor = codeFrame.locator(".cm-content");
    const line = (n: number) => editor.locator(".cm-line").nth(n - 1);

    // Measured before anything scrolls: line 3 is on the first screen.
    await expect(line(3)).toBeAttached({ timeout: 30_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect
      .poll(() =>
        mission
          .locator("img")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
    if (width === 1440) {
      const line3Bottom = await line(3).evaluate(
        (el) => el.getBoundingClientRect().bottom + window.scrollY,
      );
      expect(line3Bottom).toBeLessThanOrEqual(900);
    }

    await codeFrame.scrollIntoViewIfNeeded();
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    await expect(
      workspace.getByRole("heading", {
        name: "Prepare the Five Readings",
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(brief.getByRole("heading", { level: 3 })).toHaveText(
      "Finish lines 3 and 4",
    );
    await expect(
      workspace.getByRole("heading", { name: "Challenge", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("group", { name: "Challenge view" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("bridge-hint")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Pass 1 more exercise to continue" }),
    ).toBeDisabled();

    const headerBox = (await mission.boundingBox())!;
    const gridBox = (await page.getByTestId("lesson-grid").boundingBox())!;
    const briefBox = (await brief.boundingBox())!;
    const codeBox = (await codeFrame.boundingBox())!;
    const checksBox = (await page.locator(".challenge-checks").boundingBox())!;
    expect(headerBox.width).toBeGreaterThanOrEqual(gridBox.width);
    expect(gridBox.width).toBeLessThanOrEqual(1440);
    expect(headerBox.y + headerBox.height).toBeLessThan(gridBox.y);
    // The brief heads the code: the frame starts where the brief ends.
    expect(codeBox.y).toBeGreaterThanOrEqual(briefBox.y + briefBox.height - 1);
    expect(codeBox.y - (briefBox.y + briefBox.height)).toBeLessThanOrEqual(1);
    if (width === 1440) expect(briefBox.height).toBeLessThanOrEqual(230);
    if (width === 390) expect(briefBox.height).toBeLessThanOrEqual(360);
    if (width >= 1024) {
      expect(codeBox.x + codeBox.width).toBeLessThanOrEqual(checksBox.x + 1);
      expect(codeBox.width).toBeLessThan(910);
      expect(checksBox.width).toBeGreaterThan(300);
    } else {
      expect(checksBox.y).toBeGreaterThanOrEqual(codeBox.y + codeBox.height);
    }

    // Each key names a line the editor marks, and both nulls are framed.
    await expect(
      brief.getByRole("button", { name: /^Line \d+$/ }),
    ).toHaveText(["Line 3", "Line 4"]);
    await expect(
      codeFrame.locator(".cm-gutterElement.cm-task-line"),
    ).toHaveText(["3", "4"]);
    await expect(codeFrame.locator(".cm-task-slot")).toHaveText([
      "null",
      "null",
    ]);
    if (width === 390) {
      // Each step's code stays within a keyboard-open screen of its line.
      for (const [index, n] of [
        [0, 3],
        [1, 4],
      ] as const) {
        const chipTop = await brief
          .locator("code.challenge-stop-code")
          .nth(index)
          .evaluate((el) => el.getBoundingClientRect().top);
        const lineBottom = await line(n).evaluate(
          (el) => el.getBoundingClientRect().bottom,
        );
        expect(lineBottom - chipTop).toBeLessThanOrEqual(320);
      }
    }

    await expect(
      page
        .getByRole("list", { name: "Expected sensor readings" })
        .getByRole("listitem"),
    ).toHaveText(["0.12", "0.94", "0.31", "0.88", "0.47"]);
    await expect(page.getByText("3 / 5", { exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const scroller = codeFrame.locator(".cm-scroller");
    expect(
      await scroller.evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      (
        await new AxeBuilder({ page })
          .include(".lesson-challenge-workspace")
          .analyze()
      ).violations,
    ).toEqual([]);

    await page.screenshot({
      path: testInfo.outputPath(`challenge-${width}-${scheme}.png`),
      fullPage: true,
      style: SCREENSHOT_STYLE,
    });

    // A Line key selects its null; typing replaces it and quiets the stop.
    await brief.getByRole("button", { name: "Line 3" }).click();
    await expect(editor).toBeFocused();
    await page.keyboard.insertText("tf.tensor(streamValues)");
    // The key selected exactly the null: typing replaced it and nothing else.
    await expect(line(3)).toHaveText("const reading = tf.tensor(streamValues);");
    await expect(brief.locator(".challenge-stops > li").first()).toHaveAttribute(
      "data-stop-state",
      "typed",
    );
    await expect(codeFrame.locator(".cm-task-slot")).toHaveCount(1);
    // Reset replaces the whole document; the frames come back.
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(codeFrame.locator(".cm-task-slot")).toHaveText([
      "null",
      "null",
    ]);
    await expect(brief.locator(".challenge-stops > li").first()).toHaveAttribute(
      "data-stop-state",
      "waiting",
    );

    // Help opens under the code and leaves the code where it was.
    const codeTop = () =>
      editor.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const before = await codeTop();
    await page.getByRole("button", { name: "Get a nudge" }).focus();
    await page.keyboard.press("Enter");
    const rungs = page.locator(".challenge-hints");
    await expect(rungs.locator("[tabindex='-1']")).toBeFocused();
    await expect(rungs.getByRole("status")).toHaveText("Nudge revealed.");
    await expect(
      page.getByRole("button", { name: "Get more guidance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reveal solution" }),
    ).toHaveCount(0);
    expect(Math.abs((await codeTop()) - before)).toBeLessThanOrEqual(1);

    // Returning from the concept lands at the whole mission, including
    // the scene above the task, instead of scrolling straight past it.
    await page
      .getByRole("button", { name: "Step 2: Concept", exact: true })
      .click();
    await page.getByRole("button", { name: "Continue →", exact: true }).click();
    await expect(workspace).toBeFocused();
    await expect(mission).toBeInViewport({ ratio: 0.8 });

    // A resize does not switch between hidden instruction and editor views.
    // The learner's in-progress code remains in the same mounted editor.
    await codeFrame.scrollIntoViewIfNeeded();
    await editor.fill("// My tensor draft\nconst reading = null;");
    await page.setViewportSize({
      width: width >= 1024 ? 390 : 1440,
      height: 900,
    });
    await expect(editor).toHaveCount(1);
    await expect(editor).toBeVisible();
    await expect(brief).toBeVisible();
    await expect(editor).toContainText("// My tensor draft");
  });
}
```

- [ ] **Step 2: Rewrite the layout test that pinned the old partition**

In `e2e/lesson-layout.spec.ts`, replace the test `"the exercise brief precedes the code and checks workbench"` (lines 710 to 731) with:

```ts
  test("the workspace brief heads the editor column, above the code", async ({
    page,
  }) => {
    await openStep(page, LESSONS.paragraphLed, 2);
    const pane = page.locator("[data-testid='lesson-right'][data-kind='pane']");
    const brief = pane.getByTestId("exercise-brief");
    await expect(brief).toBeVisible({ timeout: 30000 });
    // One h3 in the pane, the brief's own (spec 2026-10-10).
    await expect(pane.locator("h3")).toHaveCount(1);
    await expect(brief.getByRole("heading", { level: 3 })).toHaveText(
      "Finish lines 3 and 4",
    );
    await expect(pane.locator(".cm-content")).toBeVisible({ timeout: 30000 });
    // One exercise: the pane's eyebrow carries no title.
    await expect(pane.getByTestId("exercise-pane-title")).toHaveCount(0);
    const m = await page.evaluate(() => {
      const box = (s: string) =>
        document.querySelector(s)!.getBoundingClientRect();
      return {
        briefBottom: box("[data-testid='exercise-brief']").bottom,
        frameTop: box("[data-editor-frame]").top,
      };
    });
    expect(m.briefBottom).toBeLessThanOrEqual(m.frameTop + 1);
  });
```

- [ ] **Step 3: Restate the 65 px rule for the new first row**

In `e2e/exercise-run.spec.ts`, replace:

```ts
    // Results must not stretch the editor's title row into an empty panel.
    const workspaceBox = (await page
      .locator("[data-exercise-workspace]")
      .boundingBox())!;
    const editorFrameBox = (await page
      .locator("[data-editor-frame]")
      .boundingBox())!;
    expect(editorFrameBox.y - workspaceBox.y).toBeLessThan(65);
```

with:

```ts
    // Results must not stretch the brief's row into an empty panel: the
    // editor frame still starts where the brief ends (spec 2026-10-10).
    const briefBox = (await page.getByTestId("exercise-brief").boundingBox())!;
    const editorFrameBox = (await page
      .locator("[data-editor-frame]")
      .boundingBox())!;
    expect(
      Math.abs(editorFrameBox.y - (briefBox.y + briefBox.height)),
    ).toBeLessThanOrEqual(1);
```

- [ ] **Step 4: Give the continuity check time for the editor chunk**

The brief now renders with the dynamically loaded `Exercise`. In `e2e/lesson-continuity.spec.ts`, change:

```ts
    await expect(page.getByTestId("exercise-brief")).toContainText(
      "five readings",
    );
```

to:

```ts
    await expect(page.getByTestId("exercise-brief")).toContainText(
      "five readings",
      { timeout: 30_000 },
    );
```

- [ ] **Step 5: Retarget the Challenge step's character-mention check**

`e2e/lesson-characters.spec.ts` hovers a character mention inside the brief. Today the only one is "Farah" in the old support line, which Task 9 removes. The mission header's "Demir" is a mention on the same step (verified on the live page: a `[data-character-mention="Ensign Demir"]` button whose tooltip opens on hover). Replace:

```ts
  await page
    .locator('[data-testid="exercise-instructions"] [data-character-mention]')
    .first()
    .hover();
```

with:

```ts
  // The challenge brief names no character since 2026-10-10; the mission
  // header's "Demir" is the Challenge step's mention.
  await page
    .locator(".challenge-mission-header [data-character-mention]")
    .first()
    .hover();
```

- [ ] **Step 6: Fix the drafts spec's phone toggle (red on main already)**

`e2e/editor-drafts.spec.ts` clicks an "Editor" toggle below 1024 px, but `lesson-steps.tsx` renders no Instructions/Editor toggle in the challenge workspace (`mobileControls` is null when `challengeWorkspace` is true). The 390 px case fails on main today, with or without this change. Replace:

```ts
    async function openEditor() {
      if (width < 1024)
        await page.getByRole("button", { name: "Editor", exact: true }).click();
      await expect(page.locator(".cm-content").first()).toBeVisible();
    }
```

with:

```ts
    async function openEditor() {
      // The challenge workspace shows the editor at every width; this
      // lesson has no Instructions/Editor toggle.
      await expect(page.locator(".cm-content").first()).toBeVisible();
    }
```

- [ ] **Step 7: Build and run the affected specs (local CI recipe)**

```bash
rm -rf apps/web/.next
export NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
       NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_placeholder_anon_key \
       NEXT_PUBLIC_API_URL=http://localhost:3998 \
       SUPABASE_URL=https://placeholder.supabase.co \
       SUPABASE_SERVICE_ROLE_KEY=sb_placeholder_service_role_key
pnpm turbo build --filter @tensorcraft/web
CI=1 PW_PORT=3117 npx playwright test e2e/challenge-workspace.spec.ts e2e/lesson-layout.spec.ts e2e/exercise-run.spec.ts e2e/lesson-continuity.spec.ts e2e/lesson-characters.spec.ts e2e/editor-drafts.spec.ts e2e/accessibility.spec.ts e2e/exercise-autocomplete.spec.ts --project=chromium --reporter=line > /tmp/task-stops-e2e.log 2>&1; echo "exit: $?"
grep -E "passed|failed|flaky" /tmp/task-stops-e2e.log | tail -5
```

Expected: `exit: 0`, all passed. Two notes from the plan review:
- `accessibility.spec.ts` line 127 (the Challenge-step axe audits, dark and light) fails on main today; with this change it passes, because no unhighlighted `pre code` is left on that step.
- `exercise-autocomplete.spec.ts` failed in main's last CI run but passed locally, so it looks flaky. If it alone fails, rerun it once. Report a second failure; do not mask it.

Then run the full suite once, the way CI does: `CI=1 PW_PORT=3117 npx playwright test --project=chromium --reporter=line > /tmp/task-stops-e2e-all.log 2>&1; echo "exit: $?"`. Read every failure in the log.

The plan review (2026-10-10) ran this with the plan applied: 244 passed, 37 skipped, 7 failed. All 7 fail identically on main (CI run 37980810651), and none comes from this change:

| Failing test | Cause on main |
| --- | --- |
| `lesson-phase-migration.spec.ts:31` | Expects the lesson-nav Continue on this lesson's passed Challenge step; the workspace hides it once the exercise passes (since commit 2b293a42) |
| `script-playback.spec.ts:110` | Expects a Briefing heading, "Create and check your tensor", that no longer exists |
| `ui-remediation.spec.ts:82` | Clicks the phone "Editor" toggle the workspace never renders (the same cause Step 6 fixes in `editor-drafts`) |
| `worlds.spec.ts:92`, `:123`, `:168` | Look for "introduction to tensors"; the lesson is now titled "From JavaScript Arrays to Tensors" |
| `worlds.spec.ts:175` | Expects 6 step buttons; the lesson has 5 phases |

Any failure NOT in this table needs a cause before you continue. Do not fix these seven here; they are the owner's call. Never pipe Playwright into `tail`: the pipe reports exit 0 on failures. `NEXT_PUBLIC_API_URL` points at the dead port 3998 on purpose, because 3001 is the owner's app. `exercise-run.spec.ts` needs network access for the TFJS CDN.

`next build` rewrites `apps/web/next-env.d.ts`. Restore it afterwards: `git checkout -- apps/web/next-env.d.ts`. That restores a working-tree file; it is not a commit.

### Task 12: Docs, the visual check, full verification

**Files:**
- Modify: `docs/architecture.md` (rows at lines 252, 256 and 281)
- Modify: `docs/post-launch-backlog.md` (one new section)

- [ ] **Step 1: Update the component rows**

In `docs/architecture.md`, replace the `HintPanel` row with:

```markdown
| `HintPanel` | Client | 3-level progressive disclosure; `useHintLadder` holds one ladder's state, and `HintRungs` plus `HintButton` render it in two places for the challenge workspace's editor footer |
```

Replace the `ExerciseBrief` row with these four rows:

```markdown
| `ExerciseBrief` | Client | The exercise's chips, title, instructions and own hint ladder, rendered in the Challenge step's reading column; imports no Sandpack. The challenge workspace uses `TaskStopsBrief` instead |
| `TaskStopsBrief` | Client | The challenge workspace's brief, at the head of the editor column: a heading generated from the line numbers ("Finish lines 3 and 4") and one row per line to finish, whose Line key selects that line's placeholder; reads live lines and states from the task-stops store |
| `task-stops` (ui) | Client | CodeMirror StateField that rescans the editor text on every change, frames each waiting placeholder (`cm-task-slot`) and marks the line numbers still to finish (`cm-task-line`); its store feeds `TaskStopsBrief`, and `useTaskStops` keeps the extension array stable for Sandpack |
| `scanStops` (shared) | Pure | Finds each brief step's declaration and state (waiting, other code, typed, missing); the velite transform uses it for build-time lines and fails the build on a bad target |
```

In the `lesson-content.tsx` row, replace its final clause, `and the inline pane when no set is given |`, with:

```markdown
and the inline pane when no set is given; with `exerciseWorkspace`, the pane instance passes the lesson's `hints` to `Exercise` for the workspace footer and no lesson-level `HintPanel` renders |
```

- [ ] **Step 2: Compare the real page with the approved mockup**

With the build from Task 11 and the same environment variables exported, start the app on the screenshot port:

```bash
pnpm --filter @tensorcraft/web exec next start -p 3118
```

Run it in the background. Open `http://localhost:3118/worlds/deep-orbit/foundations/introduction-to-tensors` with Playwright at 1440 dark, 1440 light and 390 dark, with `localStorage` keys `tc-cookie-consent=declined`, `tc-script-skip=1`, `tc_step_v2_deep-orbit_introduction-to-tensors=2` and `tc_step_max_v2_deep-orbit_introduction-to-tensors=2` set before load. Take screenshots and compare them by eye with `docs/design-previews/challenge-task-stops/desktop-dark.png`, `desktop-light.png` and `phone.png`.

Check the brief layout, the 16 px code on its wash, the framed nulls, the green bold numbers 3 and 4, and help next to Show Solution. Also check that no inline code renders as a bordered chip, and that nothing on screen is under 12 px. Then stop the server you started; check `lsof -ti:3118` and kill only that PID.

- [ ] **Step 3: Record the two findings this work does not fix**

Per the backlog rule (deferred work is recorded in `docs/post-launch-backlog.md` and nowhere else), add this section directly above `## PostHog data audit follow-ups (2026-10-03)`:

```markdown
## Challenge task stops follow-ups (2026-10-10)

Found while planning the [challenge task stops](superpowers/specs/2026-10-10-challenge-task-stops-design.md) change.

- [ ] **Velite's `strict: true` does nothing.** velite 0.4's CLI declares
  `--strict` with a default of `false` and resolves
  `options.strict ?? config.strict`, so the CLI's `false` overrides the
  config and every content schema issue is only logged. Fix: run
  `velite build --strict` in `packages/content`'s `build:content` (the tree
  built cleanly with it on 2026-10-10). The task-brief transform throws
  instead, so it does not depend on this. Gate: owner call.
- [ ] **`e2e/exercise-autocomplete.spec.ts` flakes.** It failed in main's CI
  run before 2026-10-10 and passed locally. Find the race before it
  masks a real failure.
```

- [ ] **Step 4: Full verification**

Format the files this change touched, then run each command and read its exit code. CI runs `pnpm format:check`:

```bash
pnpm exec prettier --write packages/shared/src/scan-stops.ts packages/shared/src/scan-stops.test.ts packages/content/src/task-brief-lines.ts packages/content/src/task-brief-lines.test.ts packages/content/velite.config.ts packages/content/src/schemas.ts packages/ui/src/mdx/task-stops.ts packages/ui/src/mdx/task-stops.test.ts packages/ui/src/mdx/task-stops-brief.tsx packages/ui/src/mdx/task-stops-brief.test.tsx packages/ui/src/mdx/hint-panel.tsx packages/ui/src/mdx/hint-panel.test.tsx packages/ui/src/mdx/exercise.tsx packages/ui/src/mdx/exercise-brief.tsx packages/ui/src/mdx/exercise-workspace.test.ts "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx" "apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx" apps/web/app/components/lesson-visuals/lesson-visuals.css e2e/challenge-workspace.spec.ts e2e/lesson-layout.spec.ts e2e/exercise-run.spec.ts e2e/lesson-continuity.spec.ts e2e/lesson-characters.spec.ts e2e/editor-drafts.spec.ts
```

Re-run `pnpm exec vitest run packages/ui/src/mdx/exercise-workspace.test.ts packages/ui/src/mdx/exercise-brief.test.tsx` afterwards: those pins read source text, and they still pass after Prettier.

- `pnpm format:check`, expected exit 0.
- `pnpm turbo build:content --force`, expected exit 0.
- `pnpm test`, expected exit 0, every file passing.
- `pnpm typecheck`, expected exit 0, no errors.
- `pnpm lint`, expected exit 0.
- `grep -rn $'\xe2\x80\x94' packages/shared/src packages/ui/src/mdx packages/content/src apps/web/app/worlds apps/web/app/components/lesson-visuals e2e docs/architecture.md`, expected no output (no em dash in anything touched).

Use @superpowers:verification-before-completion. Report what ran and what it printed, not that it "should" pass.

- [ ] **Step 5: Checkpoint C (owner commits)**

Stop and hand over. Do not run git. Files for commit group C:
`packages/ui/src/mdx/exercise.tsx`, `packages/ui/src/mdx/exercise-workspace.test.ts`, `packages/ui/src/mdx/exercise-brief.tsx`, `packages/ui/src/mdx/hint-panel.tsx`, `packages/ui/src/mdx/hint-panel.test.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.test.tsx`, `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx`, `apps/web/app/components/lesson-visuals/lesson-visuals.css`, `packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml`, `packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx`, `packages/content/__tests__/metadata-consistency.test.ts`, `e2e/challenge-workspace.spec.ts`, `e2e/lesson-layout.spec.ts`, `e2e/exercise-run.spec.ts`, `e2e/lesson-continuity.spec.ts`, `e2e/lesson-characters.spec.ts`, `e2e/editor-drafts.spec.ts`, `docs/architecture.md`, `docs/post-launch-backlog.md`, plus the spec, the preview folder and this plan if they are not committed yet.
Suggested message: `feat(lesson): challenge task stops replace the lesson 1 brief`.
