#!/usr/bin/env node
/**
 * Exercise validator — CI-only harness.
 *
 * Reads the velite-compiled exercises.json and verifies for each exercise:
 *   1. Starter code parses as JavaScript (after TS/import stripping).
 *   2. Solution code, run against testCode, passes every assertion within 10s.
 *
 * Mirrors the test harness in packages/ui/src/mdx/exercise.tsx (parseAndRunTests)
 * but is dependency-free so it runs on a fresh CI worker without building UI.
 *
 * Exit codes:
 *   0 — every exercise validated.
 *   1 — at least one exercise failed.
 *
 * Usage:
 *   node scripts/validate-exercises.mjs               # validates all
 *   node scripts/validate-exercises.mjs <slug>        # single exercise by slug
 *
 * CI invokes via the root `test:exercises` script.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

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

/**
 * Strip TypeScript syntax well enough for Node's VM parser.
 *
 * Handled:
 *   - `import ... from "..."`           → removed
 *   - `: TypeAnnotation` on params/vars → removed (balances [], <>, ())
 *   - `as Type` assertions              → removed
 *   - `<T, U>` generics on calls/decls  → removed
 *   - `interface`, `type` declarations  → removed
 *
 * This is a coarse heuristic, not a real TS parser — good enough for the
 * handful of patterns exercise authors use in their starter/solution snippets.
 */
function stripTypeScript(code) {
  let s = code;

  // Drop ES imports (no module resolution in the VM).
  s = s.replace(/^\s*import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, "");
  s = s.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, "");

  // Drop top-level `type Foo = ...;` / `interface Foo { ... }` declarations.
  s = s.replace(/^\s*(export\s+)?type\s+\w+(\s*<[^>]*>)?\s*=\s*[\s\S]*?;\s*$/gm, "");
  s = s.replace(
    /^\s*(export\s+)?interface\s+\w+(\s*<[^>]*>)?\s*\{[\s\S]*?\n\}\s*$/gm,
    "",
  );

  // Drop generic type params like `<T>`, `<T extends Foo>` on declarations.
  // Only inside contexts that look like function/call generics — skip JSX.
  s = s.replace(/\b(function\s+\w+)<[^>]+>/g, "$1");
  s = s.replace(/\b(\w+)<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*>(?=\s*\()/g, "$1");

  // Remove `as SomeType` assertions (non-greedy up to boundary).
  s = s.replace(
    /\s+as\s+[A-Za-z_$][\w$]*(?:\s*<[^>]*>)?(?:\s*\[\s*\])*/g,
    "",
  );

  // Remove `: TypeAnnotation` from variables and function params/returns.
  // Walk the string and, at each `:` that looks like a type annotation,
  // consume until the matching `,`, `)`, `=`, `;`, `{`, or newline — while
  // balancing `[]`, `<>`, `()`, `{}` so nested generics don't escape.
  s = stripTypeAnnotations(s);

  return s;
}

function stripTypeAnnotations(src) {
  let out = "";
  let i = 0;
  const n = src.length;

  // Minimal tokenizer state to avoid stripping inside strings/regex/comments.
  while (i < n) {
    const c = src[i];
    // Line comment
    if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      out += src.slice(i, end === -1 ? n : end);
      i = end === -1 ? n : end;
      continue;
    }
    // Block comment
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      out += src.slice(i, end === -1 ? n : end + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    // String literals
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          out += src[i] + src[i + 1];
          i += 2;
          continue;
        }
        if (quote === "`" && src[i] === "$" && src[i + 1] === "{") {
          out += src[i] + src[i + 1];
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") depth--;
            out += src[i];
            i++;
            if (depth === 0) break;
          }
          continue;
        }
        out += src[i];
        if (src[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Candidate type annotation: `:` followed by a type.
    // Only treat as annotation when preceded by an identifier / `)` / `]`
    // (i.e. not a ternary, not an object-literal key colon, not a label).
    if (c === ":") {
      const prev = lastNonSpace(out);
      const isAnnotationContext =
        prev === ")" ||
        prev === "]" ||
        /[A-Za-z0-9_$?]/.test(prev ?? "");
      // Reject object-literal key colons: those are inside `{ key: value }`
      // and previous non-space-non-whitespace before the key identifier is
      // usually `{` or `,`. We use a cheap guard: if the very next token
      // after `:` looks like a TS type (uppercase ident, primitive keyword,
      // or punctuation like `(` / `{` for complex types), strip; else keep.
      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      const next = src.slice(j, j + 40);
      const looksLikeType =
        /^(number|string|boolean|any|unknown|void|never|object|bigint|symbol|null|undefined|Array|Promise|Map|Set|Record|Readonly|Partial|Required|Pick|Omit|[A-Z][\w$]*)/.test(
          next,
        ) ||
        /^[a-z][\w$]*\./.test(next) || // namespaced: tf.Sequential, React.FC
        /^\(/.test(next) || // (a: number) => b  arrow type
        /^\{/.test(next); // { x: number }  object type

      if (isAnnotationContext && looksLikeType) {
        // Consume the type, balancing brackets.
        i = j;
        let depthAngle = 0;
        let depthBracket = 0;
        let depthParen = 0;
        let depthBrace = 0;
        while (i < n) {
          const ch = src[i];
          if (depthAngle === 0 && depthBracket === 0 && depthParen === 0 && depthBrace === 0) {
            if (ch === "," || ch === ")" || ch === "=" || ch === ";" || ch === "\n" || ch === "{") break;
          }
          if (ch === "<") depthAngle++;
          else if (ch === ">") depthAngle = Math.max(0, depthAngle - 1);
          else if (ch === "[") depthBracket++;
          else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
          else if (ch === "(") depthParen++;
          else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
          else if (ch === "{") depthBrace++;
          else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);
          i++;
        }
        continue; // skip emitting the annotation
      }
    }

    out += c;
    i++;
  }
  return out;
}

function lastNonSpace(s) {
  for (let i = s.length - 1; i >= 0; i--) {
    if (!/\s/.test(s[i])) return s[i];
  }
  return null;
}

function syntaxCheck(code) {
  const stripped = stripTypeScript(code);
  try {
    new vm.Script(`(async function(){\n${stripped}\n})`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Harness — mirrors packages/ui/src/mdx/exercise.tsx parseAndRunTests, with
// one correctness fix: we collect every `it()` promise into `__pending` so
// that `describe()` can await the whole batch before returning. The in-browser
// harness lets these promises float; in CI we need deterministic results so
// the outer IIFE can `await Promise.all(__pending)` before returning results.
const HARNESS = `
  var __results = [];
  var __pending = [];
  var __currentDescribe = '';

  async function describe(name, fn) {
    __currentDescribe = name;
    try { await fn(); } catch(e) {}
    __currentDescribe = '';
  }

  function it(name, fn) {
    var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
    var p = (async function() {
      try {
        await fn();
        __results.push({ name: fullName, passed: true });
      } catch(e) {
        __results.push({ name: fullName, passed: false, error: e.message || String(e) });
      }
    })();
    __pending.push(p);
    return p;
  }
  var test = it;

  function expect(actual) {
    return {
      toBe: function(expected) {
        if (actual !== expected) throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      },
      toEqual: function(expected) {
        var a = JSON.stringify(actual), b = JSON.stringify(expected);
        if (a !== b) throw new Error('Expected ' + b + ' but got ' + a);
      },
      toBeDefined: function() {
        if (actual === undefined || actual === null) throw new Error('Expected value to be defined, got ' + String(actual));
      },
      toBeNull: function() {
        if (actual !== null) throw new Error('Expected null but got ' + JSON.stringify(actual));
      },
      toBeTruthy: function() {
        if (!actual) throw new Error('Expected truthy value but got ' + JSON.stringify(actual));
      },
      toBeFalsy: function() {
        if (actual) throw new Error('Expected falsy value but got ' + JSON.stringify(actual));
      },
      toBeGreaterThan: function(expected) {
        if (!(actual > expected)) throw new Error('Expected ' + actual + ' > ' + expected);
      },
      toBeLessThan: function(expected) {
        if (!(actual < expected)) throw new Error('Expected ' + actual + ' < ' + expected);
      },
      toBeGreaterThanOrEqual: function(expected) {
        if (!(actual >= expected)) throw new Error('Expected ' + actual + ' >= ' + expected);
      },
      toBeLessThanOrEqual: function(expected) {
        if (!(actual <= expected)) throw new Error('Expected ' + actual + ' <= ' + expected);
      },
      toContain: function(expected) {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) throw new Error('Array does not contain ' + JSON.stringify(expected));
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected)) throw new Error('String does not contain ' + JSON.stringify(expected));
        }
      },
      toHaveLength: function(expected) {
        if (actual.length !== expected) throw new Error('Expected length ' + expected + ' but got ' + actual.length);
      },
      toThrow: function() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        var threw = false;
        try { actual(); } catch(e) { threw = true; }
        if (!threw) throw new Error('Expected function to throw');
      },
      toBeCloseTo: function(expected, precision) {
        precision = precision === undefined ? 5 : precision;
        var diff = Math.abs(actual - expected);
        var limit = Math.pow(10, -precision) / 2;
        if (diff >= limit) throw new Error('Expected ' + actual + ' to be close to ' + expected + ' (precision: ' + precision + ')');
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) throw new Error('Expected value to not be ' + JSON.stringify(expected));
        },
        toEqual: function(expected) {
          if (JSON.stringify(actual) === JSON.stringify(expected)) throw new Error('Expected values to not be equal');
        },
        toBeDefined: function() {
          if (actual !== undefined && actual !== null) throw new Error('Expected value to be undefined');
        },
        toBeNull: function() {
          if (actual === null) throw new Error('Expected value to not be null');
        },
        toBeTruthy: function() {
          if (actual) throw new Error('Expected falsy value');
        },
      }
    };
  }

  expect.closeTo = function(expected, precision) {
    precision = precision || 2;
    return {
      asymmetricMatch: function(actual) {
        return Math.abs(actual - expected) < Math.pow(10, -precision) / 2;
      }
    };
  };
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
    function makeTensor(flat, s) {
      return {
        dataSync: function() { return Float32Array.from(flat); },
        data: function() { return Promise.resolve(Float32Array.from(flat)); },
        arraySync: function() { return toNested(Array.from(flat), s); },
        array: function() { return Promise.resolve(toNested(Array.from(flat), s)); },
        shape: s,
        dtype: 'float32',
        rank: s.length,
        size: s.reduce(function(a,b){ return a*b; }, 1),
        reshape: function(newShape) { return makeTensor(Array.from(flat), newShape); },
        flatten: function() { return makeTensor(Array.from(flat), [flat.length]); },
        squeeze: function() {
          var newShape = s.filter(function(d) { return d !== 1; });
          if (newShape.length === 0) newShape = [1];
          return makeTensor(Array.from(flat), newShape);
        },
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
        softmax: function() { return _tf.softmax(this); },
        std: function() {
          var m = flat.reduce(function(a,b){return a+b;},0)/flat.length;
          var v = flat.reduce(function(a,b){return a+(b-m)*(b-m);},0)/flat.length;
          return _tf.tensor([Math.sqrt(v)]);
        },
        print: function() {},
        dispose: function() {},
      };
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
        var allData = [];
        for (var i = 0; i < tensors.length; i++) allData = allData.concat(Array.from(tensors[i].dataSync()));
        if (axis === 0) {
          var restShape = tensors[0].shape.slice(1);
          var totalFirst = 0;
          for (var t = 0; t < tensors.length; t++) totalFirst += tensors[t].shape[0];
          return _tf.tensor(allData, [totalFirst].concat(restShape));
        }
        return _tf.tensor(allData, [allData.length]);
      },
      add: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v+bd[i];}), a.shape); },
      sub: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v-bd[i];}), a.shape); },
      mul: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v*bd[i];}), a.shape); },
      div: function(a,b) {
        var ad=Array.from(a.dataSync());
        var bIsTensor = b && typeof b.dataSync === 'function';
        var bd = bIsTensor ? Array.from(b.dataSync()) : null;
        return _tf.tensor(ad.map(function(v,i){ return v / (bIsTensor ? bd[i % bd.length] : b); }), a.shape);
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
      sum: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0); return _tf.tensor([s]); },
      mean: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0)/d.length; return _tf.tensor([s]); },
      max: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.max.apply(null,d)]); },
      min: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.min.apply(null,d)]); },
      argMax: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]>d[idx])idx=i;} return _tf.tensor([idx]); },
      argMin: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]<d[idx])idx=i;} return _tf.tensor([idx]); },
      matMul: function(a, b) {
        if (a.shape[a.shape.length-1] !== b.shape[0]) throw new Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
        var M = a.shape[0], K = a.shape[1] || 1, N = b.shape[1] || 1;
        var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
        var result = [];
        for (var i = 0; i < M; i++) {
          for (var j = 0; j < N; j++) {
            var s = 0;
            for (var k = 0; k < K; k++) s += ad[i * K + k] * bd[k * N + j];
            result.push(s);
          }
        }
        return _tf.tensor(result, [M, N]);
      },
      sequential: function() {
        var layers = [];
        return {
          add: function(layer) { layers.push(layer); },
          compile: function() {},
          fit: function(x,y,opts) { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } }); },
          predict: function(x) {
            var batchSize = x.shape[0];
            var lastUnits = layers.length > 0 && layers[layers.length-1].units ? layers[layers.length-1].units : 1;
            return _tf.zeros([batchSize, lastUnits]);
          },
          summary: function() {},
          layers: layers,
        };
      },
      layers: {
        dense: function(config) { return { units: config.units, activation: config.activation || 'linear', type: 'dense' }; },
        dropout: function(config) { return { rate: config.rate, type: 'dropout' }; },
        flatten: function() { return { type: 'flatten' }; },
      },
    };
    return _tf;
  })();
`;

async function runSolutionTests(userCode, testCode) {
  const cleanCode = stripTypeScript(userCode);
  const cleanTestCode = stripTypeScript(testCode);

  // Build a single script whose completion value is the tests' result
  // promise. TF mock + harness + user code are hoisted `var` declarations
  // so they're visible inside the IIFE that runs the test assertions.
  const fullCode = `${TF_MOCK}\n${HARNESS}\n${cleanCode}\n(async function(){\n${cleanTestCode}\nawait Promise.all(__pending);\nreturn __results;\n})()`;

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
    setTimeout,
    Float32Array,
    Int32Array,
    Uint8Array,
  };
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

async function main() {
  if (!existsSync(exercisesJsonPath)) {
    console.error(
      `\n  [validate-exercises] exercises.json not found at ${exercisesJsonPath}.\n` +
        `  Run 'pnpm turbo build:content' first so Velite compiles exercise YAML.\n`,
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
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

  const record = (ex, phase, error) => {
    const entry = { slug: ex.slug, phase, error };
    if (allowlist.has(ex.slug) && !strict) {
      warned++;
      warnings.push(entry);
      console.log(`  WARN  ${ex.slug} (${ex.lessonSlug}) — ${phase}: ${error}`);
    } else {
      failed++;
      failures.push(entry);
      console.log(`  FAIL  ${ex.slug} (${ex.lessonSlug}) — ${phase}: ${error}`);
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

    passed++;
    console.log(`  OK    ${label} (${run.results.length} tests)`);
  }

  console.log(
    `\nDone: ${passed} passed, ${failed} failed, ${warned} warned (allowlisted), ${subset.length} total.\n`,
  );

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
