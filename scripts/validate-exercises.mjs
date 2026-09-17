#!/usr/bin/env node
/**
 * Exercise validator - CI-only harness.
 *
 * Reads the velite-compiled exercises.json and verifies for each exercise:
 *   1. Starter code parses as JavaScript (after TS/import stripping).
 *   2. Solution code, run against testCode, passes every assertion within 10s.
 *   3. testCode makes at least one value-level assertion.
 *   4. With --starters, the untouched starter does NOT pass.
 *   5. With --cheats, the registered ignorant solution at
 *      scripts/exercise-cheats/<slug>.js clears at least one test and fails
 *      at least one. See that directory's README for why both halves matter.
 *
 * Before any of that it runs assertHarnessParity(), which checks that the
 * stubs this file shares with the browser worker
 * (packages/ui/src/mdx/exercise-runner.ts) still derive the same answers from
 * the same inputs. If they drift, a submission can pass in one harness and
 * fail in the other.
 *
 * Mirrors the test harness in packages/ui/src/mdx/exercise.tsx (parseAndRunTests)
 * but is dependency-free so it runs on a fresh CI worker without building UI.
 *
 * Exit codes:
 *   0 - every exercise validated.
 *   1 - at least one exercise failed, or the harness stubs have drifted.
 *
 * Usage:
 *   node scripts/validate-exercises.mjs                     # validates all
 *   node scripts/validate-exercises.mjs <slug>              # one by slug
 *   node scripts/validate-exercises.mjs --starters --cheats # full gate
 *
 * CI invokes via the root `test:exercises` script.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";

// Resolve `@tensorflow/tfjs` from the workspace `packages/ui` package, since
// pnpm doesn't hoist it to the repo root and the validator script lives at
// the root. Using `createRequire` against a known package path lets us pull
// the same tfjs build that runtime uses (v4.22).
const _require = createRequire(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../packages/ui/package.json",
  ),
);
const realTf = _require("@tensorflow/tfjs");

// Polyfill `inputShape` getter on `LayersModel` (and therefore `Sequential`).
// Real tfjs only exposes `outputShape`; many exercise tests assert on
// `model.inputShape` to mirror the symmetric API our docs teach. Defining the
// getter once here keeps the exercise solutions intact without per-exercise
// rewrites.
if (
  realTf?.LayersModel?.prototype &&
  !Object.getOwnPropertyDescriptor(realTf.LayersModel.prototype, "inputShape")
) {
  Object.defineProperty(realTf.LayersModel.prototype, "inputShape", {
    get() {
      const ins = this.inputs;
      if (!ins || !ins.length) return undefined;
      return ins.length === 1 ? ins[0].shape : ins.map((i) => i.shape);
    },
    configurable: true,
  });
}

// Build a thin wrapper around the frozen ESM namespace so the validator can
// override `loadLayersModel` / `loadGraphModel`. Real tfjs tries to fetch
// `model.json` over HTTP, which never resolves in CI. The overrides return a
// synthetic model whose architecture is DERIVED FROM THE URL, so that
// `inputs[0].shape`, `outputs[0].shape` and `.layers` differ per url and no
// solution can clear a loading exercise by hardcoding one memorised triple
// (2026-09-08: the old stub returned a fixed 10 -> 8 -> 4 stack here and a
// fixed 4 -> 8 -> 1 stack in the browser worker, so the two harnesses
// disagreed about which hardcoded answer passed). Exercises that
// need a specific architecture can still build one explicitly via
// `tf.sequential()`.

// --- stub-arch-derivation: kept byte-identical (modulo whitespace) with the
// copy in packages/ui/src/mdx/exercise-runner.ts. The parity is CI-enforced
// by assertHarnessParity() below: the two harnesses MUST agree, or a
// learner's solution can pass in the browser and fail in CI. ---
function stubArchFromUrl(url) {
  // FNV-1a over the url, via Math.imul so the 32-bit multiply stays exact.
  var h = 0x811c9dc5;
  var s = String(url == null ? "" : url);
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  var inputDim = 4 + (h % 13);
  var hidden = 4 + ((h >>> 5) % 13);
  var outputUnits = 1 + ((h >>> 11) % 4);
  var deep = (h >>> 17) % 2 === 1;
  return {
    inputDim: inputDim,
    hidden: hidden,
    outputUnits: outputUnits,
    hiddenTwo: deep ? Math.max(2, hidden >> 1) : 0,
    layerCount: deep ? 3 : 2,
  };
}
// --- end stub-arch-derivation ---

// --- stub-onnx-derivation: kept byte-identical (modulo whitespace) with the
// copy in packages/ui/src/mdx/exercise-runner.ts, and checked by
// assertHarnessParity() below. ---
function stubOnnxScore(feeds) {
  // Squash a position-weighted sum of the feed values into (0, 1). Any
  // deterministic function of the input works; what matters is that it IS a
  // function of the input, so returning a memorised constant is a wrong
  // answer. Before 2026-09-08 both shims returned 0.5 for every feed, which
  // made a plain "return 0.5" indistinguishable from running the session.
  var key = feeds ? Object.keys(feeds)[0] : null;
  var t = key ? feeds[key] : null;
  var data = t && t.data ? t.data : [];
  var acc = 0;
  for (var i = 0; i < data.length; i++) acc += (i + 1) * Number(data[i]);
  return 1 / (1 + Math.exp(-acc));
}
// --- end stub-onnx-derivation ---

function buildStubLayersModel(tfns, url) {
  const a = stubArchFromUrl(url);
  const m = tfns.sequential();
  m.add(
    tfns.layers.dense({
      units: a.hidden,
      activation: "relu",
      inputShape: [a.inputDim],
    }),
  );
  if (a.hiddenTwo) {
    m.add(tfns.layers.dense({ units: a.hiddenTwo, activation: "relu" }));
  }
  m.add(
    tfns.layers.dense({
      units: a.outputUnits,
      activation: a.outputUnits === 1 ? "sigmoid" : "softmax",
    }),
  );
  return m;
}

const tfWithOverrides = new Proxy(realTf, {
  get(target, prop) {
    if (prop === "loadLayersModel") {
      return async function (url) {
        return buildStubLayersModel(realTf, url);
      };
    }
    if (prop === "loadGraphModel") {
      return async function (url) {
        const a = stubArchFromUrl(url);
        const layers = [];
        for (let i = 0; i < a.layerCount; i++) layers.push({});
        const out = (x) =>
          realTf.zeros([(x && x.shape && x.shape[0]) || 1, a.outputUnits]);
        return {
          inputs: [{ shape: [null, a.inputDim] }],
          outputs: [{ shape: [null, a.outputUnits] }],
          layers,
          predict: out,
          execute: out,
          dispose: () => {},
        };
      };
    }
    return target[prop];
  },
});
import vm from "node:vm";

// CALL SPY (2026-09-13), the validator half. Mirrors the spy in
// packages/ui/src/mdx/exercise-runner.ts exactly: counters on tf.__calls,
// top-level entry points by name, nested namespaces as 'layers.dense',
// 'io.withSaveHandler', 'train.adam', and LayersModel.prototype.save as
// 'model.save'. A grader that asserts on tf.__calls behaves identically in
// both harnesses; the corpus parity test is what proves it.
const SPIED_ENTRY_POINTS = new Set([
  "variableGrads",
  "grad",
  "grads",
  "valueAndGrad",
  "valueAndGrads",
  "customGrad",
  "sequential",
  "model",
  "tidy",
  "dispose",
  "keep",
  "matMul",
  "dot", // the functional twin of tensor.dot (round 7b, 2026-09-14: a gate on matMul-or-dot missed tf.dot)
  "transpose",
  "add",
  "sub",
  "mul",
  "div",
  "sum",
  "mean",
  "moments",
]);
// Tensor METHODS are prototype calls the proxy cannot see; patched once,
// counted as 'tensor.<name>' into the live per-run object. Same list as the
// runner.
const TENSOR_METHODS = [
  "add",
  "sub",
  "mul",
  "div",
  "matMul",
  "dot",
  "transpose",
  "sum",
  "mean",
  "square",
  "sqrt",
  "max",
  "min",
  "argMax",
  "norm",
  "exp",
  "log",
  "sigmoid",
  "softmax",
  "reshape",
  "concat",
  "dataSync",
  "data",
  "arraySync",
  "dispose",
];
const SPIED_NAMESPACES = new Set(["layers", "io", "train", "losses"]);
let liveCalls = Object.create(null);
{
  const tproto = realTf.Tensor && realTf.Tensor.prototype;
  if (tproto && !tproto.__tcSpied) {
    for (const name of TENSOR_METHODS) {
      const real = tproto[name];
      if (typeof real !== "function") continue;
      tproto[name] = function (...args) {
        liveCalls[`tensor.${name}`] = (liveCalls[`tensor.${name}`] || 0) + 1;
        return real.apply(this, args);
      };
    }
    tproto.__tcSpied = true;
  }
  const proto = realTf.LayersModel && realTf.LayersModel.prototype;
  if (proto && !proto.__tcSpied) {
    const realSave = proto.save;
    proto.save = function (...args) {
      liveCalls["model.save"] = (liveCalls["model.save"] || 0) + 1;
      return realSave.apply(this, args);
    };
    // One count per predict call, for Sequential and functional models alike
    // (measured 2026-09-13): a grader whose report is a measurement can ask
    // whether the submission ran the model at all.
    const realPredict = proto.predict;
    proto.predict = function (...args) {
      liveCalls["model.predict"] = (liveCalls["model.predict"] || 0) + 1;
      return realPredict.apply(this, args);
    };
    proto.__tcSpied = true;
  }
  // The namespace proxy refuses writes to tf's own properties, but nothing
  // hanging off it was protected: tf.Tensor.prototype.arraySync = () => 'P'
  // poisoned every grader's read path and tf.util.createShuffledIndices was
  // swappable (round 7b, 2026-09-14). Lock the spied methods and the read
  // path after the spy has wrapped them, and freeze tf.util. Identical block
  // in the runner.
  const lockMethods = (target, names) => {
    if (!target) return;
    for (const name of names) {
      const d = Object.getOwnPropertyDescriptor(target, name);
      if (d && typeof d.value === "function" && d.configurable)
        Object.defineProperty(target, name, {
          ...d,
          writable: false,
          configurable: false,
        });
    }
  };
  lockMethods(tproto, [
    ...TENSOR_METHODS,
    "data",
    "array",
    "dataSync",
    "arraySync",
  ]);
  lockMethods(proto, ["predict", "save"]);
  if (realTf.util && typeof realTf.util === "object")
    Object.freeze(realTf.util);
}
function spiedTf(base) {
  const calls = Object.create(null);
  liveCalls = calls;
  const bump = (name) => {
    calls[name] = (calls[name] || 0) + 1;
  };
  const spyNamespace = (ns, prefix) =>
    new Proxy(ns, {
      get(target, prop) {
        const v = target[prop];
        if (typeof v === "function" && typeof prop === "string") {
          return function (...args) {
            bump(`${prefix}.${prop}`);
            return v.apply(this === undefined ? target : this, args);
          };
        }
        return v;
      },
    });
  return new Proxy(base, {
    get(target, prop) {
      // A frozen snapshot, not the live object: tf.__calls['model.save'] = 1
      // forged a counter in both harnesses before this (round 7b,
      // 2026-09-14). Each read is a fresh copy, so a grader that reads the
      // counters twice sees the calls in between.
      if (prop === "__calls")
        return Object.freeze(Object.assign(Object.create(null), calls));
      const v = target[prop];
      if (SPIED_ENTRY_POINTS.has(prop) && typeof v === "function") {
        return function (...args) {
          bump(prop);
          return v.apply(target, args);
        };
      }
      // tf.train is a function with members hung off it, not a plain object,
      // so both shapes are wrapped (identical rule in the runner).
      if (
        SPIED_NAMESPACES.has(prop) &&
        v &&
        (typeof v === "object" || typeof v === "function")
      )
        return spyNamespace(v, prop);
      return v;
    },
    // The namespace is read-only to the submission: a `tf.randomUniform = ...`
    // at the top of a submission would otherwise replace the generator the
    // grader draws its run-time fixtures from (round 7, 2026-09-13). Sloppy
    // code sees the assignment silently ignored; strict code gets a TypeError.
    set() {
      return false;
    },
    defineProperty() {
      return false;
    },
    deleteProperty() {
      return false;
    },
  });
}

// The Math the submission and the tests share, minus the one property a
// submission could use to pin the grader's draws (round 7, 2026-09-13: a
// `Math.random = () => 0.5` at the top of a submission turned every drawn
// fixture in four graders into a constant, because tf's own generator seeds
// from Math.random on every call as well). Every property of the host Math is
// copied except random, which is a per-run seeded stream sealed non-writable
// and non-configurable. The seed comes from crypto, not from the host
// Math.random: the sandbox is handed host intrinsics (Object, Array, the
// typed arrays, so tensors built in the host realm pass instanceof checks in
// test code), and any host intrinsic reaches the host realm through its
// constructor chain (Object.constructor('return Math')()), so a submission
// that pinned the host generator would otherwise seed every later exercise
// in the process identically (round 7b, 2026-09-14). The host generator and
// the host Math binding are locked below for the same reason. Mirrors the
// sealing block at the top of WORKER_BODY in
// packages/ui/src/mdx/exercise-runner.ts.
function sealedMath() {
  const m = Object.create(Object.prototype);
  for (const key of Reflect.ownKeys(Math)) {
    if (key === "random") continue;
    Object.defineProperty(m, key, Object.getOwnPropertyDescriptor(Math, key));
  }
  let seed = randomBytes(4).readUInt32LE(0);
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Object.defineProperty(m, "random", {
    value: random,
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return Object.freeze(m);
}
// The host realm's own generator and Math binding, locked once per process:
// tf (loaded in the host realm) reads Math.random on every draw, and a
// submission that reaches the host Math through an intrinsic's constructor
// chain would otherwise pin tf's draws for the rest of the run.
try {
  Object.defineProperty(Math, "random", {
    value: Math.random,
    writable: false,
    configurable: false,
  });
} catch {}
try {
  Object.defineProperty(globalThis, "Math", {
    value: Math,
    writable: false,
    configurable: false,
  });
} catch {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..");
const exercisesJsonPath = resolve(
  repoRoot,
  "packages/content/.velite/exercises.json",
);

const TIMEOUT_MS = 10_000;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

import { stripTypeScript } from "./lib/strip-typescript.mjs";

/**
 * Heuristic: does the top-level of `code` contain a bare `await`?
 * Tracks brace / paren depth so `await` inside function bodies doesn't count.
 */
function hasBareTopLevelAwait(code) {
  let brace = 0,
    paren = 0,
    bracket = 0;
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === "/" && code[i + 1] === "/") {
      i = code.indexOf("\n", i);
      if (i === -1) return false;
      i++;
      continue;
    }
    if (c === "/" && code[i + 1] === "*") {
      i = code.indexOf("*/", i + 2);
      if (i === -1) return false;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n) {
        if (code[i] === "\\") {
          i += 2;
          continue;
        }
        if (code[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "{") brace++;
    else if (c === "}") brace--;
    else if (c === "(") paren++;
    else if (c === ")") paren--;
    else if (c === "[") bracket++;
    else if (c === "]") bracket--;
    if (
      brace === 0 &&
      paren === 0 &&
      bracket === 0 &&
      c === "a" &&
      code.slice(i, i + 5) === "await" &&
      !/[\w$]/.test(code[i + 5] || "")
    ) {
      // Check previous non-space isn't a word char.
      let k = i - 1;
      while (k >= 0 && /\s/.test(code[k])) k--;
      if (k < 0 || !/[\w$]/.test(code[k])) return true;
    }
    i++;
  }
  return false;
}

// --- shared-user-syntax-check: kept byte-identical (modulo whitespace and
// comments) between packages/ui/src/mdx/exercise-runner.ts and
// scripts/validate-exercises.mjs, and compared by assertHarnessParity().
//
// Both harnesses concatenate the learner's code and the test code into ONE
// function body. An unbalanced brace in the learner's function therefore
// swallows the harness that follows it, and the run dies with a message
// about code the learner never wrote: dropping one closing brace in
// implement-neuron used to report "await is only valid in async functions
// and the top level bodies of modules" under the name "Code execution",
// while the results list vanished (completeness critic, 2026-09-08).
// Parsing the learner's code ALONE, first, lets the failure name the real
// cause. The wrapper matches how each harness runs the submission, so a
// top-level await stays legal.
function userCodeSyntaxError(cleanUserCode = "") {
  try {
    new Function("return (async function() {\n" + cleanUserCode + "\n});");
    return null;
  } catch (err) {
    // Object() so the read type-checks in the .ts copy, where a catch
    // binding is unknown.
    const raised = Object(err);
    return typeof raised.message === "string" ? raised.message : String(err);
  }
}

function userSyntaxErrorResult(parserMessage = "") {
  return {
    name: "Your code has a syntax error",
    passed: false,
    error:
      "JavaScript could not parse your code, so no test ran. The parser said: " +
      parserMessage +
      ". An unclosed or extra brace is the usual cause: check that every opening brace has a partner.",
  };
}
// --- end shared-user-syntax-check ---

function syntaxCheck(code) {
  // Delegates to the shared check so the starter-compile gate and the
  // per-run check can never disagree about what parses.
  const error = userCodeSyntaxError(stripTypeScript(code));
  return error ? { ok: false, error } : { ok: true };
}

// Harness - mirrors packages/ui/src/mdx/exercise.tsx parseAndRunTests, with
// one correctness fix: we collect every `it()` promise into `__pending` so
// that `describe()` can await the whole batch before returning. The in-browser
// harness lets these promises float; in CI we need deterministic results so
// the outer IIFE can `await Promise.all(__pending)` before returning results.
const HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';

  function describe(name, fn) {
    var prev = __currentDescribe;
    // Hooks are describe-scoped (mirrors the CI grader + vitest): siblings
    // must not inherit each other's beforeEach/afterEach registrations.
    var savedBE = __beforeEach.slice();
    var savedAE = __afterEach.slice();
    __currentDescribe = name;
    var ret;
    try { ret = fn(); } catch(e) {
      // A throw in a describe BODY silently dropped every later it() and
      // the UI then read the surviving green subset as "All tests passed!"
      // (fresh-eyes rerun §6). Record it as a failing result so a
      // partially-defined suite can never present as a pass.
      __results.push({
        name: name + ' > (suite body threw before defining all tests)',
        passed: false,
        error: (e && e.message) || String(e)
      });
    }
    if (ret && typeof ret.then === 'function') {
      __pending.push(ret.catch(function(){}).then(function(){
        __currentDescribe = prev;
        __beforeEach = savedBE;
        __afterEach = savedAE;
      }));
    } else {
      __currentDescribe = prev;
      __beforeEach = savedBE;
      __afterEach = savedAE;
    }
  }

  var __beforeEach = [];
  var __afterEach = [];

  // beforeAll runs immediately (describe bodies register it before any it()
  // callback executes, since its run on microtasks). Async setups are queued
  // so __awaitPending drains them before results are read.
  function beforeAll(fn) {
    try {
      var r = fn && fn();
      if (r && typeof r.then === 'function') __pending.push(Promise.resolve(r).catch(function(){}));
    } catch (e) { /* setup errors surface as failing assertions */ }
  }
  function afterAll(fn) {
    __pending.push(Promise.resolve().then(function() { return fn && fn(); }).catch(function(){}));
  }
  function beforeEach(fn) { __beforeEach.push(fn); }
  function afterEach(fn) { __afterEach.push(fn); }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var beSnapshot = __beforeEach.slice();
    var aeSnapshot = __afterEach.slice();
    var p = Promise.resolve().then(async function() {
      for (var i = 0; i < beSnapshot.length; i++) await beSnapshot[i]();
      await fn();
      for (var j = 0; j < aeSnapshot.length; j++) await aeSnapshot[j]();
    }).then(
      function() { __results.push({ name: fullName, passed: true }); },
      function(e) { __results.push({ name: fullName, passed: false, error: e.message || String(e) }); }
    );
    __pending.push(p);
  }
  var test = it;
  it.skip = function(){};
  it.only = it;
  test.skip = function(){};
  test.only = it;
  describe.skip = function(){};
  describe.only = describe;

  async function __awaitPending() {
    // Drain the queue, pending it()s may schedule more work.
    while (__pending.length > 0) {
      var batch = __pending.splice(0, __pending.length);
      await Promise.all(batch);
    }
  }

  /* --- shared-assertions: kept byte-identical (modulo whitespace) between
     packages/ui/src/mdx/exercise-runner.ts, the harness a learner runs in the
     browser, and scripts/validate-exercises.mjs, the harness CI grades with.
     assertHarnessParity() in the validator compares every function marked
     below, and assertAssertionParity() runs a fixture suite through both
     harnesses and compares every resulting failure string, because a
     divergence here lets a submission pass in one harness and fail in the
     other.

     FAILURE-TEXT RULE, which exercise authors follow when they write a
     message of their own:

     1. A failure never prints the expected side of an equality or closeness
        check when that value is a number, or an array or object holding a
        number. Those are graded answers. The results panel opens on the
        first Run of the untouched starter, so printing them hands over the
        answer for one click, and unlike the hint ladder it is not recorded
        as a reveal.
     2. In place of the answer the message reports three things: the value
        the learner produced, the direction of the miss (too high, too low)
        or the position of the first difference, and the rule the check
        enforces (its tolerance, its required length, its required shape).
     3. Strings, booleans, null, undefined, regexes, constructor names,
        lengths and shapes ARE printed. They name an API choice or a
        structure rather than a computed answer, and withholding them turns
        a typo into a guessing game.
     4. A threshold is a rule, not an answer, so toBeGreaterThan and its
        siblings keep naming the bar the value has to clear.
     5. The teaching half comes from the author: expect takes an optional
        second argument, and whatever it says is printed above the
        discrepancy. Write why the failure means what it means.
            expect(loss, 'A rising loss means the step went uphill.')
              .toBeLessThan(previous);
  --- */

  function __tcDefaultPrecision() {
    // Deliberately tighter than the vitest default of 2, because these
    // exercises grade numeric ML output where 2 decimals would accept a
    // wrong answer. Authors who want a looser bar pass precision
    // explicitly; the validator prints an advisory for every site that
    // leaves it out.
    return 5;
  }

  function __tcTolerance(p) {
    // Printed, not compared: Math.pow(10, -5) / 2 is 0.0000049999999999999996
    // in binary floating point, and that tail is noise in a failure message.
    var limit = Math.pow(10, -p) / 2;
    return String(Number(limit.toPrecision(2)));
  }

  function __tcMessage(why, detail) {
    var d = detail == null ? '' : String(detail);
    if (why === undefined || why === null || why === '') return d;
    if (!d) return String(why);
    return String(why) + '\\n' + d;
  }

  // Realm-safe RegExp test. Test code runs in its own realm (a vm context in

  // CI, the worker body in the browser), so a regex literal written in an

  // exercise is NOT an instanceof this realm's RegExp. Duck-typing via the

  // toString tag is the only check that holds across both harnesses; an

  // instanceof here silently degrades every regex assertion into a substring

  // search for the regex's own source text.

  function __tcIsRe(p) {

    return Object.prototype.toString.call(p) === '[object RegExp]';

  }

  function __tcShow(v) {
    // JSON.stringify turns NaN and Infinity into 'null', which would report
    // a failed calculation as a missing value.
    if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
    var s;
    try {
      s = JSON.stringify(v);
    } catch (e) {
      s = null;
    }
    if (s === undefined || s === null) s = String(v);
    return s.length > 140 ? s.slice(0, 137) + '...' : s;
  }

  function __tcType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    // v !== v is true only for NaN, and needs no global helper.
    if (typeof v === 'number' && v !== v) return 'NaN';
    return typeof v;
  }

  function __tcNamed(v) {
    // 'null (null)' and 'undefined (undefined)' read as a stutter, so name
    // the type once when the type IS the whole value.
    var t = __tcType(v);
    var shown = __tcShow(v);
    return shown === t ? t : t + ' (' + shown + ')';
  }

  function __tcHasNumber(v) {
    if (typeof v === 'number') return true;
    if (v === null || typeof v !== 'object') return false;
    if (Array.isArray(v)) {
      for (var i = 0; i < v.length; i++) if (__tcHasNumber(v[i])) return true;
      return false;
    }
    for (var k in v) if (__tcHasNumber(v[k])) return true;
    return false;
  }

  function __tcListOf(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && typeof v.length === 'number') {
      return Array.prototype.slice.call(v);
    }
    return null;
  }

  function __tcNumberMiss(actual, expected) {
    if (typeof expected !== 'number') return __tcStructureMiss(actual, expected);
    if (typeof actual !== 'number') {
      return 'Got ' + __tcNamed(actual) + ' where a number was required.';
    }
    if (actual !== actual) return 'Got NaN, so the calculation produced no number.';
    return 'Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '.';
  }

  function __tcStructureMiss(actual, expected) {
    if (Array.isArray(expected)) {
      var a = __tcListOf(actual);
      if (a === null) {
        return 'Got ' + __tcNamed(actual) + ' where a list of ' + expected.length + ' was required.';
      }
      if (a.length !== expected.length) {
        return 'Your list has ' + a.length + ' entries; ' + expected.length + ' were required.';
      }
      var first = -1;
      var n = 0;
      for (var i = 0; i < expected.length; i++) {
        if (JSON.stringify(a[i]) !== JSON.stringify(expected[i])) {
          n++;
          if (first < 0) first = i;
        }
      }
      if (n === 0) {
        if (!Array.isArray(actual)) {
          return 'Your values match entry by entry, but the container is a ' + (actual && actual.constructor && actual.constructor.name ? actual.constructor.name : __tcType(actual)) + ' where a plain array was required. Array.from converts it.';
        }
        return 'Your list matches entry by entry but is not the same object.';
      }
      return 'Your list is the right length. ' + n + ' of ' + expected.length + ' entries differ, the first at index ' + first + ' (yours: ' + __tcShow(a[first]) + ').';
    }
    if (expected !== null && typeof expected === 'object') {
      if (actual === null || typeof actual !== 'object') {
        return 'Got ' + __tcNamed(actual) + ' where an object was required.';
      }
      var keys = Object.keys(expected);
      var missing = [];
      var differ = [];
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (!(key in actual)) missing.push(key);
        else if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) differ.push(key);
      }
      if (missing.length) {
        return 'Your object has no ' + missing[0] + ' key (' + missing.length + ' of the ' + keys.length + ' required keys are missing).';
      }
      if (differ.length) {
        return 'Your ' + differ[0] + ' is ' + __tcShow(actual[differ[0]]) + ', which this check rejects (' + differ.length + ' of ' + keys.length + ' keys differ).';
      }
      return 'Your object carries the ' + keys.length + ' required keys plus extras this check rejects.';
    }
    return 'Got ' + __tcShow(actual) + '.';
  }

  function __tcJest() {
    var jestStub = {
      fn: function(impl) {
        var calls = [];
        var instances = [];
        var f = function() {
          var args = Array.prototype.slice.call(arguments);
          calls.push(args);
          instances.push(this);
          return impl ? impl.apply(this, args) : undefined;
        };
        f.mock = { calls: calls, instances: instances, results: [] };
        f.mockReturnValue = function(v) { impl = function() { return v; }; return f; };
        f.mockResolvedValue = function(v) { impl = function() { return Promise.resolve(v); }; return f; };
        f.mockImplementation = function(i) { impl = i; return f; };
        f.mockClear = function() { calls.length = 0; instances.length = 0; };
        return f;
      },
      spyOn: function(obj, method) {
        var original = obj[method];
        var spy = jestStub.fn(original);
        obj[method] = spy;
        spy.mockRestore = function() { obj[method] = original; };
        return spy;
      },
      clearAllMocks: function() {},
      resetAllMocks: function() {},
      useFakeTimers: function() {},
      useRealTimers: function() {},
    };
    return jestStub;
  }

  function __tcInstallStatics(fn) {
    fn.closeTo = function(expected, precision) {
      var p = precision === undefined ? 2 : precision;
      return {
        asymmetricMatch: function(actual) {
          return Math.abs(actual - expected) < Math.pow(10, -p) / 2;
        },
      };
    };
    fn.any = function(ctor) {
      return {
        asymmetricMatch: function(a) {
          var name = String(ctor && ctor.name).toLowerCase();
          return a != null && (typeof a === name || a instanceof ctor);
        },
      };
    };
    fn.anything = function() {
      return {
        asymmetricMatch: function(a) { return a != null; },
      };
    };
    fn.stringContaining = function(s) {
      return {
        asymmetricMatch: function(a) { return typeof a === 'string' && a.indexOf(s) !== -1; },
      };
    };
    fn.stringMatching = function(re) {
      return {
        asymmetricMatch: function(a) {
          return typeof a === 'string' && (__tcIsRe(re) ? re : new RegExp(re)).test(a);
        },
      };
    };
    return fn;
  }

  function __tcMatchers(actual, __why) {
    function fail(detail) {
      throw new Error(__tcMessage(__why, detail));
    }
    function contains(needle) {
      if (typeof actual === 'string') return actual.indexOf(String(needle)) !== -1;
      var list = __tcListOf(actual);
      if (list === null) return null;
      return Array.prototype.indexOf.call(list, needle) !== -1 || (needle !== needle && list.some(function(v) { return v !== v; }));
    }
    return {
      toBe: function(expected) {
        if (actual === expected) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toEqual: function(expected) {
        if (JSON.stringify(actual) === JSON.stringify(expected)) return;
        if (__tcHasNumber(expected)) fail(__tcNumberMiss(actual, expected));
        fail('Expected ' + __tcShow(expected) + ' but got ' + __tcShow(actual) + '.');
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) {
          fail('Nothing came back here: the value is ' + String(actual) + '.');
        }
      },
      toBeNull: function() {
        if (actual !== null) fail('Expected null, got ' + __tcNamed(actual) + '.');
      },
      toBeTruthy: function() {
        if (!actual) fail('Expected a truthy value, got ' + __tcShow(actual) + '.');
      },
      toBeFalsy: function() {
        if (actual) fail('Expected a falsy value, got ' + __tcShow(actual) + '.');
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value greater than ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires a value less than ' + __tcShow(expected) + '.');
        }
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at least ' + __tcShow(expected) + '.');
        }
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) {
          fail('Got ' + __tcShow(actual) + '; this check requires at most ' + __tcShow(expected) + '.');
        }
      },
      toContain: function(expected) {
        var inside = contains(expected);
        if (inside === null) {
          fail('toContain needs a string or a list, got ' + __tcType(actual) + '.');
        }
        if (inside) return;
        if (typeof actual === 'string') {
          fail('Your text does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
        }
        if (__tcHasNumber(expected)) {
          fail('Your list is missing a value this check requires. Yours: ' + __tcShow(actual) + '.');
        }
        fail('Your list does not contain ' + __tcShow(expected) + '. Yours: ' + __tcShow(actual) + '.');
      },
      toHaveLength: function(expected) {
        if (actual == null || typeof actual.length !== 'number') {
          fail('Got ' + __tcNamed(actual) + ', which has no length.');
        }
        if (actual.length !== expected) {
          fail('Your value has length ' + actual.length + '; ' + expected + ' was required.');
        }
      },
      toThrow: function(expected) {
        if (typeof actual !== 'function') {
          fail('toThrow needs a function to call, got ' + __tcType(actual) + '.');
        }
        var threw = false;
        var caught = null;
        try { actual(); } catch (e) { threw = true; caught = e; }
        if (!threw) fail('This call was required to throw, and it returned instead.');
        if (expected !== undefined) {
          var msg = caught && caught.message ? String(caught.message) : String(caught);
          var ok = __tcIsRe(expected) ? expected.test(msg) : msg.indexOf(String(expected)) !== -1;
          if (!ok) {
            fail('It threw, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(expected)) + '.');
          }
        }
      },
      toBeCloseTo: function(expected, precision) {
        var p = precision === undefined ? __tcDefaultPrecision() : precision;
        var limit = Math.pow(10, -p) / 2;
        var diff = Math.abs(actual - expected);
        // NaN-safe: a non-numeric actual makes diff NaN, and NaN < limit is
        // false, so the negated form fails instead of silently passing.
        if (diff < limit) return;
        if (typeof actual !== 'number') {
          fail('Got ' + __tcNamed(actual) + ' where a number was required.');
        }
        if (actual !== actual) fail('Got NaN, so the calculation produced no number.');
        fail('Got ' + actual + ', which is too ' + (actual > expected ? 'high' : 'low') + '. This check allows a difference of at most ' + __tcTolerance(p) + ' (precision ' + p + ').');
      },
      toHaveProperty: function(key, expected) {
        var path = String(key).split('.');
        var cur = actual;
        for (var i = 0; i < path.length; i++) {
          var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
          if (!reachable || !(path[i] in cur)) {
            fail('Expected a property named ' + __tcShow(key) + ', which is not there.');
          }
          cur = cur[path[i]];
        }
        if (arguments.length > 1 && JSON.stringify(cur) !== JSON.stringify(expected)) {
          if (__tcHasNumber(expected)) fail('Property ' + key + ': ' + __tcNumberMiss(cur, expected));
          fail('Property ' + key + ' expected ' + __tcShow(expected) + ' but got ' + __tcShow(cur) + '.');
        }
      },
      toMatch: function(pattern) {
        var s = String(actual);
        var ok = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
        if (!ok) {
          fail('Your text does not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + '. Yours: ' + __tcShow(s) + '.');
        }
      },
      toMatchObject: function(expected) {
        function match(a, e) {
          if (e === null || typeof e !== 'object') return a === e;
          if (Array.isArray(e)) {
            if (!Array.isArray(a) || a.length < e.length) return false;
            for (var i = 0; i < e.length; i++) if (!match(a[i], e[i])) return false;
            return true;
          }
          for (var k in e) if (!match(a && a[k], e[k])) return false;
          return true;
        }
        if (!match(actual, expected)) {
          fail('Your object does not carry the required fields. Yours: ' + __tcShow(actual) + '.');
        }
      },
      toBeInstanceOf: function(ctor) {
        if (!(actual instanceof ctor)) {
          fail('Expected an instance of ' + String(ctor && ctor.name) + ', got ' + __tcType(actual) + '.');
        }
      },
      toHaveBeenCalled: function() {
        if (!actual || !actual.mock || actual.mock.calls.length === 0) {
          fail('This function was never called.');
        }
      },
      toHaveBeenCalledTimes: function(n) {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        if (actual.mock.calls.length !== n) {
          fail('This function was called ' + actual.mock.calls.length + ' time(s); ' + n + ' was required.');
        }
      },
      toHaveBeenCalledWith: function() {
        if (!actual || !actual.mock) fail('Expected a mock function here.');
        var expectedArgs = Array.prototype.slice.call(arguments);
        var ok = actual.mock.calls.some(function(c) {
          return JSON.stringify(c) === JSON.stringify(expectedArgs);
        });
        if (!ok) {
          fail('No call matched the required arguments. Calls seen: ' + __tcShow(actual.mock.calls) + '.');
        }
      },
      resolves: {
        toBe: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toBe(expected);
          });
        },
        toEqual: function(expected) {
          return Promise.resolve(actual).then(function(v) {
            return __tcMatchers(v, __why).toEqual(expected);
          });
        },
      },
      rejects: {
        toThrow: function(msgOrRegex) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) {
              if (msgOrRegex === undefined || msgOrRegex === null) return;
              var msg = (err && err.message) || String(err);
              var ok = __tcIsRe(msgOrRegex) ? msgOrRegex.test(msg) : msg.indexOf(String(msgOrRegex)) !== -1;
              if (!ok) {
                fail('It rejected, but the message was ' + __tcShow(msg) + ' and this check requires ' + __tcShow(String(msgOrRegex)) + '.');
              }
            }
          );
        },
        toEqual: function(expected) {
          if (!actual || typeof actual.then !== 'function') {
            fail('Expected a promise here, got ' + __tcType(actual) + '.');
          }
          return actual.then(
            function() { fail('This promise was required to reject, and it resolved instead.'); },
            function(err) { return __tcMatchers(err, __why).toEqual(expected); }
          );
        },
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) fail('This value must not be ' + __tcShow(expected) + ', and it is.');
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) {
            fail('This value must not equal ' + __tcShow(expected) + ', and it does.');
          }
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) {
            fail('This value must be undefined, and it is ' + __tcShow(actual) + '.');
          }
        },
        toBeNull: function() {
          if (actual === null) fail('This value must not be null, and it is.');
        },
        toBeTruthy: function() {
          if (actual) fail('This value must be falsy, and it is ' + __tcShow(actual) + '.');
        },
        toBeFalsy: function() {
          if (!actual) fail('This value must be truthy, and it is ' + __tcShow(actual) + '.');
        },
        toContain: function(expected) {
          if (contains(expected) === true) {
            fail('Your value must not contain ' + __tcShow(expected) + ', and it does.');
          }
        },
        toMatch: function(pattern) {
          var s = String(actual);
          var matched = __tcIsRe(pattern) ? pattern.test(s) : s.indexOf(String(pattern)) !== -1;
          if (matched) {
            fail('Your text must not match ' + (__tcIsRe(pattern) ? String(pattern) : __tcShow(String(pattern))) + ', and it does.');
          }
        },
        toHaveProperty: function(key) {
          var path = String(key).split('.');
          var cur = actual;
          for (var i = 0; i < path.length; i++) {
            var reachable = cur !== null && (typeof cur === 'object' || typeof cur === 'function');
            if (!reachable || !(path[i] in cur)) return;
            cur = cur[path[i]];
          }
          fail('This value must not have a property named ' + __tcShow(key) + ', and it does.');
        },
        toHaveBeenCalled: function() {
          if (actual && actual.mock && actual.mock.calls.length > 0) {
            fail('This function must not have been called, and it was called ' + actual.mock.calls.length + ' time(s).');
          }
        },
        toBeCloseTo: function(expected, precision) {
          var p = precision === undefined ? __tcDefaultPrecision() : precision;
          var limit = Math.pow(10, -p) / 2;
          if (Math.abs(actual - expected) < limit) {
            fail('This value must not sit within ' + __tcTolerance(p) + ' of that target, and it does.');
          }
        },
      },
    };
  }

  function expect(actual, why) {
    return __tcMatchers(actual, why);
  }
  __tcInstallStatics(expect);
  var jest = __tcJest();
  /* --- end shared-assertions --- */
`;

const TF_MOCK = `
  var tf = (function() {
    function toNested(flat, shape) {
      if (shape.length === 0) return flat[0];
      if (shape.length === 1) return Array.from(flat.slice(0, shape[0]));
      var outer = shape[0];
      var innerSize = shape.slice(1).reduce(function(a,b){return a*b;},1);
      var result = [];
      for (var i = 0; i < outer; i++) {
        result.push(toNested(flat.slice(i * innerSize, (i + 1) * innerSize), shape.slice(1)));
      }
      return result;
    }
    // Resolve a single -1 dimension in a shape by dividing total/product-of-others.
    function _resolveShape(shape, total) {
      var negOne = -1;
      var product = 1;
      var sawNegative = false;
      for (var i = 0; i < shape.length; i++) {
        if (shape[i] === -1) sawNegative = true;
        else product *= shape[i];
      }
      if (!sawNegative) return shape.slice();
      if (product === 0) return shape.slice();
      var out = shape.slice();
      for (var i = 0; i < out.length; i++) {
        if (out[i] === -1) out[i] = Math.max(1, Math.floor(total / product));
      }
      return out;
    }
    function makeTensor(flat, s) {
      var t = {
        dataSync: function() { return Float32Array.from(flat); },
        data: function() { return Promise.resolve(Float32Array.from(flat)); },
        arraySync: function() { return toNested(Array.from(flat), s); },
        array: function() { return Promise.resolve(toNested(Array.from(flat), s)); },
        shape: s,
        dtype: 'float32',
        rank: s.length,
        size: s.reduce(function(a,b){ return a*b; }, 1),
        reshape: function(newShape) {
          var resolved = _resolveShape(newShape, flat.length);
          return makeTensor(Array.from(flat), resolved);
        },
        flatten: function() { return makeTensor(Array.from(flat), [flat.length]); },
        squeeze: function() {
          // Match TF.js semantics: squeeze drops all size-1 axes; if the input
          // reduces to a scalar the resulting shape is empty ([]).
          var newShape = s.filter(function(d) { return d !== 1; });
          return makeTensor(Array.from(flat), newShape);
        },
        expandDims: function(axis) {
          axis = axis == null ? 0 : axis;
          var newShape = s.slice();
          newShape.splice(axis, 0, 1);
          return makeTensor(Array.from(flat), newShape);
        },
        transpose: function() {
          // Only implements 2D transpose; identity for higher-rank.
          if (s.length !== 2) return makeTensor(Array.from(flat), s);
          var rows = s[0], cols = s[1];
          var out = new Array(rows * cols);
          for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
              out[c * rows + r] = flat[r * cols + c];
          return makeTensor(out, [cols, rows]);
        },
        cast: function() { return this; },
        clone: function() { return makeTensor(Array.from(flat), s.slice()); },
        slice: function(start, size) {
          // Minimal 1D slice support
          if (typeof start === 'number') {
            var len = typeof size === 'number' ? size : flat.length - start;
            return makeTensor(flat.slice(start, start + len), [len]);
          }
          return makeTensor(Array.from(flat), s.slice());
        },
        gather: function() { return this; },
        add: function(other) { return _tf.add(this, other); },
        sub: function(other) { return _tf.sub(this, other); },
        mul: function(other) { return _tf.mul(this, other); },
        div: function(other) { return _tf.div(this, other); },
        sum: function() { return _tf.sum(this); },
        mean: function() { return _tf.mean(this); },
        max: function() { return _tf.max(this); },
        min: function() { return _tf.min(this); },
        argMax: function(axis) { return _tf.argMax(this, axis); },
        argMin: function(axis) { return _tf.argMin(this, axis); },
        exp: function() { return _tf.exp(this); },
        log: function() { return _tf.log(this); },
        abs: function() { return _tf.abs(this); },
        sqrt: function() { return _tf.sqrt(this); },
        square: function() { return _tf.pow(this, 2); },
        pow: function(e) { return _tf.pow(this, typeof e === 'number' ? e : 2); },
        neg: function() { return _tf.neg(this); },
        softmax: function() { return _tf.softmax(this); },
        sigmoid: function() { return _tf.sigmoid(this); },
        tanh: function() { return _tf.tanh(this); },
        relu: function() { return _tf.relu(this); },
        norm: function() { return _tf.norm(this); },
        std: function() {
          var m = flat.reduce(function(a,b){return a+b;},0)/flat.length;
          var v = flat.reduce(function(a,b){return a+(b-m)*(b-m);},0)/flat.length;
          return _tf.tensor([Math.sqrt(v)]);
        },
        print: function() {},
        dispose: function() {},
      };
      return t;
    }
    var _tf = {
      tensor: function(data, shape) {
        var flat = Array.isArray(data) ? data.flat(Infinity) : [data];
        var s = shape || [flat.length];
        return makeTensor(flat, s);
      },
      tensor1d: function(values) { return _tf.tensor(values, [values.length]); },
      tensor2d: function(values, shape) {
        var flat = values.flat(Infinity);
        var s = shape || [values.length, values[0].length];
        return _tf.tensor(flat, s);
      },
      tensor3d: function(values, shape) {
        var flat = Array.isArray(values) ? values.flat(Infinity) : [values];
        var s = shape || [values.length, values[0].length, values[0][0].length];
        return _tf.tensor(flat, s);
      },
      tensor4d: function(values, shape) {
        var flat = Array.isArray(values) ? values.flat(Infinity) : [values];
        return _tf.tensor(flat, shape || [1, 1, 1, flat.length]);
      },
      scalar: function(v) { return _tf.tensor([v], []); },
      zeros: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(0), shape);
      },
      ones: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(1), shape);
      },
      randomNormal: function(shape) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        var data = [];
        for (var i = 0; i < size; i += 2) {
          var u1 = Math.random(), u2 = Math.random();
          var z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          var z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
          data.push(z0);
          if (i + 1 < size) data.push(z1);
        }
        return _tf.tensor(data, shape);
      },
      linspace: function(start, stop, num) {
        var data = [];
        var step = num > 1 ? (stop - start) / (num - 1) : 0;
        for (var i = 0; i < num; i++) data.push(start + step * i);
        return _tf.tensor(data, [num]);
      },
      range: function(start, limit, delta) {
        delta = delta || 1;
        var data = [];
        for (var v = start; delta > 0 ? v < limit : v > limit; v += delta) data.push(v);
        return _tf.tensor(data, [data.length]);
      },
      oneHot: function(indices, depth) {
        var idx = Array.isArray(indices) ? indices : Array.from(indices.dataSync());
        var data = [];
        for (var i = 0; i < idx.length; i++) {
          for (var j = 0; j < depth; j++) data.push(j === idx[i] ? 1 : 0);
        }
        return _tf.tensor(data, [idx.length, depth]);
      },
      concat: function(tensors, axis) {
        axis = axis || 0;
        if (axis < 0) axis = tensors[0].shape.length + axis;
        // Compute output shape.
        var outShape = tensors[0].shape.slice();
        outShape[axis] = 0;
        for (var i = 0; i < tensors.length; i++) outShape[axis] += tensors[i].shape[axis];
        // Axis 0 is the fast path: flat data concatenates directly.
        if (axis === 0) {
          var allData = [];
          for (var i = 0; i < tensors.length; i++) allData = allData.concat(Array.from(tensors[i].dataSync()));
          return _tf.tensor(allData, outShape);
        }
        // General-axis concat: interleave rows appropriately.  For 2-D inputs
        // concatenated along axis 1, we emit rows of (sum of row slices).
        if (tensors[0].shape.length === 2 && axis === 1) {
          var rows = tensors[0].shape[0];
          var allData = [];
          var dataArrs = tensors.map(function(t){ return Array.from(t.dataSync()); });
          var cols = tensors.map(function(t){ return t.shape[1]; });
          for (var r = 0; r < rows; r++) {
            for (var t = 0; t < tensors.length; t++) {
              for (var c = 0; c < cols[t]; c++) {
                allData.push(dataArrs[t][r * cols[t] + c]);
              }
            }
          }
          return _tf.tensor(allData, outShape);
        }
        // Fallback: shape only, zeros data.
        var total = outShape.reduce(function(a,b){ return a*(b||1); }, 1);
        return _tf.tensor(new Array(total).fill(0), outShape);
      },
      // Binary element-wise ops accept tensor, number, or number[] for b.
      // When b is shorter than a, broadcast by wrapping indices (cheap scalar
      // / row broadcast emulator that covers the exercises we run here).
      add: function(a,b) { return _tf._binop(a,b,function(x,y){return x+y;}); },
      sub: function(a,b) { return _tf._binop(a,b,function(x,y){return x-y;}); },
      mul: function(a,b) { return _tf._binop(a,b,function(x,y){return x*y;}); },
      div: function(a,b) { return _tf._binop(a,b,function(x,y){return x/y;}); },
      _binop: function(a,b,fn) {
        var ad = Array.from(a.dataSync());
        var bd;
        if (b != null && typeof b.dataSync === 'function') bd = Array.from(b.dataSync());
        else if (Array.isArray(b)) bd = b;
        else bd = [Number(b)];
        var len = bd.length;
        return _tf.tensor(ad.map(function(v,i){ return fn(v, bd[i % len]); }), a.shape);
      },
      // Element-wise dot product: a_i * b_i summed to a scalar tensor.
      dot: function(a, b) {
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var len = Math.min(ad.length, bd.length);
        var s = 0;
        for (var i = 0; i < len; i++) s += ad[i] * bd[i];
        return _tf.scalar(s);
      },
      // Gather: select indices along axis 0 (most common usage).
      gather: function(params, indices, axis) {
        axis = axis || 0;
        var idx = Array.isArray(indices)
          ? indices
          : Array.from(indices.dataSync());
        var src = Array.from(params.dataSync());
        var shape = params.shape;
        if (axis === 0) {
          var inner = shape.slice(1).reduce(function(a,b){return a*b;},1);
          var out = [];
          for (var i = 0; i < idx.length; i++) {
            var base = idx[i] * inner;
            for (var j = 0; j < inner; j++) out.push(src[base + j] || 0);
          }
          return _tf.tensor(out, [idx.length].concat(shape.slice(1)));
        }
        // Fallback: return params unchanged for unsupported axes.
        return params;
      },
      relu: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.max(0,v);}), x.shape); },
      sigmoid: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return 1/(1+Math.exp(-v));}), x.shape); },
      softmax: function(x) { var d=Array.from(x.dataSync()); var max=Math.max.apply(null,d); var exp=d.map(function(v){return Math.exp(v-max);}); var sum=exp.reduce(function(a,b){return a+b;},0); return _tf.tensor(exp.map(function(v){return v/sum;}), x.shape); },
      tanh: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.tanh(v);}), x.shape); },
      exp: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.exp(v);}), x.shape); },
      log: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.log(v);}), x.shape); },
      abs: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.abs(v);}), x.shape); },
      sqrt: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.sqrt(v);}), x.shape); },
      pow: function(x, e) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.pow(v, e);}), x.shape); },
      neg: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return -v;}), x.shape); },
      sum: function(x, axis) { return _tf._reduce(x, axis, 'sum'); },
      mean: function(x, axis) { return _tf._reduce(x, axis, 'mean'); },
      max: function(x, axis) { return _tf._reduce(x, axis, 'max'); },
      min: function(x, axis) { return _tf._reduce(x, axis, 'min'); },
      argMax: function(x, axis) { return _tf._reduce(x, axis, 'argMax'); },
      argMin: function(x, axis) { return _tf._reduce(x, axis, 'argMin'); },
      // Axis-aware reduction for the common case of 2-D tensors + scalar axis.
      // Falls back to flat reduction (matching the old behavior) when axis is
      // omitted or the input is > 2-D.
      _reduce: function(x, axis, op) {
        var d = Array.from(x.dataSync());
        function combine(values) {
          if (op === 'sum') return values.reduce(function(a,b){return a+b;},0);
          if (op === 'mean') return values.reduce(function(a,b){return a+b;},0) / values.length;
          if (op === 'max') return Math.max.apply(null, values);
          if (op === 'min') return Math.min.apply(null, values);
          if (op === 'argMax') {
            var idx = 0; for (var i = 1; i < values.length; i++) if (values[i] > values[idx]) idx = i;
            return idx;
          }
          if (op === 'argMin') {
            var idx = 0; for (var i = 1; i < values.length; i++) if (values[i] < values[idx]) idx = i;
            return idx;
          }
          return 0;
        }
        if (axis == null) {
          return _tf.scalar(combine(d));
        }
        var shape = x.shape;
        if (axis < 0) axis = shape.length + axis;
        if (shape.length === 2) {
          var rows = shape[0], cols = shape[1];
          if (axis === 0) {
            var out = [];
            for (var c = 0; c < cols; c++) {
              var col = [];
              for (var r = 0; r < rows; r++) col.push(d[r * cols + c]);
              out.push(combine(col));
            }
            return _tf.tensor(out, [cols]);
          }
          if (axis === 1) {
            var out = [];
            for (var r = 0; r < rows; r++) {
              out.push(combine(d.slice(r * cols, (r + 1) * cols)));
            }
            return _tf.tensor(out, [rows]);
          }
        }
        // Fallback for rank > 2: treat as flat.
        return _tf.scalar(combine(d));
      },
      matMul: function(a, b, transposeA, transposeB) {
        transposeA = !!transposeA;
        transposeB = !!transposeB;
        // Effective 2D shapes after optional transpose.
        var aShape = a.shape.length === 2 ? a.shape : [a.shape[0] || 1, a.shape[1] || 1];
        var bShape = b.shape.length === 2 ? b.shape : [b.shape[0] || 1, b.shape[1] || 1];
        var aRows = transposeA ? aShape[1] : aShape[0];
        var aCols = transposeA ? aShape[0] : aShape[1];
        var bRows = transposeB ? bShape[1] : bShape[0];
        var bCols = transposeB ? bShape[0] : bShape[1];
        if (aCols !== bRows) {
          throw new Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
        }
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var result = [];
        function readA(r, c) {
          return transposeA
            ? ad[c * aShape[1] + r]
            : ad[r * aShape[1] + c];
        }
        function readB(r, c) {
          return transposeB
            ? bd[c * bShape[1] + r]
            : bd[r * bShape[1] + c];
        }
        for (var i = 0; i < aRows; i++) {
          for (var j = 0; j < bCols; j++) {
            var s = 0;
            for (var k = 0; k < aCols; k++) s += readA(i, k) * readB(k, j);
            result.push(s);
          }
        }
        return _tf.tensor(result, [aRows, bCols]);
      },
      // Shape/construction helpers exercises call frequently.
      fill: function(shape, value) {
        var size = shape.reduce(function(a,b){return a*b;},1);
        return _tf.tensor(new Array(size).fill(value), shape);
      },
      randomUniform: function(shape, minval, maxval) {
        minval = minval == null ? 0 : minval;
        maxval = maxval == null ? 1 : maxval;
        var size = shape.reduce(function(a,b){return a*b;},1);
        var data = [];
        for (var i = 0; i < size; i++) data.push(minval + Math.random() * (maxval - minval));
        return _tf.tensor(data, shape);
      },
      truncatedNormal: function(shape) { return _tf.randomNormal(shape); },
      norm: function(x, ord, axis) {
        var d = Array.from(x.dataSync());
        var s = 0;
        for (var i = 0; i < d.length; i++) s += d[i] * d[i];
        return _tf.tensor([Math.sqrt(s)]);
      },
      maximum: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bIsTensor = b && typeof b.dataSync === 'function';
        var bd = bIsTensor ? Array.from(b.dataSync()) : null;
        return _tf.tensor(ad.map(function(v,i){ return Math.max(v, bIsTensor ? bd[i % bd.length] : b); }), a.shape);
      },
      minimum: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bIsTensor = b && typeof b.dataSync === 'function';
        var bd = bIsTensor ? Array.from(b.dataSync()) : null;
        return _tf.tensor(ad.map(function(v,i){ return Math.min(v, bIsTensor ? bd[i % bd.length] : b); }), a.shape);
      },
      clipByValue: function(x, lo, hi) {
        var d = Array.from(x.dataSync());
        return _tf.tensor(d.map(function(v){ return Math.min(hi, Math.max(lo, v)); }), x.shape);
      },
      stack: function(tensors, axis) {
        axis = axis || 0;
        var allData = [];
        for (var i = 0; i < tensors.length; i++) allData = allData.concat(Array.from(tensors[i].dataSync()));
        return _tf.tensor(allData, [tensors.length].concat(tensors[0].shape));
      },
      eye: function(n) {
        var data = [];
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) data.push(i === j ? 1 : 0);
        }
        return _tf.tensor(data, [n, n]);
      },
      // 1-D convolution: stub returns a zero tensor with an expected output shape.
      conv1d: function(input, kernel) {
        var batch = input && input.shape ? input.shape[0] : 1;
        var length = input && input.shape ? input.shape[1] : 1;
        var outCh = kernel && kernel.shape ? kernel.shape[kernel.shape.length - 1] : 1;
        return _tf.zeros([batch, length, outCh]);
      },
      conv2d: function(input, kernel) {
        var shape = input && input.shape ? input.shape.slice() : [1, 1, 1, 1];
        var outCh = kernel && kernel.shape ? kernel.shape[kernel.shape.length - 1] : shape[shape.length - 1];
        shape[shape.length - 1] = outCh;
        return _tf.zeros(shape);
      },
      split: function(input, numOrSizes) {
        var n = Array.isArray(numOrSizes) ? numOrSizes.length : numOrSizes;
        var out = [];
        for (var i = 0; i < n; i++) out.push(input);
        return out;
      },
      unstack: function(input) {
        var n = input && input.shape ? input.shape[0] : 1;
        var out = [];
        for (var i = 0; i < n; i++) out.push(_tf.zeros(input.shape.slice(1)));
        return out;
      },
      // Elementwise maxPool/minPool stubs.
      moments: function(input) {
        return { mean: _tf.scalar(0), variance: _tf.scalar(1) };
      },
      multinomial: function(logits, numSamples) {
        var data = [];
        for (var i = 0; i < numSamples; i++) data.push(0);
        return _tf.tensor(data, [numSamples]);
      },
      topk: function(input, k) {
        return {
          values: _tf.zeros([k]),
          indices: _tf.zeros([k]),
        };
      },
      where: function(condition, a, b) {
        // Just return a to keep shape sensible.
        return a;
      },
      greater: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v > bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      less: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v < bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      equal: function(a, b) {
        var ad = Array.from(a.dataSync());
        var bd = (b && typeof b.dataSync === 'function') ? Array.from(b.dataSync()) : [Number(b)];
        return _tf.tensor(ad.map(function(v,i){ return v === bd[i % bd.length] ? 1 : 0; }), a.shape);
      },
      // Execution / environment stubs.
      tidy: function(nameOrFn, fnMaybe) {
        var fn = typeof nameOrFn === 'function' ? nameOrFn : fnMaybe;
        return fn();
      },
      keep: function(t) { return t; },
      dispose: function() {},
      disposeVariables: function() {},
      ready: function() { return Promise.resolve(); },
      setBackend: function() { return Promise.resolve(true); },
      getBackend: function() { return 'cpu'; },
      memory: function() { return { numTensors: 0, numBytes: 0 }; },
      version: { tfjs: '4.0.0' },
      env: function() { return { get: function(){ return false; }, set: function(){}, getBool: function(){ return false; }, getNumber: function(){ return 0; } }; },
      engine: function() { return { startScope: function(){}, endScope: function(){} }; },
      variable: function(t) {
        var v = t;
        v.assign = function() {};
        return v;
      },
      grad: function(fn) { return function(x) { return _tf.zerosLike(x); }; },
      grads: function(fn) { return function() { return { value: _tf.scalar(0), grads: [] }; }; },
      valueAndGrad: function(fn) { return function(x) { return { value: _tf.scalar(0), grad: _tf.zerosLike(x) }; }; },
      // variableGrads: returns {value, grads} with grads keyed by variable names
      // (or ordered arrays).  We return a scalar value + an empty grads map.
      variableGrads: function(fn, varList) {
        try { var value = fn(); } catch (e) { var value = _tf.scalar(0); }
        var grads = {};
        if (Array.isArray(varList)) {
          for (var i = 0; i < varList.length; i++) {
            grads['var_' + i] = _tf.zerosLike(varList[i] || _tf.scalar(0));
          }
        }
        return { value: value, grads: grads };
      },
      zerosLike: function(x) { return _tf.zeros(x.shape); },
      onesLike: function(x) { return _tf.ones(x.shape); },
      // Losses namespace used by reconstruction-error, etc.
      losses: {
        meanSquaredError: function(a, b) {
          var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
          var s = 0;
          for (var i = 0; i < ad.length; i++) s += (ad[i] - bd[i]) * (ad[i] - bd[i]);
          return _tf.scalar(s / ad.length);
        },
        absoluteDifference: function(a, b) {
          var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
          var s = 0;
          for (var i = 0; i < ad.length; i++) s += Math.abs(ad[i] - bd[i]);
          return _tf.scalar(s / ad.length);
        },
        // Stubs return a plausible non-zero scalar; exercise tests that use
        // these check for shape/type, not exact values.
        categoricalCrossentropy: function() { return _tf.scalar(0.5); },
        binaryCrossentropy: function() { return _tf.scalar(0.5); },
        softmaxCrossEntropy: function() { return _tf.scalar(0.5); },
        sigmoidCrossEntropy: function() { return _tf.scalar(0.5); },
        kullbackLeiblerDivergence: function() { return _tf.scalar(0.1); },
        huberLoss: function() { return _tf.scalar(0.3); },
        cosineDistance: function() { return _tf.scalar(0.1); },
        hingeLoss: function() { return _tf.scalar(0.2); },
        logLoss: function() { return _tf.scalar(0.3); },
      },
      // Metrics namespace - all return a scalar 0.5 (harness checks callability,
      // not values).
      metrics: {
        accuracy: function() { return _tf.scalar(0.5); },
        binaryAccuracy: function() { return _tf.scalar(0.5); },
        categoricalAccuracy: function() { return _tf.scalar(0.5); },
        sparseCategoricalAccuracy: function() { return _tf.scalar(0.5); },
        precision: function() { return _tf.scalar(0.5); },
        recall: function() { return _tf.scalar(0.5); },
        meanAbsoluteError: function() { return _tf.scalar(0.1); },
        meanSquaredError: function() { return _tf.scalar(0.1); },
      },
      // Signal namespace - minimal STFT/RFFT returning reasonably-shaped tensors.
      // tf.spectral aliases the same operations in real TF.js.
      get spectral() { return _tf.signal; },
      signal: {
        hannWindow: function(length) {
          var data = [];
          for (var i = 0; i < length; i++) data.push(0.5 - 0.5 * Math.cos(2 * Math.PI * i / (length - 1)));
          return _tf.tensor(data, [length]);
        },
        hammingWindow: function(length) {
          var data = [];
          for (var i = 0; i < length; i++) data.push(0.54 - 0.46 * Math.cos(2 * Math.PI * i / (length - 1)));
          return _tf.tensor(data, [length]);
        },
        stft: function(input, frameLength, frameStep) {
          var total = input && input.shape ? input.shape[0] : 0;
          var frames = Math.max(0, Math.floor((total - frameLength) / frameStep) + 1);
          var bins = Math.floor(frameLength / 2) + 1;
          return _tf.zeros([frames, bins]);
        },
        // rfft: real-input FFT → returns complex magnitudes of length ~n/2+1.
        rfft: function(input) {
          var n = input && input.shape ? input.shape[input.shape.length - 1] : 0;
          var bins = Math.floor(n / 2) + 1;
          var shape = input && input.shape ? input.shape.slice(0, -1).concat([bins]) : [bins];
          return _tf.zeros(shape);
        },
        fft: function(input) { return input.shape ? _tf.zeros(input.shape) : _tf.zeros([1]); },
        ifft: function(input) { return input.shape ? _tf.zeros(input.shape) : _tf.zeros([1]); },
      },
      // Image namespace - resizing stubs return tensors at the requested size.
      image: {
        resizeBilinear: function(img, size) {
          // size = [height, width]
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          var batch = img && img.shape && img.shape.length === 4 ? img.shape[0] : null;
          var shape = batch != null
            ? [batch, size[0], size[1], channels]
            : [size[0], size[1], channels];
          return _tf.zeros(shape);
        },
        resizeNearestNeighbor: function(img, size) {
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          var batch = img && img.shape && img.shape.length === 4 ? img.shape[0] : null;
          var shape = batch != null
            ? [batch, size[0], size[1], channels]
            : [size[0], size[1], channels];
          return _tf.zeros(shape);
        },
        cropAndResize: function(img, boxes, boxInd, cropSize) {
          var numBoxes = Array.isArray(boxInd) ? boxInd.length
            : (boxInd && boxInd.shape) ? boxInd.shape[0] : 1;
          var channels = img && img.shape ? img.shape[img.shape.length - 1] : 1;
          return _tf.zeros([numBoxes, cropSize[0], cropSize[1], channels]);
        },
        nonMaxSuppression: function() { return _tf.tensor([0], [1]); },
        flipLeftRight: function(img) { return img; },
        rotateWithOffset: function(img) { return img; },
      },
      // Minimal chainable data pipeline builder.
      data: {
        array: function(arr) { return _makeDataset(arr || []); },
        generator: function(gen) {
          var items = [];
          try {
            var iter = typeof gen === 'function' ? gen() : gen;
            var step;
            while (!(step = iter.next()).done) items.push(step.value);
          } catch (e) {}
          return _makeDataset(items);
        },
        zip: function(obj) { return _makeDataset([]); },
        csv: function() { return _makeDataset([]); },
        microphone: function() { return Promise.resolve(_makeDataset([])); },
        webcam: function() { return Promise.resolve({
          capture: function() { return _tf.zeros([1, 224, 224, 3]); },
          stop: function() {},
        }); },
      },
      // Model I/O.
      loadLayersModel: function() { return Promise.resolve(_layersModelStub()); },
      loadGraphModel: function() { return Promise.resolve(_layersModelStub()); },
      io: {
        browserHTTPRequest: function() { return {}; },
        withSaveHandler: function() { return {}; },
      },
      // Functional API: tf.input() + tf.model().
      input: function(config) {
        var shape = config && config.shape ? config.shape : [null];
        return _makeSymbolic([null].concat(shape || []));
      },
      model: function(config) {
        return _layersModelStub(config);
      },
      sequential: function(config) {
        var layers = (config && config.layers) ? config.layers.slice() : [];
        var m = {
          add: function(layer) { layers.push(layer); },
          compile: function(opts) {
            m._compiled = opts || {};
            m.optimizer = (opts && opts.optimizer) || 'adam';
            m.loss = (opts && opts.loss) || 'meanSquaredError';
          },
          fit: function(x,y,opts) { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9], accuracy: [0.5, 0.7, 0.9] } }); },
          fitDataset: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9] } }); },
          trainOnBatch: function() { return Promise.resolve([0.1, 0.9]); },
          evaluate: function() { return [_tf.scalar(0.1), _tf.scalar(0.9)]; },
          predict: function(x) {
            var batchSize = (x && x.shape) ? x.shape[0] : 1;
            var lastUnits = layers.length > 0 && layers[layers.length-1].units ? layers[layers.length-1].units : 1;
            return _tf.zeros([batchSize, lastUnits]);
          },
          // Symbolic-style apply() for functional composition: returns a
          // symbolic tensor with the model's output shape, given either a
          // symbolic input or a concrete tensor input.
          apply: function(input) {
            var batch = null;
            if (input && input.shape) batch = input.shape[0];
            var last = layers[layers.length - 1];
            var units = last && last.units ? last.units : 1;
            var s = _makeSymbolic([batch, units]);
            return s;
          },
          summary: function() {},
          save: function() { return Promise.resolve({ modelArtifactsInfo: {} }); },
          getWeights: function() { return []; },
          setWeights: function() {},
          dispose: function() {},
          layers: layers,
          get inputs() {
            return [{ shape: [null].concat(layers[0] && layers[0].inputShape ? layers[0].inputShape : []) }];
          },
          get inputShape() {
            return [null].concat(layers[0] && layers[0].inputShape ? layers[0].inputShape : []);
          },
          get outputs() {
            var last = layers[layers.length - 1];
            return [{ shape: [null, last && last.units ? last.units : 1] }];
          },
          get outputShape() {
            // Walk layers to derive output rank when conv/reshape layers shape the output.
            return _deriveOutputShape(layers);
          },
          trainable: true,
          countParams: function() {
            var total = 0;
            for (var i = 0; i < layers.length; i++) total += (layers[i].units || 0);
            return total;
          },
        };
        return m;
      },
      layers: {
        dense: _layerFactory('dense', ['units', 'activation', 'useBias', 'kernelInitializer', 'inputShape', 'name']),
        dropout: _layerFactory('dropout', ['rate', 'name']),
        flatten: _layerFactory('flatten', ['name']),
        reshape: _layerFactory('reshape', ['targetShape', 'name']),
        activation: _layerFactory('activation', ['activation', 'name']),
        embedding: _layerFactory('embedding', ['inputDim', 'outputDim', 'inputLength', 'name']),
        conv1d: _layerFactory('conv1d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        conv2d: _layerFactory('conv2d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        conv2dTranspose: _layerFactory('conv2dTranspose', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'inputShape', 'name']),
        separableConv2d: _layerFactory('separableConv2d', ['filters', 'kernelSize', 'strides', 'padding', 'activation', 'name']),
        depthwiseConv2d: _layerFactory('depthwiseConv2d', ['kernelSize', 'strides', 'padding', 'activation', 'name']),
        maxPooling2d: _layerFactory('maxPooling2d', ['poolSize', 'strides', 'name']),
        averagePooling2d: _layerFactory('averagePooling2d', ['poolSize', 'strides', 'name']),
        globalAveragePooling1d: _layerFactory('globalAveragePooling1d', ['name']),
        globalAveragePooling2d: _layerFactory('globalAveragePooling2d', ['name']),
        globalMaxPooling1d: _layerFactory('globalMaxPooling1d', ['name']),
        globalMaxPooling2d: _layerFactory('globalMaxPooling2d', ['name']),
        upSampling2d: _layerFactory('upSampling2d', ['size', 'name']),
        batchNormalization: _layerFactory('batchNormalization', ['axis', 'momentum', 'epsilon', 'name']),
        layerNormalization: _layerFactory('layerNormalization', ['axis', 'epsilon', 'name']),
        leakyReLU: _layerFactory('leakyReLU', ['alpha', 'name']),
        reLU: _layerFactory('reLU', ['maxValue', 'name']),
        prelu: _layerFactory('prelu', ['name']),
        elu: _layerFactory('elu', ['alpha', 'name']),
        simpleRNN: _layerFactory('simpleRNN', ['units', 'returnSequences', 'activation', 'name']),
        lstm: _layerFactory('lstm', ['units', 'returnSequences', 'returnState', 'activation', 'recurrentActivation', 'name']),
        gru: _layerFactory('gru', ['units', 'returnSequences', 'activation', 'name']),
        bidirectional: _layerFactory('bidirectional', ['layer', 'mergeMode', 'name']),
        timeDistributed: _layerFactory('timeDistributed', ['layer', 'name']),
        concatenate: _layerFactory('concatenate', ['axis', 'name']),
        add: _layerFactory('add', ['name']),
        multiply: _layerFactory('multiply', ['name']),
        average: _layerFactory('average', ['name']),
        dot: _layerFactory('dot', ['axes', 'name']),
        masking: _layerFactory('masking', ['maskValue', 'name']),
        spatialDropout1d: _layerFactory('spatialDropout1d', ['rate', 'name']),
      },
      initializers: {
        glorotUniform: function() { return 'glorot_uniform'; },
        glorotNormal: function() { return 'glorot_normal'; },
        heNormal: function() { return 'he_normal'; },
        heUniform: function() { return 'he_uniform'; },
        randomNormal: function() { return 'random_normal'; },
        zeros: function() { return 'zeros'; },
        ones: function() { return 'ones'; },
      },
      train: {
        adam: function() { return { applyGradients: function(){} }; },
        sgd: function() { return { applyGradients: function(){} }; },
        rmsprop: function() { return { applyGradients: function(){} }; },
        adagrad: function() { return { applyGradients: function(){} }; },
      },
      regularizers: {
        l1: function() { return {}; },
        l2: function() { return {}; },
        l1l2: function() { return {}; },
      },
    };

    function _layerFactory(type, keys) {
      return function(config) {
        config = config || {};
        var layer = { type: type };
        for (var i = 0; i < keys.length; i++) {
          if (config[keys[i]] !== undefined) layer[keys[i]] = config[keys[i]];
        }
        layer.apply = function(input) {
          // When passed a symbolic tensor, return another symbolic tensor.
          // When passed a concrete tensor (with dataSync), emit a real tensor
          // of zeros with an updated output shape so callers can .reshape /
          // .array / .dataSync on the result.
          var isSymbolic = input && input._isSymbolic;
          var hasData = input && typeof input.dataSync === 'function';
          // Concatenate accepts an array of inputs.
          var primary = Array.isArray(input) ? input[0] : input;
          var shape;
          if (primary && primary.shape) {
            shape = primary.shape.slice();
            if (type === 'conv2d' || type === 'conv2dTranspose' || type === 'separableConv2d' || type === 'depthwiseConv2d') {
              if (config.filters && shape.length >= 4) {
                var strides = Array.isArray(config.strides) ? config.strides : (config.strides ? [config.strides, config.strides] : [1, 1]);
                if (config.padding === 'same') {
                  shape = [shape[0], shape[1] ? Math.ceil(shape[1] / strides[0]) : null, shape[2] ? Math.ceil(shape[2] / strides[1]) : null, config.filters];
                } else if (type === 'conv2dTranspose') {
                  shape = [shape[0], shape[1] ? shape[1] * strides[0] : null, shape[2] ? shape[2] * strides[1] : null, config.filters];
                } else {
                  shape = [shape[0], shape[1], shape[2], config.filters];
                }
              }
            } else if (type === 'maxPooling2d' || type === 'averagePooling2d') {
              var ps = Array.isArray(config.poolSize) ? config.poolSize
                : (typeof config.poolSize === 'number' ? [config.poolSize, config.poolSize] : [2, 2]);
              if (shape.length >= 4) {
                shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps[0]) : null, shape[2] ? Math.floor(shape[2] / ps[1]) : null, shape[3]];
              }
            } else if (type === 'upSampling2d') {
              var sz = Array.isArray(config.size) ? config.size
                : (typeof config.size === 'number' ? [config.size, config.size] : [2, 2]);
              if (shape.length >= 4) {
                shape = [shape[0], shape[1] ? shape[1] * sz[0] : null, shape[2] ? shape[2] * sz[1] : null, shape[3]];
              }
            } else if (type === 'globalAveragePooling2d' || type === 'globalMaxPooling2d') {
              shape = [shape[0], shape[3] || 1];
            } else if (type === 'globalAveragePooling1d' || type === 'globalMaxPooling1d') {
              shape = [shape[0], shape[2] || 1];
            } else if (type === 'flatten') {
              var prod = 1;
              for (var k = 1; k < shape.length; k++) prod *= (shape[k] || 1);
              shape = [shape[0], prod];
            } else if (type === 'reshape' && config.targetShape) {
              shape = [shape[0]].concat(config.targetShape);
            } else if (type === 'embedding') {
              shape = shape.concat([config.outputDim || 1]);
            } else if (type === 'concatenate') {
              // Concatenate along last axis if unspecified: sum last dims.
              if (Array.isArray(input)) {
                var axis = config.axis == null ? (shape.length - 1) : config.axis;
                if (axis < 0) axis = shape.length + axis;
                var total = 0;
                for (var m = 0; m < input.length; m++) {
                  total += (input[m].shape && input[m].shape[axis]) || 0;
                }
                shape[axis] = total;
              }
            } else if (type === 'bidirectional' && config.layer && config.layer.units) {
              shape[shape.length - 1] = config.layer.units * 2;
            } else if (type === 'simpleRNN' || type === 'lstm' || type === 'gru') {
              if (config.returnSequences) shape = [shape[0], shape[1], config.units];
              else shape = [shape[0], config.units];
            } else if (config.units) {
              shape[shape.length - 1] = config.units;
            }
          } else {
            shape = [null, config.units || 1];
          }
          if (hasData && !isSymbolic) {
            return _tf.zeros(shape.map(function(v){ return v == null ? 1 : v; }));
          }
          return _makeSymbolic(shape);
        };
        layer.getClassName = function() {
          // Mirror TF.js class names used by tests (capitalized type).
          var map = { dense: 'Dense', dropout: 'Dropout', flatten: 'Flatten', embedding: 'Embedding', conv2d: 'Conv2D', lstm: 'LSTM', gru: 'GRU', simpleRNN: 'SimpleRNN' };
          return map[type] || (type.charAt(0).toUpperCase() + type.slice(1));
        };
        layer.getConfig = function() { return Object.assign({}, config); };
        layer.trainable = true;
        layer.inputSpec = [{ shape: [null].concat(config.inputShape || []) }];
        // outputShape is filled in by _deriveOutputShape when read via
        // sequential.outputShape, but callers that inspect a single layer
        // (e.g. model.layers[i].outputShape) need a reasonable fallback
        // that incorporates the declared units.
        Object.defineProperty(layer, 'outputShape', {
          get: function() {
            if (config.units) return [null, config.units];
            if (type === 'embedding') return [null, config.inputLength || null, config.outputDim || null];
            if (type === 'flatten') return [null, null];
            if (type === 'reshape' && config.targetShape) return [null].concat(config.targetShape);
            return [null, null];
          },
        });
        return layer;
      };
    }

    function _makeSymbolic(shape) {
      return {
        shape: shape,
        _isSymbolic: true,
        // Allow chained .apply() returns to be treated as layer inputs too.
      };
    }

    // Derive the final output shape by walking layers. Best-effort: many
    // exercises only need to see the last dim (units) + the input rank.
    function _deriveOutputShape(layers) {
      if (!layers.length) return [null, 1];
      var firstShape = layers[0].inputShape ? [null].concat(layers[0].inputShape) : [null, 1];
      var shape = firstShape.slice();
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        if (l.units) {
          // Dense / RNN-ish: last dim becomes units, prior dims untouched.
          shape = shape.slice(0, -1).concat([l.units]);
        } else if (l.type === 'flatten') {
          var prod = 1;
          for (var k = 1; k < shape.length; k++) prod *= (shape[k] || 1);
          shape = [shape[0], prod];
        } else if (l.type === 'reshape' && l.targetShape) {
          shape = [shape[0]].concat(l.targetShape);
        } else if (l.type === 'conv2d' || l.type === 'conv2dTranspose' || l.type === 'separableConv2d' || l.type === 'depthwiseConv2d') {
          if (l.filters && shape.length >= 4) {
            shape = [shape[0], shape[1], shape[2], l.filters];
          }
        } else if (l.type === 'maxPooling2d' || l.type === 'averagePooling2d') {
          var ps = l.poolSize || 2;
          if (Array.isArray(ps)) {
            shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps[0]) : null, shape[2] ? Math.floor(shape[2] / ps[1]) : null, shape[3]];
          } else if (shape.length >= 4) {
            shape = [shape[0], shape[1] ? Math.floor(shape[1] / ps) : null, shape[2] ? Math.floor(shape[2] / ps) : null, shape[3]];
          }
        } else if (l.type === 'upSampling2d') {
          var sz = l.size || [2, 2];
          if (Array.isArray(sz) && shape.length >= 4) {
            shape = [shape[0], shape[1] ? shape[1] * sz[0] : null, shape[2] ? shape[2] * sz[1] : null, shape[3]];
          }
        } else if (l.type === 'globalAveragePooling2d' || l.type === 'globalMaxPooling2d') {
          shape = [shape[0], shape[3] || 1];
        } else if (l.type === 'embedding') {
          shape = [shape[0], shape[1], l.outputDim || 1];
        }
      }
      return shape;
    }

    // Chainable minimal dataset: .batch(), .shuffle(), .map(), .prefetch(),
    // .take() all return the same dataset wrapper. Iteration uses the stored
    // items array so forEachAsync works with the default batch size.
    function _makeDataset(items) {
      var batchSize = 1;
      var ds = {
        _items: items.slice(),
        batch: function(n) { batchSize = n; return ds; },
        shuffle: function() { return ds; },
        map: function(fn) { ds._items = ds._items.map(fn); return ds; },
        prefetch: function() { return ds; },
        repeat: function() { return ds; },
        take: function(n) { ds._items = ds._items.slice(0, n); return ds; },
        skip: function(n) { ds._items = ds._items.slice(n); return ds; },
        forEachAsync: function(fn) {
          // Emit batched views so tests that inspect shape see the batch dim.
          var out = [];
          for (var i = 0; i < ds._items.length; i += batchSize) {
            var chunk = ds._items.slice(i, i + batchSize);
            // If items are {xs, ys} shape, stack along batch axis.
            if (chunk[0] && chunk[0].xs && chunk[0].xs.shape) {
              var xsShape = [chunk.length].concat(chunk[0].xs.shape);
              var ysShape = [chunk.length].concat(chunk[0].ys ? chunk[0].ys.shape : []);
              out.push({ xs: _tf.zeros(xsShape), ys: _tf.zeros(ysShape) });
            } else {
              out.push(chunk);
            }
          }
          var p = Promise.resolve();
          out.forEach(function(b) { p = p.then(function() { return fn(b); }); });
          return p;
        },
        toArray: function() { return Promise.resolve(ds._items.slice()); },
        size: items.length,
      };
      return ds;
    }

    function _layersModelStub(config) {
      var inputs = (config && config.inputs) ? (Array.isArray(config.inputs) ? config.inputs : [config.inputs]) : [{ shape: [null, 1] }];
      var outputs = (config && config.outputs) ? (Array.isArray(config.outputs) ? config.outputs : [config.outputs]) : [{ shape: [null, 1] }];
      // Ensure the stub model has at least one layer so tests that assert
      // non-empty layer counts (e.g. load-model) pass.
      var stubLayers = (config && config.layers) || [{ type: 'dense', units: outputs[0].shape[outputs[0].shape.length - 1] || 1, getClassName: function(){ return 'Dense'; } }];
      return {
        layers: stubLayers,
        inputs: inputs,
        outputs: outputs,
        get inputShape() { return inputs[0].shape; },
        get outputShape() { return outputs[0].shape; },
        compile: function() {},
        fit: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1], acc: [0.5, 0.7, 0.9] } }); },
        fitDataset: function() { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } }); },
        trainOnBatch: function() { return Promise.resolve([0.1, 0.9]); },
        evaluate: function() { return [_tf.scalar(0.1), _tf.scalar(0.9)]; },
        predict: function(x) {
          var batchSize = (x && x.shape) ? x.shape[0] : 1;
          var outShape = outputs[0].shape.slice();
          outShape[0] = batchSize;
          return _tf.zeros(outShape.map(function(v){return v == null ? 1 : v;}));
        },
        // Functional model apply(): propagate output shape from the model config.
        apply: function(input) {
          var outShape = outputs[0].shape.slice();
          if (input && input.shape) outShape[0] = input.shape[0];
          return _makeSymbolic(outShape);
        },
        summary: function() {},
        save: function() { return Promise.resolve({ modelArtifactsInfo: {} }); },
        getWeights: function() { return []; },
        setWeights: function() {},
        dispose: function() {},
        countParams: function() { return 0; },
        trainable: true,
      };
    }
    return _tf;
  })();
`;

async function runSolutionTests(userCode, testCode) {
  const cleanCode = stripTypeScript(userCode);
  const cleanTestCode = stripTypeScript(testCode);

  // Same pre-parse as the browser harness, and the same single result, so
  // CI reports a submission with a brace typo the way a learner sees it.
  const syntaxError = userCodeSyntaxError(cleanCode);
  if (syntaxError) {
    return { ok: true, results: [userSyntaxErrorResult(syntaxError)] };
  }

  // Detect top-level `await` so solutions that use it still work.  Scripts
  // don't support TLA, so we fold the solution body inside the async IIFE
  // alongside the tests.  Bindings declared with `var` become visible to the
  // test block; `const`/`let` get hoisted via a naive pre-declaration pass.
  const hasTopLevelAwait = hasBareTopLevelAwait(cleanCode);

  // Real `@tensorflow/tfjs` is injected as `tf` via the vm context, so the
  // mock TF_MOCK template is no longer prepended - the inline mock had drifted
  // behind the real API surface and produced spurious failures on axis-aware
  // ops, multi-dim shapes, and recently-added kernels (`maxPool`, `eye`,
  // `expandDims`, transpose flags on `matMul`, etc.). Mock retained in source
  // for reference until the next round of cleanup.
  const fullCode = hasTopLevelAwait
    ? `${HARNESS}\n(async function(){\n${cleanCode}\n${cleanTestCode}\nawait __awaitPending();\nreturn __results;\n})()`
    : `${HARNESS}\n${cleanCode}\n(async function(){\n${cleanTestCode}\nawait __awaitPending();\nreturn __results;\n})()`;

  const context = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
    },
    Math: sealedMath(),
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Error,
    Promise,
    Symbol,
    Map,
    Set,
    WeakMap,
    WeakSet,
    RegExp,
    Date,
    setTimeout,
    clearTimeout,
    AbortController,
    AbortSignal,
    setInterval,
    clearInterval,
    queueMicrotask,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    ArrayBuffer,
    DataView,
    // Stub performance object that tracks mark + measure durations so that
    // exercises using the User Timing API get real-looking entries back.
    // Using Node's global performance breaks because exercises reset marks
    // across runs; this scoped stub is deterministic.
    performance: (() => {
      const marks = new Map();
      const measures = new Map();
      return {
        now: () => Date.now() + Math.random(),
        mark: (name) => {
          marks.set(name, Date.now() + Math.random());
        },
        measure: (name, start, end) => {
          const s = marks.get(start) ?? 0;
          const e = marks.get(end) ?? s + 1;
          measures.set(name, Math.max(0.1, e - s));
        },
        clearMarks: () => marks.clear(),
        clearMeasures: () => measures.clear(),
        getEntriesByName: (name) => {
          const duration = measures.get(name);
          if (duration !== undefined)
            return [{ name, duration, entryType: "measure" }];
          return [];
        },
        getEntriesByType: () => [],
      };
    })(),
    navigator: {
      gpu: undefined,
      userAgent: "validator",
      hardwareConcurrency: 4,
    },
    process: { env: {}, hrtime: () => [0, 0] },
    // Real `@tensorflow/tfjs` (v4.22) - replaces the inline mock so axis-aware
    // ops, multi-dim shapes, and the full kernel surface (`maxPool`, `eye`,
    // `expandDims`, transpose flags, etc.) work exactly as they do at runtime.
    // Wrapped via Proxy so `loadLayersModel` / `loadGraphModel` return a
    // synthetic model instead of trying to fetch over HTTP.
    tf: spiedTf(tfWithOverrides),
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    atob:
      typeof atob !== "undefined"
        ? atob
        : (s) => Buffer.from(s, "base64").toString("binary"),
    btoa:
      typeof btoa !== "undefined"
        ? btoa
        : (s) => Buffer.from(s, "binary").toString("base64"),
    fetch: () =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }),
    // ONNX runtime-web shim. The session output is a function of the feed
    // (see stubOnnxScore), not a constant, so an exercise can grade the
    // number a solution returns instead of only spying on the call.
    ort: {
      InferenceSession: {
        create: () =>
          Promise.resolve({
            // The real session exposes its feed and result keys; lesson 5
            // reads them off the session, so the stub carries them too.
            inputNames: ["input"],
            outputNames: ["output"],
            run: (feeds) =>
              Promise.resolve({
                output: {
                  data: new Float32Array([stubOnnxScore(feeds)]),
                  dims: [1, 1],
                },
              }),
            // Lifecycle no-ops the real library exposes. Lesson 5 tells the
            // reader to release the session, and a solution that did so
            // failed every test with a bare TypeError until these existed
            // (round 7, 2026-09-13).
            release: () => Promise.resolve(),
          }),
      },
      Tensor: function (type, data, dims) {
        this.type = type;
        this.data = data;
        this.dims = dims;
        this.dispose = () => {};
      },
    },
  };
  // The sealed Math is non-writable as a binding too: `globalThis.Math =
  // copyWithRandomPinned` replaced it for the whole run before this (round
  // 7b, 2026-09-14).
  if (context.Math)
    Object.defineProperty(context, "Math", {
      value: context.Math,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  vm.createContext(context);

  // The last statement of `fullCode` is an async IIFE whose return value
  // (the list of test results) is the completion value of the script itself,
  // which is what runInContext returns.
  const runPromise = (async () => {
    const script = new vm.Script(fullCode);
    return await script.runInContext(context, { timeout: TIMEOUT_MS });
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS,
    ),
  );

  try {
    const results = await Promise.race([runPromise, timeoutPromise]);
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

// Allowlist: exercises we know fail today because either the TS-strip
// heuristic can't handle their starter signature or the sandboxed TF mock
// lacks the API the solution reaches for (embeddings, loadLayersModel, etc.).
// Treated as warnings so CI does not block on pre-existing content bugs.
// Remove entries as exercises are fixed.
// File path relative to the repo root. Absent file = empty allowlist.
const allowlistPath = resolve(
  repoRoot,
  "scripts/validate-exercises.allowlist.json",
);

function loadAllowlist() {
  try {
    if (!existsSync(allowlistPath)) return new Set();
    const raw = JSON.parse(readFileSync(allowlistPath, "utf8"));
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw);
  } catch {
    return new Set();
  }
}

/* ------------------------------------------------------------------ */
/* Harness-stub parity with the browser worker                         */
/* ------------------------------------------------------------------ */

// The browser worker (packages/ui/src/mdx/exercise-runner.ts) stubs the same
// model loaders and the same ONNX session for the same reason, and it MUST
// derive the same answers from the same inputs. When the two disagreed, a
// learner's solution could pass in the browser and fail in CI, or the
// reverse. Pull each marked derivation out of the worker source and compare
// it to this file's copy, ignoring comments and whitespace so only the
// arithmetic has to match.
// Every function below is duplicated, on purpose, in the browser worker
// (packages/ui/src/mdx/exercise-runner.ts): the model-loader and ONNX stubs
// have to derive the same answers from the same inputs, and since 2026-09-08
// the assertion machinery has to produce the same FAILURE TEXT, because that
// text is the only explanation of a failure a learner reads. When the two
// disagree, a submission can pass in one harness and fail in the other, or
// the same mistake gets two different explanations.
const SHARED_STUB_FNS = [
  // Grading stubs.
  "stubArchFromUrl",
  "stubOnnxScore",
  // Assertion machinery (shared-assertions block).
  "__tcDefaultPrecision",
  "__tcTolerance",
  "__tcMessage",
  "__tcShow",
  "__tcType",
  "__tcNamed",
  "__tcHasNumber",
  "__tcListOf",
  "__tcNumberMiss",
  "__tcStructureMiss",
  "__tcJest",
  "__tcInstallStatics",
  "__tcMatchers",
  // Pre-parse of the learner's own code (shared-user-syntax-check block).
  "userCodeSyntaxError",
  "userSyntaxErrorResult",
];

// Brace matching that skips strings, template literals, regex-free comments
// and escapes. The naive version counted a brace inside a string literal and
// truncated __tcMatchers mid-function, which would have made the parity check
// compare two fragments and pass.
function extractFn(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  if (open === -1) return null;
  let depth = 0;
  let quote = null;
  let comment = null;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (comment === "line") {
      if (c === "\n") comment = null;
      continue;
    }
    if (comment === "block") {
      if (c === "*" && next === "/") {
        comment = null;
        i++;
      }
      continue;
    }
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && next === "/") {
      comment = "line";
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      comment = "block";
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function normalizeCode(block) {
  return block
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pull a harness template literal (HARNESS) out of the worker source and let
// the engine process its escapes, exactly as it does when the module loads.
// Refuses a literal carrying a placeholder, which would need the worker's own
// scope to evaluate.
function extractTemplate(src, name) {
  const marker = "const " + name + " = `";
  const start = src.indexOf(marker);
  if (start === -1) return null;
  const from = start + marker.length;
  const end = src.indexOf("\n`;", from);
  if (end === -1) return null;
  const raw = src.slice(from, end);
  if (raw.includes("${")) return null;
  return new Function("return `" + raw + "`;")();
}

const runnerPath = resolve(repoRoot, "packages/ui/src/mdx/exercise-runner.ts");

function assertHarnessParity() {
  if (!existsSync(runnerPath)) {
    console.error(
      `  [advisory] ${runnerPath} not found; skipped the harness-stub parity check.`,
    );
    return;
  }
  const mineSrc = readFileSync(__filename, "utf8");
  const theirsSrc = readFileSync(runnerPath, "utf8");

  // Whole-harness parity: describe, it, the hooks, the drain and every
  // matcher live in one template that both files carry verbatim, so compare
  // the entire thing rather than a hand-maintained list of functions. Before
  // 2026-09-08 the two templates had drifted in four places nobody was
  // watching (expect.closeTo missing in the browser, toMatch treating a
  // string as a regex in CI only, rejects.toThrow ignoring its message in CI
  // only, and a nested describe naming later siblings differently).
  const theirHarnessText = extractTemplate(theirsSrc, "HARNESS");
  if (!theirHarnessText) {
    console.error(
      "\n  [validate-exercises] harness-parity: could not read the HARNESS\n" +
        "  template out of packages/ui/src/mdx/exercise-runner.ts.\n",
    );
    process.exit(1);
  }
  if (normalizeCode(theirHarnessText) !== normalizeCode(HARNESS)) {
    console.error(
      "\n  [validate-exercises] harness-parity: the test harness in this\n" +
        "  validator differs from the one in packages/ui/src/mdx/exercise-runner.ts.\n" +
        "  A learner runs one and CI grades with the other, so any difference\n" +
        "  means a submission can pass in one and fail in the other, or the same\n" +
        "  mistake gets two different explanations. Copy the HARNESS template\n" +
        "  from one file to the other verbatim.\n",
    );
    process.exit(1);
  }

  // The spy lists and the seal are the newest code in both files and nothing
  // pinned them (round 7b, 2026-09-14): the corpus parity test only exercises
  // a counter where a grader happens to assert on it. Parse each list out of
  // both sources and compare them as sets, and compare the seeded generator
  // line for line.
  const stripComments = (t) => t.replace(/\/\/[^\n]*/g, "");
  const namesIn = (t) =>
    [
      ...stripComments(t).matchAll(
        /['"]([A-Za-z_][\w.]*)['"]|\b([A-Za-z_]\w*)\s*:\s*1\b/g,
      ),
    ]
      .map((m) => m[1] ?? m[2])
      .sort();
  const between = (src, startRe, endStr) => {
    const m = src.match(startRe);
    if (!m) return null;
    const from = m.index + m[0].length;
    const to = src.indexOf(endStr, from);
    return to === -1 ? null : src.slice(from, to);
  };
  const spyLists = [
    [
      "SPIED_ENTRY_POINTS",
      between(mineSrc, /const SPIED_ENTRY_POINTS = new Set\(\[/, "]);"),
      between(theirsSrc, /var SPIED = \{/, "};"),
    ],
    [
      "TENSOR_METHODS",
      between(mineSrc, /const TENSOR_METHODS = \[/, "];"),
      between(theirsSrc, /var TENSOR_METHODS = \[/, "];"),
    ],
    [
      "SPIED_NAMESPACES",
      between(mineSrc, /const SPIED_NAMESPACES = new Set\(\[/, "]);"),
      between(theirsSrc, /var NESTED = \{/, "};"),
    ],
  ];
  for (const [label, mine, theirs] of spyLists) {
    if (mine == null || theirs == null) {
      console.error(
        `\n  [validate-exercises] harness-parity: could not read ${label} out of both harness files.\n`,
      );
      process.exit(1);
    }
    const a = namesIn(mine);
    const b = namesIn(theirs);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      console.error(
        `\n  [validate-exercises] harness-parity: ${label} differs between this validator and the runner.\n` +
          `  validator: ${a.join(", ")}\n  runner:    ${b.join(", ")}\n` +
          "  A counter that exists in one harness and not the other grades the same submission two ways.\n",
      );
      process.exit(1);
    }
  }
  const sealOf = (src) => {
    const m = src.match(
      /seed = \(seed \+ 0x6d2b79f5\) >>> 0;[\s\S]*?4294967296;/,
    );
    return m ? normalizeCode(m[0].replace(/\b(let|var)\b/g, "")) : null;
  };
  if (!sealOf(mineSrc) || sealOf(mineSrc) !== sealOf(theirsSrc)) {
    console.error(
      "\n  [validate-exercises] harness-parity: the seeded Math.random stream differs between the two harnesses.\n",
    );
    process.exit(1);
  }

  for (const name of SHARED_STUB_FNS) {
    const mine = extractFn(mineSrc, name);
    const theirs = extractFn(theirsSrc, name);
    if (!mine || !theirs) {
      console.error(
        `\n  [validate-exercises] harness-parity: could not find ${name} in ` +
          (!mine
            ? "this validator"
            : "packages/ui/src/mdx/exercise-runner.ts") +
          ". The two harnesses' shared code can no longer be compared, so restore\n" +
          "  the marked block in both files.\n",
      );
      process.exit(1);
    }
    if (normalizeCode(mine) !== normalizeCode(theirs)) {
      console.error(
        `\n  [validate-exercises] harness-parity: ${name} differs between the CI\n` +
          "  harness and the browser worker, so the same submission can pass in one\n" +
          "  and fail in the other. Make the marked block identical in\n" +
          "  scripts/validate-exercises.mjs and\n" +
          "  packages/ui/src/mdx/exercise-runner.ts.\n\n" +
          `  validator: ${normalizeCode(mine)}\n\n` +
          `  worker:    ${normalizeCode(theirs)}\n`,
      );
      process.exit(1);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Behavioural parity of describe / it / expect                        */
/* ------------------------------------------------------------------ */

// Text parity above proves the shared blocks match. It says nothing about
// describe, it, or the wiring around expect, which each harness owns
// separately (hook stacks, the drain, the promise chain). This fixture runs
// one case of every matcher the exercise corpus uses, in the failing
// direction, through BOTH harnesses and compares the exact strings a learner
// and CI would each see. Arrival ORDER is not compared: the two harnesses
// drain their queues differently on purpose, so results are matched by name.
const PARITY_FIXTURE = `
  var scalar = 0.51;
  var list = [1, 2, 3, 4];
  var typed = new Float32Array([1, 2, 3]);
  var record = { shape: [1, 5], ok: false };
  var label = 'relu';
  var rejected = Promise.reject(new Error('boom'));
  describe('outer', function() {
    it('numeric toBe', function() { expect(scalar).toBe(0.7); });
    it('authored why', function() { expect(scalar, 'The bar has to sit under the noise floor.').toBe(0.7); });
    it('string toBe', function() { expect(label).toBe('sigmoid'); });
    it('array toEqual, one entry off', function() { expect(list).toEqual([1, 2, 9, 4]); });
    it('array toEqual, wrong length', function() { expect(list).toEqual([1, 2, 3]); });
    it('typed array container', function() { expect(typed).toEqual([1, 2, 3]); });
    it('object toEqual', function() { expect(record).toEqual({ shape: [1, 8], ok: false }); });
    it('closeTo default precision', function() { expect(scalar).toBeCloseTo(0.512); });
    it('closeTo explicit precision', function() { expect(scalar).toBeCloseTo(0.7, 3); });
    it('closeTo on a non-number', function() { expect(label).toBeCloseTo(0.5, 5); });
    it('greater than', function() { expect(scalar).toBeGreaterThan(0.9); });
    it('less than', function() { expect(scalar).toBeLessThan(0.1); });
    it('at least', function() { expect(scalar).toBeGreaterThanOrEqual(0.9); });
    it('at most', function() { expect(scalar).toBeLessThanOrEqual(0.1); });
    it('length', function() { expect(list).toHaveLength(3); });
    it('length of a null', function() { expect(null).toHaveLength(3); });
    it('contain a number', function() { expect(list).toContain(7); });
    it('contain a substring', function() { expect(label).toContain('sig'); });
    it('not contain a substring', function() { expect(label).not.toContain('rel'); });
    it('defined', function() { expect(undefined).toBeDefined(); });
    it('null', function() { expect(label).toBeNull(); });
    it('truthy', function() { expect(0).toBeTruthy(); });
    it('property value', function() { expect(record).toHaveProperty('shape', [1, 8]); });
    it('missing property', function() { expect(record).not.toHaveProperty('shape'); });
    it('match', function() { expect(label).toMatch(/^sig/); });
    it('throws nothing', function() { expect(function() { return 1; }).toThrow(); });
    it('throws the wrong message', function() { expect(function() { throw new Error('boom'); }).toThrow('nope'); });
    it('string where a number belongs', function() { expect('0.7').toBe(0.7); });
    it('statics are installed', function() { expect(typeof expect.closeTo).toBe('function'); });
    it('jest stub is installed', function() { expect(typeof jest.fn).toBe('function'); });
    it('async passes', async function() { var v = await Promise.resolve(2); expect(v).toBe(2); });
    it('rejects with the wrong message', async function() { await expect(rejected).rejects.toThrow('nope'); });
    describe('inner', function() {
      it('keeps the outer name', function() { expect(1).toBe(1); });
    });
    it('named after the inner describe returns', function() { expect(1).toBe(1); });
  });
  describe('a suite whose body throws', function() {
    throw new Error('registration blew up');
  });
`;

const PARITY_DRIVER = `
(async function() {
${PARITY_FIXTURE}
  await __awaitPending();
  return __results;
})()
`;

async function runFixture(harnessSrc) {
  const context = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
    },
    Math,
    JSON,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Error,
    Promise,
    RegExp,
    Float32Array,
  };
  // The sealed Math is non-writable as a binding too: `globalThis.Math =
  // copyWithRandomPinned` replaced it for the whole run before this (round
  // 7b, 2026-09-14).
  if (context.Math)
    Object.defineProperty(context, "Math", {
      value: context.Math,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  vm.createContext(context);
  const script = new vm.Script(harnessSrc + "\n" + PARITY_DRIVER);
  const results = await script.runInContext(context, { timeout: TIMEOUT_MS });
  const byName = {};
  for (const r of results || []) {
    byName[r.name] = { passed: !!r.passed, error: r.error ?? null };
  }
  return byName;
}

async function assertAssertionParity() {
  if (!existsSync(runnerPath)) return;
  const theirHarness = extractTemplate(
    readFileSync(runnerPath, "utf8"),
    "HARNESS",
  );
  if (!theirHarness) {
    console.error(
      "\n  [validate-exercises] assertion-parity: could not read the HARNESS\n" +
        "  template out of packages/ui/src/mdx/exercise-runner.ts, so the two\n" +
        "  harnesses cannot be compared behaviourally.\n",
    );
    process.exit(1);
  }

  let mine, theirs;
  try {
    mine = await runFixture(HARNESS);
    theirs = await runFixture(theirHarness);
  } catch (err) {
    console.error(
      `\n  [validate-exercises] assertion-parity: the fixture suite crashed: ${err.message}\n`,
    );
    process.exit(1);
  }

  const names = Array.from(
    new Set(Object.keys(mine).concat(Object.keys(theirs))),
  ).sort();
  const diffs = [];
  for (const name of names) {
    const a = mine[name];
    const b = theirs[name];
    if (!a || !b) {
      diffs.push(
        `  ${name}\n    validator: ${a ? JSON.stringify(a) : "(no such result)"}\n    worker:    ${b ? JSON.stringify(b) : "(no such result)"}`,
      );
      continue;
    }
    if (a.passed !== b.passed || String(a.error) !== String(b.error)) {
      diffs.push(
        `  ${name}\n    validator: ${JSON.stringify(a)}\n    worker:    ${JSON.stringify(b)}`,
      );
    }
  }
  if (diffs.length) {
    console.error(
      `\n  [validate-exercises] assertion-parity: ${diffs.length} of ${names.length} fixture\n` +
        "  cases behave differently in the CI harness and the browser worker. A\n" +
        "  learner and CI would read two different explanations of the same\n" +
        "  mistake. Reconcile scripts/validate-exercises.mjs with\n" +
        "  packages/ui/src/mdx/exercise-runner.ts.\n\n" +
        diffs.join("\n") +
        "\n",
    );
    process.exit(1);
  }
  console.log(
    `  harness parity: ${names.length} assertion fixtures produce identical text in both harnesses.`,
  );
}

// Count toBeCloseTo calls that leave `precision` out. The shared harness
// defaults to 5 (see __tcDefaultPrecision), which is a thousand times
// tighter than the vitest default of 2 an author would assume from the same
// call. Loosening the default would silently weaken every site that relies
// on it, so the default stays and the validator names the sites instead.
function implicitPrecisionSites(testCode) {
  const src = String(testCode || "");
  const needle = "toBeCloseTo(";
  let i = 0;
  let implicit = 0;
  while ((i = src.indexOf(needle, i)) !== -1) {
    let depth = 1;
    let args = 1;
    let j = i + needle.length;
    for (; j < src.length && depth > 0; j++) {
      const c = src[j];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 1) args++;
    }
    if (args === 1) implicit++;
    i = j;
  }
  return implicit;
}

async function main() {
  // Cheap and unconditional: if the two harnesses' stubs have drifted apart,
  // every exercise that loads a model or runs an ONNX session below is being
  // graded against answers the browser will not reproduce.
  assertHarnessParity();
  await assertAssertionParity();

  if (!existsSync(exercisesJsonPath)) {
    console.error(
      `\n  [validate-exercises] exercises.json not found at ${exercisesJsonPath}.\n` +
        `  Run 'pnpm turbo build:content' first so Velite compiles exercise YAML.\n`,
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const checkStarters = args.includes("--starters");
  const checkCheats = args.includes("--cheats");
  const positional = args.filter((a) => !a.startsWith("--"));
  const filterSlug = positional[0];

  const allowlist = loadAllowlist();

  const raw = JSON.parse(readFileSync(exercisesJsonPath, "utf8"));
  const exercises = Array.isArray(raw) ? raw : [];
  const subset = filterSlug
    ? exercises.filter((e) => e.slug === filterSlug)
    : exercises;

  if (subset.length === 0) {
    console.error(
      filterSlug
        ? `No exercise with slug '${filterSlug}' found.`
        : `No exercises found in ${exercisesJsonPath}.`,
    );
    process.exit(1);
  }

  console.log(
    `\nValidating ${subset.length} exercise(s)${strict ? " [strict]" : ""}...\n`,
  );

  let passed = 0;
  let failed = 0;
  let warned = 0;
  const failures = [];
  const warnings = [];
  // Advisories: true of the corpus today, not a reason to fail the build.
  const starterCredit = [];
  const implicitPrecision = [];

  const record = (ex, phase, error) => {
    // Failure text can now carry an authored explanation on its own line
    // (expect(value, why)), so indent continuation lines rather than letting
    // them break the column.
    const entry = {
      slug: ex.slug,
      phase,
      error: String(error).split("\n").join("\n          "),
    };
    if (allowlist.has(ex.slug) && !strict) {
      warned++;
      warnings.push(entry);
      console.log(
        `  WARN  ${ex.slug} (${ex.lessonSlug}) - ${phase}: ${entry.error}`,
      );
    } else {
      failed++;
      failures.push(entry);
      console.log(
        `  FAIL  ${ex.slug} (${ex.lessonSlug}) - ${phase}: ${entry.error}`,
      );
    }
  };

  for (const ex of subset) {
    const label = `${ex.slug} (${ex.lessonSlug})`;
    // 1. Starter compile check
    const starter = syntaxCheck(ex.starterCode ?? "");
    if (!starter.ok) {
      record(ex, "starter-syntax", starter.error);
      continue;
    }

    // 2. Solution runs and all tests pass
    const run = await runSolutionTests(ex.solutionCode, ex.testCode);
    if (!run.ok) {
      record(ex, "solution-run", run.error);
      continue;
    }

    const allPassed =
      Array.isArray(run.results) &&
      run.results.length > 0 &&
      run.results.every((r) => r.passed);

    if (!allPassed) {
      const firstFail = (run.results || []).find((r) => !r.passed);
      const detail = firstFail
        ? `${firstFail.name}: ${firstFail.error}`
        : "no tests produced";
      record(ex, "solution-tests", detail);
      continue;
    }

    // 3. Grader strength: a test suite whose every assertion is
    //    existence-only (toBeDefined/toBeTruthy) passes for ANY code that
    //    declares the right variable names - it grades nothing. Fail loudly
    //    so weak suites can't ship.
    const strongAssertion =
      /toBeCloseTo|toEqual|toBe\(|toHaveLength|toMatch|toBeGreaterThan|toBeLessThan|toContain|toBeInstanceOf|arrayContaining/i;
    if (!strongAssertion.test(ex.testCode ?? "")) {
      record(
        ex,
        "weak-grader",
        "testCode contains no value-level assertions (existence checks only)",
      );
      continue;
    }

    // 4. Starter must NOT pass: if submitting the untouched starter clears
    //    every test, the exercise grades nothing (the Challenge step would
    //    complete itself). A starter that crashes or fails any test is fine.
    if (checkStarters) {
      const starterRun = await runSolutionTests(
        ex.starterCode ?? "",
        ex.testCode,
      );
      const starterResults =
        starterRun.ok && Array.isArray(starterRun.results)
          ? starterRun.results
          : [];
      const starterPassedAll =
        starterResults.length > 0 && starterResults.every((r) => r.passed);
      if (starterPassedAll) {
        record(
          ex,
          "starter-passes",
          "unmodified starterCode passes every test; the exercise grades nothing",
        );
        continue;
      }

      // Not a failure, but worth naming: a starter that already clears a
      // test makes the first Run of code that does nothing print a score
      // and a part-filled bar. The test that passes is usually asserting
      // something true of the stub (a name exists, a list is empty), so it
      // grades nothing and should assert the mechanism instead.
      const cleared = starterResults.filter((r) => r.passed);
      if (cleared.length) {
        starterCredit.push({
          slug: ex.slug,
          cleared: cleared.length,
          total: starterResults.length,
          first: cleared[0].name,
        });
        console.log(
          `  STARTER-CREDIT ${ex.slug}: the untouched starter already clears ` +
            `${cleared.length} of ${starterResults.length} test(s) (${cleared[0].name})`,
        );
      }
    }

    // 5. Cheat gate: an exercise may register a deliberately ignorant
    //    solution at scripts/exercise-cheats/<slug>.js. That solution MUST
    //    fail at least one test. A grader a cheat can clear is grading the
    //    API surface rather than the lesson's point, which is how six of
    //    them shipped (audit round 4, 2026-09-07). Only runs with --cheats
    //    so the default path stays fast.
    if (checkCheats) {
      const cheatDir = resolve(repoRoot, "scripts/exercise-cheats");
      // <slug>.js plus <slug>.<n>.js: one file per shortcut the grader was
      // hardened against, so that dropping one check re-opens exactly one
      // cheat instead of leaving the others to mask it (round 7, 2026-09-13:
      // build-layer's lazy-cache probe beat a grader whose single cheat
      // file only exercised the tensor-id check).
      const cheatFiles = existsSync(cheatDir)
        ? readdirSync(cheatDir)
            .filter(
              (f) =>
                /^\.(\d+\.)?js$/.test(f.slice(ex.slug.length)) &&
                f.startsWith(ex.slug + "."),
            )
            .sort()
        : [];
      let cheatGateFailed = false;
      for (const cheatFile of cheatFiles) {
        const cheatSrc = readFileSync(resolve(cheatDir, cheatFile), "utf8");
        const cheatRun = await runSolutionTests(cheatSrc, ex.testCode);
        const cheatPassedAll =
          cheatRun.ok &&
          Array.isArray(cheatRun.results) &&
          cheatRun.results.length > 0 &&
          cheatRun.results.every((r) => r.passed);
        if (cheatPassedAll) {
          record(
            ex,
            "cheat-passes",
            `scripts/exercise-cheats/${cheatFile} passes every test; the grader does not grade the lesson's point`,
          );
          // Every cheat file gets its verdict: a `break` here let a stale
          // <slug>.2.js (sorted first) hide the base cheat's line (round 7b).
          cheatGateFailed = true;
          continue;
        }
        const results = Array.isArray(cheatRun.results) ? cheatRun.results : [];
        const caught = results.filter((r) => !r.passed).map((r) => r.name);
        const cleared = results.filter((r) => r.passed);
        // A cheat that fails EVERY test has almost certainly gone stale: the
        // exercise was rewritten and renamed its functions, so the cheat
        // throws a reference error before any assertion runs and the gate
        // reports a pass while certifying nothing. Demand that it clear at
        // least one test, which proves it is still a plausible submission
        // against THIS exercise, and fail at least one, which proves the
        // grader discriminates. Found 2026-09-08: build-lstm's cheat still
        // defined buildLSTM after the exercise moved to lstmStep.
        if (!cleared.length) {
          record(
            ex,
            "cheat-stale",
            `scripts/exercise-cheats/${cheatFile} fails all ${results.length} test(s), so it never ran as a submission (the exercise's function names have probably changed). Rewrite the cheat against the current exercise.`,
          );
          cheatGateFailed = true;
          continue;
        }
        console.log(
          `  CHEAT-OK ${ex.slug}${cheatFile === `${ex.slug}.js` ? "" : ` (${cheatFile})`}: ignorant solution cleared ${cleared.length}, rejected by ${caught.length}` +
            (caught.length ? ` (${caught[0]})` : ""),
        );
      }
      if (cheatGateFailed) continue;
    }

    const loose = implicitPrecisionSites(ex.testCode);
    if (loose) implicitPrecision.push({ slug: ex.slug, count: loose });

    passed++;
    console.log(`  OK    ${label} (${run.results.length} tests)`);
  }

  console.log(
    `\nDone: ${passed} passed, ${failed} failed, ${warned} warned (allowlisted), ${subset.length} total.\n`,
  );

  if (starterCredit.length) {
    console.log(
      `[advisory] ${starterCredit.length} exercise(s) hand out credit for an untouched starter:\n` +
        starterCredit
          .map(
            (s2) =>
              `  ${s2.slug}: ${s2.cleared}/${s2.total} already green (${s2.first})`,
          )
          .join("\n") +
        "\nPressing Run on code that does nothing should not score. Make each of\n" +
        "those tests assert the mechanism the lesson teaches.\n",
    );
  }

  if (implicitPrecision.length) {
    console.log(
      `[advisory] ${implicitPrecision.reduce((n, e) => n + e.count, 0)} toBeCloseTo call(s) leave precision out,\n` +
        `in ${implicitPrecision.length} exercise(s):\n` +
        implicitPrecision.map((e) => `  ${e.slug}: ${e.count}`).join("\n") +
        `\nThose inherit the harness default of 5, not the vitest default of 2 the\n` +
        "same call implies. Pass the precision the assertion actually means.\n",
    );
  }

  if (failed > 0) {
    console.error("Exercise validation failed. First failures:\n");
    for (const f of failures.slice(0, 10)) {
      console.error(`  - ${f.slug} [${f.phase}]: ${f.error}`);
    }
    process.exit(1);
  }

  if (warned > 0) {
    console.error(
      `\n[advisory] ${warned} exercise(s) are on the allowlist (see scripts/validate-exercises.allowlist.json).\n` +
        `Run with --strict to treat them as failures.\n`,
    );
  }
}

main().catch((err) => {
  console.error("Unexpected validator error:", err);
  process.exit(1);
});
