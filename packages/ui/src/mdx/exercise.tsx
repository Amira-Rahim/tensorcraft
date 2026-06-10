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

export type MLContent =
  | "arithmetic"
  | "data"
  | "model"
  | "training"
  | "evaluation"
  | "deployment"
  | "systems";

export interface ExerciseData {
  slug: string;
  title: string;
  instructions: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
  estimatedMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  /**
   * ML content axis, orthogonal to cognitive difficulty. Tells learners
   * whether the exercise uses real TFJS primitives or is arithmetic-grade
   * JavaScript with ML framing. See
   * docs/audits/exercise-mlcontent-audit-2026-04-26.md.
   */
  mlContent?: MLContent;
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

import {
  parseAndRunTests,
  type TestResult,
  type ConsoleEntry,
  type TestRunOutcome,
} from "./exercise-runner";

export { parseAndRunTests };
export type { TestRunOutcome };

/* ------------------------------------------------------------------ */
/*  Context - exercise data injected from LessonContent                */
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

const mlContentConfig: Record<MLContent, { label: string; tone: string }> = {
  arithmetic: { label: "Arithmetic", tone: "#9CA3AF" },
  data: { label: "Tensor Data", tone: "#60A5FA" },
  model: { label: "Model Build", tone: "#A78BFA" },
  training: { label: "Training", tone: "#F472B6" },
  evaluation: { label: "Evaluation", tone: "#FB923C" },
  deployment: { label: "Deployment", tone: "#34D399" },
  systems: { label: "Systems", tone: "#F59E0B" },
};

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
              ? `Partial credit: ${passed} of ${total} tests passed`
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
/*  ConsolePanel - runtime console.log / console.error output          */
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
/*  BridgeHint - FE↔ML bridge reminder below the editor                */
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
/*  RunButton - inside Sandpack context to access code                 */
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
            title="Cognitive difficulty"
          >
            {diffConfig.label}
          </span>
          {exercise.mlContent && (
            <span
              className="text-xs font-mono font-medium px-2 py-0.5"
              style={{
                background: `${mlContentConfig[exercise.mlContent].tone}15`,
                color: mlContentConfig[exercise.mlContent].tone,
              }}
              title="ML content axis: what skill the exercise actually builds"
              data-testid="mlcontent-badge"
            >
              {mlContentConfig[exercise.mlContent].label}
            </span>
          )}
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
          Solution revealed. Try modifying it to deepen your understanding.
        </p>
      )}
    </div>
  );
}
