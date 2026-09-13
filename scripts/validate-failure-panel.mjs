#!/usr/bin/env node
/**
 * Failure-panel gate: an exercise must not be passable from its own failure
 * text (audit round 5, 2026-09-08).
 *
 * THE FINDING. On the first Run of the UNTOUCHED starter, the results panel
 * prints fully specified graded values. `ExerciseResults` in
 * packages/ui/src/mdx/exercise.tsx renders every result's NAME and every
 * failure's MESSAGE verbatim, so a learner who clicks Run once, before
 * writing a line, is handed answers. That is a fourth answer channel after
 * the three rungs of the hint ladder, and it costs one click instead of
 * three reveals.
 *
 * Both channels leaked when this was found. The assertion MESSAGES did, in
 * the old wording ("Expected null to be close to 7.924248498846719" on
 * kalman-filter, "close to 0.960834264755249" on onnx-comparison, whose
 * entire point is that a memorised constant is the wrong answer). Rewording
 * `expect` to report the comparison instead of the expectation, which landed
 * in the same pass as this file, closed most of that channel. What the gate
 * reports now is almost entirely the other channel, the test NAMES, which
 * were never reworded and which quote their answers outright (measured
 * 2026-09-08):
 *
 *   build-layer            "quotes the right parameter count: 80 + 136 + 9"
 *   simple-attention       "softmax([1, 0]) gives a 0.731/0.269 blend"
 *   find-threshold         "picks the candidate with the max F1 (0.03 -> 0.857 ...)"
 *   reconstruction-error   "all-ones against zero output gives exactly 1.0"
 *   gradient-step          "two more calls to step() keep descending: 4.0 to 3.2 to 2.56"
 *
 * A name that says WHICH case it grades is doing its job. A name that says
 * what the case evaluates to is the answer key.
 *
 * THE RULE, in one sentence: running the untouched starter must not print a
 * number, or a sequence of numbers, that the exercise has not already given
 * the learner.
 *
 * HOW IT IS MEASURED, and why it is built this way:
 *
 *   1. The panel text is every result's `name` plus every failure's message,
 *      because that is exactly what the component renders.
 *   2. Answer atoms are pulled OUT OF THE PANEL TEXT, not out of testCode.
 *      Deliberate: a good share of the leaks are expectations the test
 *      computes at grade time (`toBeCloseTo(fixtureMean)`), which no scan of
 *      the test source can see, and the panel prints them all the same.
 *      Reading the rendered text also makes this gate independent of the
 *      assertion message FORMAT, which matters because the wording of those
 *      messages was rewritten in the same pass that added this file, and the
 *      gate went on reporting through the change. Nothing here parses
 *      "Expected X but got Y"; it looks for values.
 *   3. An atom is a number carrying a decimal point or three or more digits,
 *      or a bracketed all-numeric sequence of two or more elements. Bare one
 *      and two digit integers are counts and indices, which every instruction
 *      states anyway, and including them was measured to be noise.
 *   4. TWO different wrong submissions are run: the starter, and the
 *      registered ignorant solution in scripts/exercise-cheats/<slug>.js
 *      (falling back to a second starter run where no cheat is registered).
 *      Only atoms present in BOTH panels count, and that one intersection
 *      does two jobs. A fixture drawn at grade time ("on inputs drawn at
 *      random, so a memorised answer fails") differs between runs and drops
 *      out, because a value that changes cannot be copied. And a number the
 *      SUBMISSION produced drops out too, because two different wrong
 *      submissions produce different wrong numbers, while the grader's own
 *      expected value is identical in both. That is what keeps kalman-filter's
 *      "Got 110.25" out of the report: the starter's own smoothness, not an
 *      answer. Test names survive the intersection by construction, since
 *      both runs print the same names.
 *   5. A number the TEST FEEDS IN is not an answer. Numeric literals that
 *      appear in testCode outside its assertion arguments (and outside its
 *      test-name strings) are fixtures: the +5.0 DC offset compute-fft builds
 *      its probe signal from, the 20.5 cycles apply-window windows. Those are
 *      subtracted unless the same value is also asserted as an expectation.
 *   6. An atom is only a LEAK if the learner does not already have it: the
 *      exercise instructions, the starter code, and the lesson's own prose
 *      (context, concept, consequence and body) are subtracted first,
 *      whitespace-insensitively. A number sequence the learner was handed
 *      element by element ("16 units ... 8 units ... 1 unit" versus
 *      "[16, 8, 1]") is not a leak either.
 *
 * The harness is not reimplemented here. This script reads
 * scripts/validate-exercises.mjs at run time, strips its CLI entry point and
 * imports the rest, so the starter runs against the SAME stubs, the same
 * `expect` shim and the same timeout as the exercise validator, and cannot
 * drift from them. Its own comment explains why drift there is dangerous
 * (assertHarnessParity).
 *
 * SCOPE. Test names and assertion messages only. The console panel
 * (console.log from the learner's own code) is a different surface and is not
 * read here.
 *
 * KNOWN LIMITS, both measured, both in the direction of reporting less rather
 * than crying wolf:
 *   - A COMPUTED expectation that only one of the two wrong submissions
 *     reaches is not reported. kalman-filter prints "requires a value less
 *     than 1.75", a bound the test derives from its fixture, and the
 *     registered cheat clears that assertion, so the value appears in one
 *     panel only and the gate stays quiet about it.
 *   - Numbers living inside STRING fixtures are invisible to the fed side,
 *     because test names are strings too and had to be stripped wholesale.
 *     An exercise whose fixtures are prose can therefore over-report:
 *     rag-pipeline's 12.5 is a claim inside a fixture answer, not an answer
 *     the learner owes. The other three values reported beside it are real,
 *     so the exercise is flagged either way.
 *
 * Usage:
 *   node scripts/validate-failure-panel.mjs           # all exercises
 *   node scripts/validate-failure-panel.mjs <slug>    # one, verbose
 *   node scripts/validate-failure-panel.mjs --verbose # list every atom
 *
 * Exit codes: 0 clean, 1 at least one exercise leaks. Needs the Velite build
 * (`pnpm turbo build:content`) because it reads the compiled exercises and
 * lessons, exactly like scripts/validate-exercises.mjs.
 *
 * NOT WIRED INTO CI YET. It belongs beside the validator in the root
 * `test:exercises` script and in the "Validate exercises" step of
 * .github/workflows/ci.yml; both files were owned by another pass on
 * 2026-09-08. See the handoff note in that session's report.
 */

import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = join(repoRoot, "scripts/validate-exercises.mjs");
const velite = join(repoRoot, "packages/content/.velite");

/**
 * Load `runSolutionTests` out of the exercise validator without running its
 * CLI. The source is read fresh on every invocation (so a change to the
 * harness or the `expect` shim is picked up immediately), the `main()` call
 * at the bottom is cut off, `import.meta.url` is pinned to the validator's
 * real path so its `createRequire` still resolves tfjs out of packages/ui,
 * and its relative imports are rewritten to absolute file urls so the patched
 * copy can live anywhere.
 */
async function loadHarness() {
  const raw = readFileSync(validatorPath, "utf8");
  const entry = raw.search(/^main\(\)/m);
  if (entry < 0) {
    throw new Error(
      "validate-failure-panel: could not find the main() entry point in " +
        "scripts/validate-exercises.mjs. Its shape changed; update this loader.",
    );
  }
  const base = dirname(validatorPath);
  const patched =
    raw
      .slice(0, entry)
      .replace(
        /import\.meta\.url/g,
        JSON.stringify(pathToFileURL(validatorPath).href),
      )
      .replace(
        /(\bfrom\s*)(["'])(\.{1,2}\/[^"']+)\2/g,
        (_m, from, quote, spec) =>
          `${from}${quote}${pathToFileURL(resolve(base, spec)).href}${quote}`,
      ) + "\nexport { runSolutionTests };\n";
  const dir = mkdtempSync(join(tmpdir(), "tc-failure-panel-"));
  const file = join(dir, "harness.mjs");
  writeFileSync(file, patched);
  const mod = await import(pathToFileURL(file).href);
  if (typeof mod.runSolutionTests !== "function") {
    throw new Error(
      "validate-failure-panel: runSolutionTests is no longer defined in " +
        "scripts/validate-exercises.mjs.",
    );
  }
  return mod.runSolutionTests;
}

const flatten = (s) => String(s).replace(/\s+/g, "");

/**
 * A closeness tolerance, not an answer: `toBeCloseTo(x, p)` reports the
 * difference it allows, which is always 5 times a power of ten
 * (0.05, 0.005, 0.00005). Measured 2026-09-08: printing the tolerance was the
 * ONLY thing flagging weighted-ensemble, and a tolerance cannot be copied
 * into a submission to pass. 0.5 is deliberately not excluded: it is the
 * precision-0 tolerance but also a real decision threshold all over this
 * corpus ("p above 0.5 is anomaly").
 */
const TOLERANCE = /^0\.0+5$/;

/** Numbers and numeric sequences substantive enough to be an answer. */
function answerAtoms(text) {
  const out = new Set();
  for (const m of text.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)) {
    const t = m[0];
    if (TOLERANCE.test(t)) continue;
    // An expected value of exactly zero is not worth hiding: every wrong
    // submission that returns null or 0 is already halfway there, and every
    // "0.00" in this corpus turned out to be a fixture the grader feeds in
    // (classify-anomaly's dead channel), not an answer.
    if (Number(t) === 0) continue;
    if (/\./.test(t) || t.replace("-", "").length >= 3) out.add(t);
  }
  for (const m of text.matchAll(/\[[^[\]]*\]/g)) {
    const inner = m[0].slice(1, -1).trim();
    if (!inner) continue;
    const parts = inner.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;
    if (!parts.every((p) => /^-?\d+(?:\.\d+)?$/.test(p))) continue;
    out.add(`[${parts.join(",")}]`);
  }
  return out;
}

/** What the learner already has before the first Run. */
function priorKnowledge(exercise, lesson) {
  return flatten(
    [
      exercise.instructions ?? "",
      exercise.starterCode ?? "",
      JSON.stringify(lesson?.context ?? {}),
      JSON.stringify(lesson?.concept ?? {}),
      JSON.stringify(lesson?.consequence ?? {}),
      String(lesson?.body ?? ""),
      (lesson?.keywords ?? []).join(" "),
    ].join(" "),
  );
}

function leaks(atoms, corpus) {
  return [...atoms].filter((atom) => {
    if (atom.startsWith("[")) {
      const inner = atom.slice(1, -1);
      if (corpus.includes(flatten(atom)) || corpus.includes(flatten(inner)))
        return false;
      // Given element by element counts as given: the panel adds nothing by
      // printing the sequence.
      return !inner.split(",").every((part) => corpus.includes(part.trim()));
    }
    return !corpus.includes(atom);
  });
}

/** Assertion methods whose argument is a fully specified expectation. */
const ASSERTIONS = [
  "toBe",
  "toEqual",
  "toStrictEqual",
  "toBeCloseTo",
  "toContain",
  "toContainEqual",
  "toHaveLength",
  "toMatch",
  "toBeLessThan",
  "toBeLessThanOrEqual",
  "toBeGreaterThan",
  "toBeGreaterThanOrEqual",
  "toHaveProperty",
];

/**
 * Split a test suite into what it JUDGES and what it FEEDS.
 *
 * `judged` is the balanced argument text of every assertion call. `fed` is
 * everything else, with string literals stripped, so it holds the numeric
 * fixtures the grader hands the submission and nothing else. String literals
 * have to go because every test NAME is one, and a name that quotes its own
 * expected value ("carries 64 + 136 + 9 = 209 parameters") would otherwise
 * look like a fixture and excuse itself.
 *
 * The ranges are cut by INDEX, never by string replacement. An earlier draft
 * did `code.split(argText).join(" ")`, which for the very common
 * `.toBe(0)` deleted every "0" character in the whole suite and made real
 * fixtures unfindable (apply-window's `leakage(64, 20.5)` disappeared).
 */
function partitionTests(testCode) {
  const code = String(testCode ?? "");
  const ranges = [];
  const judged = [];
  for (const name of ASSERTIONS) {
    const needle = `.${name}(`;
    let i = 0;
    while ((i = code.indexOf(needle, i)) >= 0) {
      const open = i + needle.length - 1;
      let depth = 0;
      let k = open;
      for (; k < code.length; k++) {
        if (code[k] === "(") depth++;
        else if (code[k] === ")") {
          depth--;
          if (!depth) break;
        }
      }
      judged.push(code.slice(open + 1, k));
      ranges.push([open + 1, k]);
      i = k + 1;
    }
  }
  const chars = [...code];
  for (const [from, to] of ranges) {
    for (let i = from; i < to && i < chars.length; i++) chars[i] = " ";
  }
  const fed = chars
    .join("")
    .replace(/'(?:[^'\\]|\\.)*'/g, " ")
    .replace(/"(?:[^"\\]|\\.)*"/g, " ")
    .replace(/`(?:[^`\\]|\\.)*`/g, " ");
  return { judged: flatten(judged.join(" || ")), fed: flatten(fed) };
}

/**
 * Every string the results panel renders for one run, tagged with the channel
 * it came from. The channel matters to whoever fixes it: a leak in a test NAME
 * is rewritten as prose, a leak in a MESSAGE is an assertion that has to stop
 * printing its expected value.
 */
function panelStrings(run) {
  const results = Array.isArray(run.results) ? run.results : [];
  const out = [];
  for (const r of results) {
    if (r.name) out.push({ channel: "name", text: String(r.name) });
    if (!r.passed && r.error)
      out.push({ channel: "message", text: String(r.error) });
  }
  if (!run.ok && run.error)
    out.push({ channel: "run-error", text: String(run.error) });
  return out;
}

/** The first panel string that discloses an atom, for the report. */
function discloser(strings, atom) {
  const naked = atom.startsWith("[") ? atom.slice(1, -1) : atom;
  const hit = strings.find(
    (s) =>
      flatten(s.text).includes(flatten(atom)) ||
      flatten(s.text).includes(flatten(naked)),
  );
  if (!hit) return "";
  const text = hit.text.length > 96 ? `${hit.text.slice(0, 93)}...` : hit.text;
  return `${hit.channel}: "${text}"`;
}

async function main() {
  for (const file of ["exercises.json", "lessons.json"]) {
    if (existsSync(join(velite, file))) continue;
    console.error(
      `\n  [validate-failure-panel] ${file} not found in ${velite}.\n` +
        `  Run 'pnpm turbo build:content' first so Velite compiles content.\n`,
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const only = args.find((a) => !a.startsWith("--"));

  const exercises = JSON.parse(
    readFileSync(join(velite, "exercises.json"), "utf8"),
  );
  const lessons = JSON.parse(
    readFileSync(join(velite, "lessons.json"), "utf8"),
  );
  const subset = only ? exercises.filter((e) => e.slug === only) : exercises;
  if (!subset.length) {
    console.error(
      only
        ? `No exercise with slug '${only}' found.`
        : `No exercises found in ${velite}/exercises.json.`,
    );
    process.exit(1);
  }

  const runSolutionTests = await loadHarness();

  console.log(
    `\nReading the failure panel of ${subset.length} starter(s)...\n`,
  );

  let passed = 0;
  const failures = [];

  for (const ex of subset) {
    const label = `${ex.slug} (${ex.lessonSlug})`;
    const lesson = lessons.find((l) => l.slug === ex.lessonSlug);
    const corpus = priorKnowledge(ex, lesson);

    // Two different wrong submissions. What both panels print is the
    // grader's; what only one prints is that submission's own wrong number or
    // a fixture redrawn per run.
    const cheatPath = join(
      repoRoot,
      "scripts/exercise-cheats",
      `${ex.slug}.js`,
    );
    const secondSubmission = existsSync(cheatPath)
      ? readFileSync(cheatPath, "utf8")
      : (ex.starterCode ?? "");
    const first = await runSolutionTests(ex.starterCode ?? "", ex.testCode);
    const second = await runSolutionTests(secondSubmission, ex.testCode);
    const strings = panelStrings(first);
    const firstAtoms = answerAtoms(strings.map((s) => s.text).join(" || "));
    const secondAtoms = answerAtoms(
      panelStrings(second)
        .map((s) => s.text)
        .join(" || "),
    );
    const { judged: expectations, fed: fixtures } = partitionTests(ex.testCode);
    const inBoth = new Set([...firstAtoms].filter((a) => secondAtoms.has(a)));

    // Three buckets, in this order.
    //   1. Asserted as an expectation in testCode: graded, full stop. No
    //      agreement between runs is required, because the static fact
    //      settles it (kalman-filter's `toBeLessThan(1.75)` prints its bound
    //      in a message the cheat never reaches).
    //   2. A numeric literal the test FEEDS the submission: an input, not an
    //      answer.
    //   3. In neither: a computed expectation, a redrawn fixture, or the
    //      submission's own wrong number. Only the values BOTH wrong
    //      submissions printed are the grader's.
    const graded = new Set(
      [...firstAtoms].filter((atom) => {
        const naked = atom.startsWith("[") ? atom.slice(1, -1) : atom;
        const asserted =
          expectations.includes(flatten(atom)) ||
          expectations.includes(flatten(naked));
        if (asserted) return true;
        const fed =
          fixtures.includes(flatten(atom)) || fixtures.includes(flatten(naked));
        if (fed) return false;
        return inBoth.has(atom);
      }),
    );
    const leaked = leaks(graded, corpus);

    if (verbose || only) {
      console.log(`  ${label}`);
      console.log(`    atoms  ${[...firstAtoms].join(" ") || "(none)"}`);
      console.log(`    in both runs ${[...inBoth].join(" ") || "(none)"}`);
      console.log(`    graded ${[...graded].join(" ") || "(none)"}`);
    }

    if (leaked.length) {
      const evidence = leaked.map(
        (atom) => `${atom} <- ${discloser(strings, atom) || "(panel)"}`,
      );
      failures.push({ slug: ex.slug, leaked, evidence });
      console.log(
        `  LEAK  ${label} - the untouched starter prints ` +
          `${leaked.length} graded value(s) the exercise never gave the ` +
          `learner: ${leaked.join(", ")}`,
      );
      for (const line of evidence) console.log(`          ${line}`);
      continue;
    }
    passed++;
    console.log(`  OK    ${label}`);
  }

  console.log(
    `\nDone: ${passed} clean, ${failures.length} leaking, ${subset.length} total.\n`,
  );

  if (failures.length) {
    console.error(
      "The results panel is an answer channel on these exercises:\n",
    );
    for (const f of failures) {
      console.error(`  - ${f.slug}: ${f.leaked.join(", ")}`);
      for (const line of f.evidence) console.error(`      ${line}`);
    }
    console.error(
      "\nFix the assertion, not the gate. Either assert a PROPERTY the value\n" +
        "has (a bound, a relation between two runs, a recomputation from the\n" +
        "learner's own output) instead of the value itself, or move the number\n" +
        "into the instructions where it belongs, or name the test case without\n" +
        "quoting its expected value.\n",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected failure-panel validator error:", err);
  process.exit(1);
});
