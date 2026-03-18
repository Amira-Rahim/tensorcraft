"use client";

import {
  useState,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";

import {
  SandpackProvider,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";

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

interface ExerciseProps {
  slug: string;
  onSubmit?: (result: ExerciseSubmitResult) => void;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
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

function parseAndRunTests(userCode: string, testCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Build a minimal test harness that captures results
  // Tests use Jest-style describe/it/expect syntax
  const harness = `
    var __results = [];
    var __currentDescribe = '';

    function describe(name, fn) {
      __currentDescribe = name;
      try { fn(); } catch(e) { /* individual its handle errors */ }
      __currentDescribe = '';
    }

    function it(name, fn) {
      var fullName = __currentDescribe ? __currentDescribe + ' > ' + name : name;
      try {
        fn();
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
      var tf = {
        tensor: function(data, shape) {
          var flat = Array.isArray(data) ? data.flat(Infinity) : [data];
          var s = shape || [flat.length];
          return {
            dataSync: function() { return Float32Array.from(flat); },
            data: function() { return Promise.resolve(Float32Array.from(flat)); },
            shape: s,
            dtype: 'float32',
            rank: s.length,
            size: flat.reduce(function(a,b){ return a*b; }, 1),
            reshape: function(newShape) { return tf.tensor(flat, newShape); },
            add: function(other) { return tf.add(this, other); },
            sub: function(other) { return tf.sub(this, other); },
            mul: function(other) { return tf.mul(this, other); },
            div: function(other) { return tf.div(this, other); },
            mean: function() { var m = flat.reduce(function(a,b){return a+b;},0)/flat.length; return tf.tensor([m]); },
            std: function() { var m = flat.reduce(function(a,b){return a+b;},0)/flat.length; var v = flat.reduce(function(a,b){return a+(b-m)*(b-m);},0)/flat.length; return tf.tensor([Math.sqrt(v)]); },
            print: function() {},
            dispose: function() {},
          };
        },
        add: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return tf.tensor(ad.map(function(v,i){return v+bd[i];}), a.shape); },
        sub: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return tf.tensor(ad.map(function(v,i){return v-bd[i];}), a.shape); },
        mul: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return tf.tensor(ad.map(function(v,i){return v*bd[i];}), a.shape); },
        div: function(a,b) { var ad=Array.from(a.dataSync()), bd=Array.from(b.dataSync()); return tf.tensor(ad.map(function(v,i){return v/bd[i];}), a.shape); },
        relu: function(x) { var d=Array.from(x.dataSync()); return tf.tensor(d.map(function(v){return Math.max(0,v);}), x.shape); },
        sigmoid: function(x) { var d=Array.from(x.dataSync()); return tf.tensor(d.map(function(v){return 1/(1+Math.exp(-v));}), x.shape); },
        softmax: function(x) { var d=Array.from(x.dataSync()); var max=Math.max.apply(null,d); var exp=d.map(function(v){return Math.exp(v-max);}); var sum=exp.reduce(function(a,b){return a+b;},0); return tf.tensor(exp.map(function(v){return v/sum;}), x.shape); },
        scalar: function(v) { return tf.tensor([v]); },
        zeros: function(shape) { return tf.tensor(new Array(shape.reduce(function(a,b){return a*b;},1)).fill(0), shape); },
        ones: function(shape) { return tf.tensor(new Array(shape.reduce(function(a,b){return a*b;},1)).fill(1), shape); },
        sequential: function() {
          var layers = [];
          return {
            add: function(layer) { layers.push(layer); },
            compile: function() {},
            fit: function(x,y,opts) { return Promise.resolve({ history: { loss: [0.5, 0.3, 0.1] } }); },
            predict: function(x) { return tf.zeros([1, 1]); },
            layers: layers,
          };
        },
        layers: {
          dense: function(config) { return { units: config.units, activation: config.activation || 'linear' }; },
          dropout: function(config) { return { rate: config.rate }; },
          flatten: function() { return {}; },
        },
        matMul: function(a,b) { return tf.zeros([a.shape[0], b.shape[1] || 1]); },
      };
    `;

    // Combine: tf mock + user code + test harness + test code
    const fullCode = `${tfMock}\n${harness}\n${userCode}\n${testCode}\nreturn __results;`;

    const fn = new Function(fullCode);
    const rawResults = fn() as TestResult[];
    results.push(...rawResults);
  } catch (err) {
    results.push({
      name: "Code execution",
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
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
      className={`p-4 mt-3 brutalist-shadow border ${
        allPassed
          ? "bg-green-400/8 border-green-400/20"
          : partial
            ? "bg-yellow-400/6 border-yellow-400/15"
            : "bg-red-400/8 border-red-400/20"
      }`}
    >
      {/* Partial credit progress bar */}
      {total > 1 && (
        <div className="h-1 overflow-hidden mb-3 bg-border">
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
          className={`text-xs font-mono px-2 py-0.5 ${
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
            <span className="flex-shrink-0 mt-0.5">
              {result.passed ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={
                  result.passed
                    ? "text-text-primary/70"
                    : "text-text-primary/90"
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
/*  RunButton — inside Sandpack context to access code                 */
/* ------------------------------------------------------------------ */

function ExerciseControls({
  exercise,
  onResults,
  onShowSolution,
  onAttempt,
  showSolution,
}: {
  exercise: ExerciseData;
  onResults: (results: TestResult[]) => void;
  onShowSolution: () => void;
  onAttempt?: (result: ExerciseSubmitResult) => void;
  showSolution: boolean;
}) {
  const { sandpack } = useSandpack();
  const [running, setRunning] = useState(false);
  const hasAttempted = useRef(false);

  const handleRun = useCallback(() => {
    setRunning(true);
    const code = sandpack.files["/index.js"]?.code ?? "";

    // Run with a 10s timeout
    const timeout = setTimeout(() => {
      onResults([
        {
          name: "Execution",
          passed: false,
          error: "Timed out after 10 seconds",
        },
      ]);
      setRunning(false);
    }, 10_000);

    try {
      const results = parseAndRunTests(code, exercise.testCode);
      clearTimeout(timeout);
      onResults(results);
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
      clearTimeout(timeout);
      onResults([
        {
          name: "Execution",
          passed: false,
          error: err instanceof Error ? err.message : String(err),
        },
      ]);
      hasAttempted.current = true;
    }
    setRunning(false);
  }, [
    sandpack,
    exercise.testCode,
    exercise.slug,
    onResults,
    onAttempt,
    showSolution,
  ]);

  const handleReset = useCallback(() => {
    sandpack.updateFile("/index.js", exercise.starterCode);
    onResults([]);
  }, [sandpack, exercise.starterCode, onResults]);

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
        className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors duration-100 brutalist-hover bg-primary text-surface border-2 border-primary hover:bg-transparent hover:text-primary disabled:opacity-60"
      >
        {running ? "Running..." : "Run Tests"}
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-surface-overlay text-text-muted"
      >
        Reset
      </button>

      {!showSolution && (
        <button
          type="button"
          onClick={handleShowSolution}
          className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ml-auto brutalist-hover bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
        >
          Show Solution
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Exercise component                                            */
/* ------------------------------------------------------------------ */

export function Exercise({ slug, onSubmit }: ExerciseProps) {
  const exerciseMap = useContext(ExerciseDataContext);
  const exercise = exerciseMap.get(slug);

  const [results, setResults] = useState<TestResult[]>([]);
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
      className={`p-6 my-6 brutalist-shadow bg-surface-raised border ${
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
            className="text-[11px] font-mono font-medium px-2 py-0.5"
            style={{
              background: `${diffConfig.color}15`,
              color: diffConfig.color,
            }}
          >
            {diffConfig.label}
          </span>
          <span className="text-[11px] text-text-muted">
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
      <div className="overflow-hidden border border-border">
        <SandpackProvider
          template="vanilla"
          theme={{
            colors: {
              surface1: "#252525",
              surface2: "#1C1C1C",
              surface3: "#313131",
              clickable: "#8A8A8A",
              base: "#C8C8C8",
              disabled: "#3a3a3a",
              hover: "#6BAA8A",
              accent: "#6BAA8A",
              error: "#F87171",
              errorSurface: "#2d1515",
            },
            syntax: {
              plain: "#C8C8C8",
              comment: { color: "#8A8A8A", fontStyle: "italic" },
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
              onShowSolution={() => setShowSolution(true)}
              onAttempt={onSubmit}
              showSolution={showSolution}
            />
          </div>
        </SandpackProvider>
      </div>

      {/* Test Results */}
      {results.length > 0 && <TestResultsPanel results={results} />}

      {/* Solution revealed indicator */}
      {showSolution && (
        <p className="text-xs mt-3 italic text-yellow-400">
          Solution revealed — try modifying it to deepen your understanding.
        </p>
      )}
    </div>
  );
}
