"use client";

import {
  lazy,
  Suspense,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  createContext,
  useContext,
} from "react";

import { useSandpack, type SandpackTheme } from "@codesandbox/sandpack-react";
import { useScheme } from "../use-scheme";

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
  jsTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
}

interface ExerciseProps {
  slug: string;
  onSubmit?: (result: ExerciseSubmitResult) => void;
  /** Optional JS-to-ML bridge hint shown below the editor. */
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

/* Badge colors are scheme-paired: the dark values are bright pastels that
   sat at 1.5-2.4:1 on the light scheme's white cards (axe, 2026-07-23).
   Light values are the same hues darkened until >=4.6:1 against both
   white and their own `${color}15` tint composited on the light paper
   surface #F5F5F2, the real chip background (axe, 2026-08-12). */
const difficultyConfig = {
  beginner: { label: "Beginner", color: "#4ADE80", light: "#16773A" },
  intermediate: { label: "Intermediate", color: "#FBBF24", light: "#866103" },
  advanced: { label: "Advanced", color: "#F87171", light: "#CA0A0A" },
};

const mlContentConfig: Record<
  MLContent,
  { label: string; tone: string; light: string }
> = {
  arithmetic: { label: "Arithmetic", tone: "#9CA3AF", light: "#606877" },
  data: { label: "Tensor Data", tone: "#60A5FA", light: "#0762D3" },
  model: { label: "Model Build", tone: "#A78BFA", light: "#6E44EB" },
  training: { label: "Training", tone: "#F472B6", light: "#C40F6E" },
  evaluation: { label: "Evaluation", tone: "#FB923C", light: "#A74D04" },
  deployment: { label: "Deployment", tone: "#34D399", light: "#1A7554" },
  systems: { label: "Systems", tone: "#F59E0B", light: "#8F5C06" },
};

/* ------------------------------------------------------------------ */
/*  Sandpack editor theme (dark/light, Task 12 - light-mode rollout,   */
/*  2026-07-22). Sandpack is editor chrome, not world-specific,        */
/*  so both variants use the page-primary green as hover/              */
/*  accent rather than a per-world color.                              */
/* ------------------------------------------------------------------ */

const SANDPACK_THEMES: Record<"dark" | "light", SandpackTheme> = {
  dark: {
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
      // Reverted to 13px 2026-08-23. Raising this to 16px (the iOS auto-zoom
      // threshold) made the code overflow the editor box, which turned
      // `.cm-scroller` into a scrollable region that is not keyboard
      // focusable: axe `scrollable-region-focusable`, serious, on the graded
      // challenge step in both schemes. CI caught it; no local test can,
      // because it needs a real browser to lay out.
      //
      // Closing this properly means the editor box grows with the type, or
      // `.cm-scroller` gets tabindex="0". Both need browser verification.
      size: "13px",
      lineHeight: "1.6",
    },
  },
  light: {
    colors: {
      surface1: "#FFFFFF",
      surface2: "#F6F6F2",
      surface3: "#EDEDE8",
      clickable: "#555555",
      base: "#2E2E2E",
      disabled: "#C0C0BC",
      hover: "#3B6550",
      accent: "#3B6550",
      error: "#C22F2F",
      errorSurface: "#FDECEC",
    },
    syntax: {
      plain: "#2E2E2E",
      comment: { color: "#6F6F6F", fontStyle: "italic" },
      keyword: "#9D41DA",
      tag: "#DC1722",
      punctuation: "#0077A8",
      definition: "#1761FF",
      property: "#1761FF",
      static: "#CE380B",
      string: "#537A19",
    },
    font: {
      body: '"JetBrains Mono", ui-monospace, monospace',
      mono: '"JetBrains Mono", "Fira Code", Menlo, monospace',
      // Reverted to 13px 2026-08-23. Raising this to 16px (the iOS auto-zoom
      // threshold) made the code overflow the editor box, which turned
      // `.cm-scroller` into a scrollable region that is not keyboard
      // focusable: axe `scrollable-region-focusable`, serious, on the graded
      // challenge step in both schemes. CI caught it; no local test can,
      // because it needs a real browser to lay out.
      //
      // Closing this properly means the editor box grows with the type, or
      // `.cm-scroller` gets tabindex="0". Both need browser verification.
      size: "13px",
      lineHeight: "1.6",
    },
  },
};

/* ------------------------------------------------------------------ */
/*  TestResults display                                                */
/* ------------------------------------------------------------------ */

/**
 * One-line spoken summary of a run.
 *
 * Lives in an always-mounted live region (see TestResultsLiveRegion): a
 * region created in the same commit as its content is not reliably announced,
 * which is exactly what the old markup did by putting aria-live on the
 * conditionally-rendered panel. Named failures are included because the panel
 * itself distinguishes pass from fail with colour and an aria-hidden glyph, so
 * a screen reader user gets nothing from the list.
 */
function resultsSummary(results: TestResult[]): string {
  if (results.length === 0) return "";
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  if (passed === total) {
    return `All ${total} ${total === 1 ? "test" : "tests"} passed.`;
  }
  const failed = results.filter((r) => !r.passed).map((r) => r.name);
  return `${passed} of ${total} tests passed. Failed: ${failed.join(", ")}.`;
}

/**
 * Always mounted, even with no results, so the browser has a live region to
 * announce INTO when a run finishes. Visually hidden: the panel below is the
 * sighted affordance.
 */
function TestResultsLiveRegion({ results }: { results: TestResult[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {resultsSummary(results)}
    </div>
  );
}

function TestResultsPanel({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  const partial = passed > 0 && !allPassed;

  return (
    <div
      // No live semantics here: TestResultsLiveRegion owns the announcement.
      // This panel mounts and unmounts with the results, so it cannot be a
      // reliable live region.
      data-testid="test-results-panel"
      className={`p-4 mt-3 brutalist-shadow border rounded-none ${
        allPassed
          ? "bg-success/8 border-success/20"
          : partial
            ? "bg-warning/6 border-warning/15"
            : "bg-error/8 border-error/20"
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
              allPassed ? "bg-success" : partial ? "bg-warning" : "bg-error"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-mono font-semibold uppercase tracking-widest ${
            allPassed ? "text-success" : partial ? "text-warning" : "text-error"
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
              ? "bg-success/15 text-success"
              : partial
                ? "bg-warning/12 text-warning"
                : "bg-error/15 text-error"
          }`}
        >
          {passed}/{total}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {results.map((result, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {/* The tick/cross is aria-hidden because "✓" and "✗" read as
                noise, but that left pass/fail carried by colour alone (WCAG
                1.4.1). The sr-only word restores it without touching the
                visual design. */}
            <span
              className={`flex-shrink-0 mt-0.5 font-mono font-bold ${
                result.passed ? "text-primary" : "text-text-muted"
              }`}
            >
              <span aria-hidden="true">{result.passed ? "✓" : "✗"}</span>
              <span className="sr-only">
                {result.passed ? "Passed: " : "Failed: "}
              </span>
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
                <p className="text-xs mt-0.5 font-mono text-error">
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
                  ? "text-error flex-shrink-0"
                  : entry.level === "warn"
                    ? "text-warning flex-shrink-0"
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
                  ? "text-error whitespace-pre-wrap break-all"
                  : entry.level === "warn"
                    ? "text-warning whitespace-pre-wrap break-all"
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
/*  BridgeHint - JS-to-ML bridge reminder below the editor                */
/* ------------------------------------------------------------------ */

// Module-level: the worker's TFJS CDN pull happens once per page load;
// after any run completes, later runs skip the download. Drives the
// first-run button label ("Downloading TFJS runtime...").
let tfjsRuntimeWarm = false;

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
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
        # bridge
      </div>
      <p className="text-xs font-mono leading-relaxed text-text-primary/80">
        <span className="text-text-primary">{bridge.jsTitle}</span>
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
  const stashedCodeRef = useRef<string | null>(null);
  const [hasStash, setHasStash] = useState(false);

  // Restore the learner's last-run code once on mount. Without this,
  // leaving mid-lesson reset the editor to starterCode and erased the
  // code a pass was earned with (2026-07-14 UX audit).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const saved = localStorage.getItem(`tc-code-${exercise.slug}`);
      if (saved && saved !== exercise.starterCode) {
        sandpack.updateFile("/index.js", saved);
      }
    } catch {
      // localStorage unavailable
    }
    // one-time restore; sandpack identity churns per keystroke, so an
    // exhaustive deps array here would re-fire the restore on every edit.
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    const code = sandpack.files["/index.js"]?.code ?? "";
    try {
      localStorage.setItem(`tc-code-${exercise.slug}`, code);
    } catch {
      // localStorage unavailable
    }

    try {
      // 30s: each run spawns a fresh worker that importScripts CDN TFJS
      // (~1.4 MB); a cold cache plus model-training exercises can blow a
      // 10s budget, which surfaced as "Timed out" on learners' first run.
      const { results, logs } = await parseAndRunTests(
        code,
        exercise.testCode,
        30_000,
      );
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
      tfjsRuntimeWarm = true;
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
    try {
      // Reset means reset: drop the saved copy too.
      localStorage.removeItem(`tc-code-${exercise.slug}`);
    } catch {
      // localStorage unavailable
    }
    onResults([]);
    onLogs([]);
  }, [sandpack, exercise.starterCode, exercise.slug, onResults, onLogs]);

  const handleShowSolution = useCallback(() => {
    // Stash the learner's attempt before overwriting: peeking at the
    // solution must not cost them their own code (2026-07-14 UX audit).
    stashedCodeRef.current = sandpack.files["/index.js"]?.code ?? "";
    setHasStash(true);
    sandpack.updateFile("/index.js", exercise.solutionCode);
    onShowSolution();
  }, [sandpack, exercise.solutionCode, onShowSolution]);

  const handleRestoreMyCode = useCallback(() => {
    if (stashedCodeRef.current !== null) {
      sandpack.updateFile("/index.js", stashedCodeRef.current);
      setHasStash(false);
    }
  }, [sandpack]);

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors duration-100 brutalist-hover bg-primary text-on-primary border-2 border-primary rounded-none hover:bg-transparent hover:text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
      >
        {/* First run pulls ~1.4 MB of TFJS from the CDN into the worker;
            up to 30s of silence read as a hang (2026-07-14 UX audit). */}
        {running
          ? tfjsRuntimeWarm
            ? "Running..."
            : "Downloading TFJS runtime (first run)..."
          : "Run Tests"}
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
          className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ml-auto brutalist-hover bg-warning/10 text-warning border border-warning/20 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          Show Solution
        </button>
      )}
      {hasStash && (
        <button
          type="button"
          onClick={handleRestoreMyCode}
          className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ml-auto brutalist-hover bg-surface-overlay text-text-primary border border-interactive rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          Restore My Code
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
  const scheme = useScheme();

  const [results, setResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  // Sandpack resets the editor to props.files whenever the OBJECT IDENTITY
  // changes (its useFiles effect depends on props.files by reference). An
  // inline literal here meant ANY re-render - most visibly the scheme
  // toggle re-render via useScheme() - silently wiped the learner's typed
  // code back to starterCode (found in the 2026-07-23 transition audit).
  // Stable identity per exercise; before the early return per hooks rules.
  const sandpackFiles = useMemo(
    () => ({
      "/index.js": { code: exercise?.starterCode ?? "", active: true },
    }),
    [exercise?.starterCode],
  );

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
  const diffColor = scheme === "light" ? diffConfig.light : diffConfig.color;
  const mlConfig = exercise.mlContent
    ? mlContentConfig[exercise.mlContent]
    : null;
  const mlTone = mlConfig
    ? scheme === "light"
      ? mlConfig.light
      : mlConfig.tone
    : null;
  const allPassed = results.length > 0 && results.every((r) => r.passed);

  return (
    <div
      className={`p-6 my-6 brutalist-shadow bg-surface-raised border rounded-none ${
        allPassed ? "border-success/30" : "border-border"
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
              background: `${diffColor}15`,
              color: diffColor,
            }}
            title="Cognitive difficulty"
          >
            {diffConfig.label}
          </span>
          {mlConfig && mlTone && (
            <span
              className="text-xs font-mono font-medium px-2 py-0.5"
              style={{
                background: `${mlTone}15`,
                color: mlTone,
              }}
              title="ML content axis: what skill the exercise actually builds"
              data-testid="mlcontent-badge"
            >
              {mlConfig.label}
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
            theme={SANDPACK_THEMES[scheme]}
            files={sandpackFiles}
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

      {/* Test Results. The live region is mounted unconditionally so it can
          announce; the panel renders only once there is something to show. */}
      <TestResultsLiveRegion results={results} />
      {results.length > 0 && <TestResultsPanel results={results} />}

      {/* Console output */}
      <ConsolePanel logs={logs} />

      {/* Bridge hint */}
      {bridge && <BridgeHint bridge={bridge} />}

      {/* Solution revealed indicator */}
      {showSolution && (
        <p className="text-xs mt-3 italic text-warning font-mono">
          Solution revealed. Try changing it and re-running the tests.
        </p>
      )}
    </div>
  );
}
