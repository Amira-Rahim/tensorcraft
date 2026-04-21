"use client";

import {
  lazy,
  Suspense,
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";

import { useSandpack } from "@codesandbox/sandpack-react";

const SandpackProvider = lazy(() =>
  import("@codesandbox/sandpack-react").then((m) => ({
    default: m.SandpackProvider,
  })),
);
const SandpackCodeEditor = lazy(() =>
  import("@codesandbox/sandpack-react").then((m) => ({
    default: m.SandpackCodeEditor,
  })),
);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExerciseData {
  slug: string;
  title: string;
  instructions: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface ExerciseSubmitResult {
  exerciseSlug: string;
  code: string;
  passed: boolean;
  score: number;
  solutionViewed: boolean;
}

export interface ExerciseBridge {
  feTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
}

interface ExerciseProps {
  slug: string;
  onSubmit?: (result: ExerciseSubmitResult) => void;
  /** Optional FE↔ML bridge hint shown below the editor. */
  bridge?: ExerciseBridge;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface ConsoleEntry {
  level: "log" | "warn" | "error";
  message: string;
}

export interface TestRunOutcome {
  results: TestResult[];
  logs: ConsoleEntry[];
}

/* ------------------------------------------------------------------ */
/*  Context — exercise data injected from LessonContent                */
/* ------------------------------------------------------------------ */

const ExerciseDataContext = createContext<Map<string, ExerciseData>>(new Map());

export function ExerciseDataProvider({
  exercises,
  children,
}: {
  exercises: Map<string, ExerciseData>;
  children: React.ReactNode;
}) {
  return (
    <ExerciseDataContext.Provider value={exercises}>
      {children}
    </ExerciseDataContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Difficulty badge                                                   */
/* ------------------------------------------------------------------ */

const difficultyConfig = {
  beginner: { label: "Beginner", color: "#4ADE80" },
  intermediate: { label: "Intermediate", color: "#FBBF24" },
  advanced: { label: "Advanced", color: "#F87171" },
};

/* ------------------------------------------------------------------ */
/*  Test runner — evaluates user code against test assertions           */
/* ------------------------------------------------------------------ */

export async function parseAndRunTests(
  userCode: string,
  testCode: string,
): Promise<TestRunOutcome> {
  const results: TestResult[] = [];
  const logs: ConsoleEntry[] = [];

  // Capture console output from the user code / test harness
  const stringifyArg = (a: unknown): string => {
    if (typeof a === "string") return a;
    try {
      return JSON.stringify(a);
    } catch {
      return String(a);
    }
  };
  const capturedConsole = {
    log: (...args: unknown[]) => {
      logs.push({ level: "log", message: args.map(stringifyArg).join(" ") });
    },
    warn: (...args: unknown[]) => {
      logs.push({ level: "warn", message: args.map(stringifyArg).join(" ") });
    },
    error: (...args: unknown[]) => {
      logs.push({ level: "error", message: args.map(stringifyArg).join(" ") });
    },
    info: (...args: unknown[]) => {
      logs.push({ level: "log", message: args.map(stringifyArg).join(" ") });
    },
    debug: (...args: unknown[]) => {
      logs.push({ level: "log", message: args.map(stringifyArg).join(" ") });
    },
  };

  // Build a minimal test harness that captures results
  // Tests use Jest-style describe/it/expect syntax
  const harness = `
    var __results = [];
    var __currentDescribe = '';

    async function describe(name, fn) {
      __currentDescribe = name;
      try { await fn(); } catch(e) { /* individual its handle errors */ }
      __currentDescribe = '';
    }

    async function it(name, fn) {
      var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
      try {
        await fn();
        __results.push({ name: fullName, passed: true });
      } catch(e) {
        __results.push({ name: fullName, passed: false, error: e.message || String(e) });
      }
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

  try {
    // Create a mock tf object for exercises that reference TensorFlow.js
    const tfMock = `
      var tf = (function() {
        // Helper: build nested array from flat data matching shape
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

          tensor1d: function(values) {
            return _tf.tensor(values, [values.length]);
          },

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
              for (var j = 0; j < depth; j++) {
                data.push(j === idx[i] ? 1 : 0);
              }
            }
            return _tf.tensor(data, [idx.length, depth]);
          },

          concat: function(tensors, axis) {
            axis = axis || 0;
            var allData = [];
            for (var i = 0; i < tensors.length; i++) {
              allData = allData.concat(Array.from(tensors[i].dataSync()));
            }
            if (axis === 0) {
              var restShape = tensors[0].shape.slice(1);
              var totalFirst = 0;
              for (var t = 0; t < tensors.length; t++) totalFirst += tensors[t].shape[0];
              return _tf.tensor(allData, [totalFirst].concat(restShape));
            }
            return _tf.tensor(allData, [allData.length]);
          },

          // Element-wise ops
          add: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v+bd[i];}), a.shape); },
          sub: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v-bd[i];}), a.shape); },
          mul: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v*bd[i];}), a.shape); },
          div: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return _tf.tensor(ad.map(function(v,i){return v/bd[i];}), a.shape); },

          // Activation functions
          relu: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.max(0,v);}), x.shape); },
          sigmoid: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return 1/(1+Math.exp(-v));}), x.shape); },
          softmax: function(x) { var d=Array.from(x.dataSync()); var max=Math.max.apply(null,d); var exp=d.map(function(v){return Math.exp(v-max);}); var sum=exp.reduce(function(a,b){return a+b;},0); return _tf.tensor(exp.map(function(v){return v/sum;}), x.shape); },
          tanh: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.tanh(v);}), x.shape); },

          // Math ops
          exp: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.exp(v);}), x.shape); },
          log: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.log(v);}), x.shape); },
          abs: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.abs(v);}), x.shape); },
          sqrt: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.sqrt(v);}), x.shape); },
          pow: function(x, e) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return Math.pow(v, e);}), x.shape); },
          neg: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor(d.map(function(v){return -v;}), x.shape); },

          // Reduction ops
          sum: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0); return _tf.tensor([s]); },
          mean: function(x) { var d=Array.from(x.dataSync()); var s=d.reduce(function(a,b){return a+b;},0)/d.length; return _tf.tensor([s]); },
          max: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.max.apply(null,d)]); },
          min: function(x) { var d=Array.from(x.dataSync()); return _tf.tensor([Math.min.apply(null,d)]); },
          argMax: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]>d[idx])idx=i;} return _tf.tensor([idx]); },
          argMin: function(x) { var d=Array.from(x.dataSync()); var idx=0; for(var i=1;i<d.length;i++){if(d[i]<d[idx])idx=i;} return _tf.tensor([idx]); },

          // Matrix multiplication
          matMul: function(a, b) {
            if (a.shape[a.shape.length-1] !== b.shape[0]) {
              throw new Error('matMul: inner dimensions must match: [' + a.shape + '] vs [' + b.shape + ']');
            }
            var M = a.shape[0], K = a.shape[1] || 1, N = b.shape[1] || 1;
            var ad = Array.from(a.dataSync()), bd = Array.from(b.dataSync());
            var result = [];
            for (var i = 0; i < M; i++) {
              for (var j = 0; j < N; j++) {
                var s = 0;
                for (var k = 0; k < K; k++) {
                  s += ad[i * K + k] * bd[k * N + j];
                }
                result.push(s);
              }
            }
            return _tf.tensor(result, [M, N]);
          },

          // Model API
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
              summary: function() {
                console.log('_________________________________________________________________');
                console.log('Layer (type)                 Output Shape              Param #');
                console.log('=================================================================');
                for (var i = 0; i < layers.length; i++) {
                  var l = layers[i];
                  var name = l.units ? 'dense' : (l.rate !== undefined ? 'dropout' : 'flatten');
                  console.log(name + '                          varies                    0');
                }
                console.log('=================================================================');
              },
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

    // Strip import statements from user code
    const cleanCode = userCode.replace(
      /^import\s+.*from\s+['"].*['"];?\s*$/gm,
      "",
    );

    // Combine: tf mock + harness + clean user code + async IIFE wrapping test code.
    // `console` is shadowed by the parameter we pass in so user/harness
    // logs land in our captured array instead of the browser console.
    const fullCode = `${tfMock}\n${harness}\n${cleanCode}\n;(async function() {\n${testCode}\nreturn __results;\n})()`;

    const fn = new Function("console", fullCode);
    const resultPromise = fn(capturedConsole) as Promise<TestResult[]>;
    const timeoutPromise = new Promise<TestResult[]>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out after 10 seconds")), 10_000),
    );
    const rawResults = await Promise.race([resultPromise, timeoutPromise]);
    results.push(...rawResults);
  } catch (err) {
    results.push({
      name: "Code execution",
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { results, logs };
}

/* ------------------------------------------------------------------ */
/*  TestResults display                                                */
/* ------------------------------------------------------------------ */

function TestResultsPanel({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  const partial = passed > 0 && !allPassed;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="test-results-panel"
      className={`p-4 mt-3 brutalist-shadow border rounded-none ${
        allPassed
          ? "bg-green-400/8 border-green-400/20"
          : partial
            ? "bg-yellow-400/6 border-yellow-400/15"
            : "bg-red-400/8 border-red-400/20"
      }`}
    >
      {/* Section label */}
      <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
        # tests
      </div>

      {/* Partial credit progress bar */}
      {total > 1 && (
        <div className="h-1 overflow-hidden mb-3 bg-border rounded-none">
          <div
            className={`h-full transition-all ${
              allPassed
                ? "bg-green-400"
                : partial
                  ? "bg-yellow-400"
                  : "bg-red-400"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-mono font-semibold uppercase tracking-widest ${
            allPassed
              ? "text-green-400"
              : partial
                ? "text-yellow-400"
                : "text-red-400"
          }`}
        >
          {allPassed
            ? "All tests passed!"
            : partial
              ? `Partial credit — ${passed} of ${total} tests passed`
              : `${passed} of ${total} tests passed`}
        </span>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-none ${
            allPassed
              ? "bg-green-400/15 text-green-400"
              : partial
                ? "bg-yellow-400/12 text-yellow-400"
                : "bg-red-400/15 text-red-400"
          }`}
        >
          {passed}/{total}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {results.map((result, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`flex-shrink-0 mt-0.5 font-mono font-bold ${
                result.passed ? "text-primary" : "text-text-muted"
              }`}
            >
              {result.passed ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={
                  result.passed
                    ? "text-text-primary/70 font-mono text-xs"
                    : "text-text-primary/90 font-mono text-xs"
                }
              >
                {result.name}
              </span>
              {result.error && (
                <p className="text-xs mt-0.5 font-mono text-red-400">
                  {result.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ConsolePanel — runtime console.log / console.error output          */
/* ------------------------------------------------------------------ */

function ConsolePanel({ logs }: { logs: ConsoleEntry[] }) {
  if (logs.length === 0) return null;
  return (
    <div
      data-testid="console-panel"
      className="p-4 mt-3 border border-border bg-code-bg rounded-none brutalist-shadow"
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
        # console
      </div>
      <div className="flex flex-col gap-1 font-mono text-xs leading-relaxed">
        {logs.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={
                entry.level === "error"
                  ? "text-red-400 flex-shrink-0"
                  : entry.level === "warn"
                    ? "text-yellow-400 flex-shrink-0"
                    : "text-primary flex-shrink-0"
              }
            >
              {entry.level === "error"
                ? "!"
                : entry.level === "warn"
                  ? "?"
                  : ">"}
            </span>
            <span
              className={
                entry.level === "error"
                  ? "text-red-400 whitespace-pre-wrap break-all"
                  : entry.level === "warn"
                    ? "text-yellow-400 whitespace-pre-wrap break-all"
                    : "text-text-primary/85 whitespace-pre-wrap break-all"
              }
            >
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BridgeHint — FE↔ML bridge reminder below the editor                */
/* ------------------------------------------------------------------ */

const bridgeTierColors: Record<ExerciseBridge["tier"], string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

function BridgeHint({ bridge }: { bridge: ExerciseBridge }) {
  const color = bridgeTierColors[bridge.tier];
  return (
    <div
      data-testid="bridge-hint"
      className="p-4 mt-3 border border-border bg-surface-overlay rounded-none"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
        # bridge
      </div>
      <p className="text-xs font-mono leading-relaxed text-text-primary/80">
        <span className="text-text-primary">{bridge.feTitle}</span>
        <span className="mx-2" style={{ color }} aria-hidden="true">
          ↔
        </span>
        <span className="text-text-primary">{bridge.mlTitle}</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RunButton — inside Sandpack context to access code                 */
/* ------------------------------------------------------------------ */

function ExerciseControls({
  exercise,
  onResults,
  onLogs,
  onShowSolution,
  onAttempt,
  showSolution,
}: {
  exercise: ExerciseData;
  onResults: (results: TestResult[]) => void;
  onLogs: (logs: ConsoleEntry[]) => void;
  onShowSolution: () => void;
  onAttempt?: (result: ExerciseSubmitResult) => void;
  showSolution: boolean;
}) {
  const { sandpack } = useSandpack();
  const [running, setRunning] = useState(false);
  const hasAttempted = useRef(false);

  const handleRun = useCallback(async () => {
    setRunning(true);
    const code = sandpack.files["/index.js"]?.code ?? "";

    try {
      const { results, logs } = await parseAndRunTests(code, exercise.testCode);
      onResults(results);
      onLogs(logs);
      hasAttempted.current = true;

      // Report attempt to parent for persistence
      if (onAttempt) {
        const passed = results.length > 0 && results.every((r) => r.passed);
        const score =
          results.length > 0
            ? Math.round(
                (results.filter((r) => r.passed).length / results.length) * 100,
              )
            : 0;
        onAttempt({
          exerciseSlug: exercise.slug,
          code,
          passed,
          score,
          solutionViewed: showSolution,
        });
      }
    } catch (err) {
      onResults([
        {
          name: "Execution",
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        },
      ]);
      onLogs([]);
      hasAttempted.current = true;
    } finally {
      setRunning(false);
    }
  }, [
    sandpack,
    exercise.testCode,
    exercise.slug,
    onResults,
    onLogs,
    onAttempt,
    showSolution,
  ]);

  const handleReset = useCallback(() => {
    sandpack.updateFile("/index.js", exercise.starterCode);
    onResults([]);
    onLogs([]);
  }, [sandpack, exercise.starterCode, onResults, onLogs]);

  const handleShowSolution = useCallback(() => {
    sandpack.updateFile("/index.js", exercise.solutionCode);
    onShowSolution();
  }, [sandpack, exercise.solutionCode, onShowSolution]);

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors duration-100 brutalist-hover bg-primary text-surface border-2 border-primary rounded-none hover:bg-transparent hover:text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
      >
        {running ? "Running..." : "Run Tests"}
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-surface-overlay text-text-muted rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
      >
        Reset
      </button>

      {!showSolution && (
        <button
          type="button"
          onClick={handleShowSolution}
          className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ml-auto brutalist-hover bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          Show Solution
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function ExerciseLoadingSkeleton() {
  return (
    <div className="border border-border p-6 animate-pulse">
      <div className="h-5 w-32 bg-border mb-4" />
      <div className="h-4 w-64 bg-border mb-6" />
      <div className="h-32 bg-code-bg border border-border mb-4" />
      <div className="h-10 w-28 bg-border" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Exercise component                                            */
/* ------------------------------------------------------------------ */

export function Exercise({ slug, onSubmit, bridge }: ExerciseProps) {
  const exerciseMap = useContext(ExerciseDataContext);
  const exercise = exerciseMap.get(slug);

  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  // Fallback if exercise data not provided via context
  if (!exercise) {
    return (
      <div className="p-6 my-6 brutalist-shadow bg-surface-raised border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⚡</span>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Exercise
          </h4>
        </div>
        <p className="text-sm text-text-muted">
          Exercise{" "}
          <code className="text-xs px-1.5 py-0.5 bg-surface-overlay text-primary">
            {slug}
          </code>{" "}
          not found.
        </p>
      </div>
    );
  }

  const diffConfig = difficultyConfig[exercise.difficulty];
  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return (
    <div
      className={`p-6 my-6 brutalist-shadow bg-surface-raised border rounded-none ${
        allPassed ? "border-green-400/30" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Exercise
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono font-medium px-2 py-0.5"
            style={{
              background: `${diffConfig.color}15`,
              color: diffConfig.color,
            }}
          >
            {diffConfig.label}
          </span>
          <span className="text-xs text-text-muted">
            ~{exercise.estimatedMinutes} min
          </span>
        </div>
      </div>

      {/* Title & Instructions */}
      <h3 className="text-lg font-semibold mb-2 text-text-primary">
        {exercise.title}
      </h3>
      <p className="text-sm leading-relaxed mb-4 text-text-primary/65">
        {exercise.instructions}
      </p>

      {/* Sandpack Editor */}
      <Suspense fallback={<ExerciseLoadingSkeleton />}>
        <div className="overflow-hidden border border-border rounded-none">
          <SandpackProvider
            template="vanilla"
            theme={{
              colors: {
                surface1: "#252525",
                surface2: "#1C1C1C",
                surface3: "#313131",
                clickable: "#A0A0A0",
                base: "#E0E0E0",
                disabled: "#3a3a3a",
                hover: "#6BAA8A",
                accent: "#6BAA8A",
                error: "#F87171",
                errorSurface: "#2d1515",
              },
              syntax: {
                plain: "#E0E0E0",
                comment: { color: "#A0A0A0", fontStyle: "italic" },
                keyword: "#c792ea",
                tag: "#f07178",
                punctuation: "#89ddff",
                definition: "#82aaff",
                property: "#82aaff",
                static: "#f78c6c",
                string: "#c3e88d",
              },
              font: {
                body: '"JetBrains Mono", ui-monospace, monospace',
                mono: '"JetBrains Mono", "Fira Code", Menlo, monospace',
                size: "13px",
                lineHeight: "1.6",
              },
            }}
            files={{
              "/index.js": { code: exercise.starterCode, active: true },
            }}
          >
            <SandpackCodeEditor
              showLineNumbers
              showTabs={false}
              style={{
                minHeight: 200,
                maxHeight: 400,
              }}
            />

            {/* Controls inside Sandpack context */}
            <div className="px-4 py-3 bg-surface-raised border-t border-border">
              <ExerciseControls
                exercise={exercise}
                onResults={setResults}
                onLogs={setLogs}
                onShowSolution={() => setShowSolution(true)}
                onAttempt={onSubmit}
                showSolution={showSolution}
              />
            </div>
          </SandpackProvider>
        </div>
      </Suspense>

      {/* Test Results */}
      {results.length > 0 && <TestResultsPanel results={results} />}

      {/* Console output */}
      <ConsolePanel logs={logs} />

      {/* Bridge hint */}
      {bridge && <BridgeHint bridge={bridge} />}

      {/* Solution revealed indicator */}
      {showSolution && (
        <p className="text-xs mt-3 italic text-yellow-400 font-mono">
          Solution revealed — try modifying it to deepen your understanding.
        </p>
      )}
    </div>
  );
}
