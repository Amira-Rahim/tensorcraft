"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Free-tier magic moment: a REAL TensorFlow.js model (trained offline,
 * ~8 KB) classifying the module's sensor readings live in the reader's
 * browser tab, on the lesson's final step. The last reading is archive
 * sample 7741 — the story's anomaly — which lands at ~51%: too odd to
 * ignore, too ambiguous to alarm. The whole paid course is the answer to
 * the question this number asks.
 *
 * tfjs is dynamically imported on mount so it never touches the initial
 * bundle; the model itself is a static asset under /models/.
 *
 * `interactive` (landing hero only) appends a your-reading panel after the
 * run: three channel sliders, pre-set to sample 7741's exact values, that
 * re-classify live as the visitor drags. The lesson embed stays read-only —
 * its narrative beat ends on the unanswered 51%.
 */

interface Row {
  id: string;
  features: [number, number, number];
  score: number | null;
}

interface DeepScanDemoProps {
  /** Show the drag-your-own-reading panel once the run finishes. */
  interactive?: boolean;
  /** Override the terminal header label (default: lesson preview wording). */
  headerLabel?: string;
}

const STREAM: { id: string; features: [number, number, number] }[] = [
  { id: "7702", features: [0.12, 0.81, 0.2] },
  { id: "7711", features: [0.18, 0.77, 0.31] },
  { id: "7718", features: [0.09, 0.9, 0.14] },
  { id: "7724", features: [0.22, 0.74, 0.25] },
  { id: "7733", features: [0.15, 0.85, 0.19] },
  { id: "7741", features: [0.5, 0.5, 0.5] },
];

const ANOMALY_FEATURES = STREAM[STREAM.length - 1].features;
const CHANNELS = ["ch-0", "ch-1", "ch-2"] as const;

// Minimal surface of the tfjs modules the user-reading panel needs.
interface TfCore {
  tensor2d: (v: number[][]) => { dispose?: () => void };
}
interface LoadedModel {
  predict: (t: unknown) => {
    data: () => Promise<Float32Array>;
    dispose?: () => void;
  };
}

export function DeepScanDemo({
  interactive = false,
  headerLabel = "DEEP SCAN · preview build · live inference",
}: DeepScanDemoProps = {}) {
  const [rows, setRows] = useState<Row[]>(
    STREAM.map((s) => ({ ...s, score: null })),
  );
  const [status, setStatus] = useState<
    "loading" | "running" | "done" | "error"
  >("loading");

  // Kept for the interactive panel — re-classification reuses the same
  // loaded model instead of re-importing tfjs.
  const tfRef = useRef<TfCore | null>(null);
  const modelRef = useRef<LoadedModel | null>(null);

  const [userVals, setUserVals] = useState<[number, number, number]>([
    ...ANOMALY_FEATURES,
  ]);
  const [userScore, setUserScore] = useState<number | null>(null);

  useEffect(() => {
    // No run-once ref guard here: under React StrictMode's dev
    // double-mount, a ref guard blocks the second (surviving) effect run
    // while the first run was already cancelled — the demo would sit on
    // "loading" forever. Each run owns its own cancelled flag instead.
    let cancelled = false;

    (async () => {
      try {
        // Slim imports: core + one backend + layers (a fraction of the
        // full tfjs bundle; skips converter/data/vis we don't use). Pick
        // the backend from a plain canvas probe BEFORE touching tfjs's
        // backend machinery — on machines without WebGL the full bundle's
        // setBackend can stall instead of falling back. The model is
        // 3→16→8→1; cpu is instant when WebGL is unavailable.
        const probe = document.createElement("canvas");
        const hasWebGL = !!(
          probe.getContext("webgl2") || probe.getContext("webgl")
        );
        const [tf, , layers] = await Promise.all([
          import("@tensorflow/tfjs-core"),
          hasWebGL
            ? import("@tensorflow/tfjs-backend-webgl")
            : import("@tensorflow/tfjs-backend-cpu"),
          import("@tensorflow/tfjs-layers"),
        ]);
        await tf.setBackend(hasWebGL ? "webgl" : "cpu");
        await tf.ready();
        const model = await layers.loadLayersModel(
          "/models/deep-scan-preview/model.json",
        );
        if (cancelled) return;
        tfRef.current = tf as unknown as TfCore;
        modelRef.current = model as unknown as LoadedModel;
        setStatus("running");

        const input = tf.tensor2d(STREAM.map((s) => s.features));
        const out = model.predict(input) as {
          data: () => Promise<Float32Array>;
        };
        const scores = await out.data();
        input.dispose?.();

        // Reveal one classification at a time — let the moment breathe.
        for (let i = 0; i < STREAM.length; i++) {
          if (cancelled) return;
          await new Promise((r) =>
            setTimeout(r, i === STREAM.length - 1 ? 900 : 450),
          );
          setRows((prev) =>
            prev.map((row, j) =>
              j === i ? { ...row, score: scores[i] } : row,
            ),
          );
        }
        if (!cancelled) setStatus("done");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const classifyUser = useCallback(async (vals: [number, number, number]) => {
    const tf = tfRef.current;
    const model = modelRef.current;
    if (!tf || !model) return;
    const input = tf.tensor2d([vals]);
    const out = model.predict(input);
    const data = await out.data();
    input.dispose?.();
    out.dispose?.();
    setUserScore(data[0]);
  }, []);

  // First classification of the user panel mirrors sample 7741 exactly —
  // the visitor starts at the story's cliffhanger and drags away from it.
  useEffect(() => {
    if (interactive && status === "done") {
      void classifyUser([...ANOMALY_FEATURES]);
    }
  }, [interactive, status, classifyUser]);

  const setChannel = (i: number, value: number) => {
    setUserVals((prev) => {
      const next = [...prev] as [number, number, number];
      next[i] = value;
      void classifyUser(next);
      return next;
    });
  };

  const verdict = (score: number) =>
    score > 0.7 ? "ANOMALOUS" : score < 0.3 ? "NORMAL" : "— NEITHER —";

  return (
    <div
      data-testid="deep-scan-demo"
      className="my-6 border border-border bg-code-bg font-mono text-[13px]"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface">
        <span
          className={`w-2 h-2 inline-block ${status === "running" ? "bg-primary animate-pulse" : "bg-primary"}`}
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          {headerLabel}
        </span>
      </div>
      <div className="p-4 space-y-1.5">
        {status === "loading" && (
          <p className="text-text-muted">
            // loading model (8 KB) into your browser…
          </p>
        )}
        {status === "error" && (
          <p className="text-text-muted">
            // model failed to load — check your connection and refresh
          </p>
        )}
        {status !== "loading" &&
          status !== "error" &&
          rows.map((row) => (
            <div key={row.id} className="flex items-baseline gap-3">
              <span className="text-text-muted w-28 shrink-0">
                sample {row.id}
              </span>
              {row.score === null ? (
                <span className="text-text-muted/50">…</span>
              ) : (
                <>
                  <span className="text-text-primary w-14">
                    {(row.score * 100).toFixed(1)}%
                  </span>
                  <span
                    data-testid={
                      row.id === "7741" ? "demo-verdict-7741" : undefined
                    }
                    className={
                      row.id === "7741"
                        ? "text-warning font-bold"
                        : "text-text-muted"
                    }
                  >
                    {row.id === "7741"
                      ? `${verdict(row.score)} · ${(row.score * 100).toFixed(0)}% is not an answer`
                      : verdict(row.score)}
                  </span>
                </>
              )}
            </div>
          ))}
        {status === "done" && (
          <p className="pt-3 text-text-muted border-t border-border mt-3">
            // that number is real — an actual neural network computed it in
            your tab just now. Five readings it understood. One it didn&rsquo;t.
            Teaching it to answer is the rest of the course.
          </p>
        )}
        {interactive && status === "done" && (
          <div
            data-testid="demo-user-panel"
            className="pt-3 border-t border-border mt-3 space-y-2"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              // your reading — drag the channels, the model answers live
            </p>
            {CHANNELS.map((ch, i) => (
              <div key={ch} className="flex items-center gap-3">
                <label
                  htmlFor={`demo-slider-${i}`}
                  className="text-text-muted w-28 shrink-0"
                >
                  {ch}
                </label>
                <input
                  id={`demo-slider-${i}`}
                  data-testid={`demo-slider-${i}`}
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={userVals[i]}
                  onChange={(e) => setChannel(i, Number(e.target.value))}
                  className="w-full max-w-[220px]"
                  style={{ accentColor: "var(--tc-primary)" }}
                  aria-label={`Sensor channel ${i}`}
                />
                <span className="text-text-primary w-12 text-right tabular-nums">
                  {userVals[i].toFixed(2)}
                </span>
              </div>
            ))}
            <div
              data-testid="demo-user-score"
              aria-live="polite"
              className="flex items-baseline gap-3 pt-1"
            >
              <span className="text-text-muted w-28 shrink-0">your sample</span>
              {userScore === null ? (
                <span className="text-text-muted/50">…</span>
              ) : (
                <>
                  <span className="text-text-primary w-14">
                    {(userScore * 100).toFixed(1)}%
                  </span>
                  <span
                    className={
                      verdict(userScore) === "— NEITHER —"
                        ? "text-warning font-bold"
                        : "text-text-muted"
                    }
                  >
                    {verdict(userScore)}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-text-muted/70 pt-1">
              // you start on sample 7741&rsquo;s exact values. Find what fools
              the model — that&rsquo;s lesson one&rsquo;s question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
