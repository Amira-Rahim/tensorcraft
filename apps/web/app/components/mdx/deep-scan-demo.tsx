"use client";

import { useEffect, useState } from "react";

/**
 * Free-tier magic moment: a REAL TensorFlow.js model (trained offline,
 * ~4 KB download) classifying the module's sensor readings live in the reader's
 * browser tab, on the lesson's final step. The last reading is archive
 * sample 7741, the story's anomaly, which lands at ~51%: too odd to
 * ignore, too ambiguous to alarm. The whole paid course is the answer to
 * the question this number asks.
 *
 * tfjs is dynamically imported on first use so it never touches the initial
 * bundle; the model itself is a static asset under /models/.
 *
 * Used by the lesson embed (default) and the landing hero (`framing` adds a
 * one-line premise for visitors without story context). An interactive
 * slider lab existed briefly on the landing page and was cut 2026-06-10 -
 * it made the page busy without earning it; the spectator run is the proof.
 * The model probe script (scripts/probe-deep-scan-model.mjs) survives for
 * verifying any future claims against real model output.
 */

interface Row {
  id: string;
  features: [number, number, number];
  score: number | null;
}

const STREAM: { id: string; features: [number, number, number] }[] = [
  { id: "7702", features: [0.12, 0.81, 0.2] },
  { id: "7711", features: [0.18, 0.77, 0.31] },
  { id: "7718", features: [0.09, 0.9, 0.14] },
  { id: "7724", features: [0.22, 0.74, 0.25] },
  { id: "7733", features: [0.15, 0.85, 0.19] },
  { id: "7741", features: [0.5, 0.5, 0.5] },
];

// Minimal surface of the tfjs modules this file needs.
interface TfCore {
  tensor2d: (v: number[][]) => { dispose?: () => void };
}
interface LoadedModel {
  predict: (t: unknown) => {
    data: () => Promise<Float32Array>;
    dispose?: () => void;
  };
}

// Module-level singleton: multiple mounts share one tfjs import + one model
// fetch. First caller pays; everyone else awaits the same promise.
let deepScanLoad: Promise<{ tf: TfCore; model: LoadedModel }> | null = null;

function loadDeepScan(): Promise<{ tf: TfCore; model: LoadedModel }> {
  if (!deepScanLoad) {
    deepScanLoad = (async () => {
      // Slim imports: core + one backend + layers (a fraction of the
      // full tfjs bundle; skips converter/data/vis we don't use). Pick
      // the backend from a plain canvas probe BEFORE touching tfjs's
      // backend machinery, on machines without WebGL the full bundle's
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
      return {
        tf: tf as unknown as TfCore,
        model: model as unknown as LoadedModel,
      };
    })();
    // A failed load shouldn't poison every later mount, allow a retry.
    deepScanLoad.catch(() => {
      deepScanLoad = null;
    });
  }
  return deepScanLoad;
}

const verdict = (score: number) =>
  score > 0.7 ? "ANOMALOUS" : score < 0.3 ? "NORMAL" : "NEITHER";

interface DeepScanDemoProps {
  /** One-line premise for surfaces without the lesson's story context. */
  framing?: boolean;
  /** Override the terminal header label (default: lesson preview wording). */
  headerLabel?: string;
}

export function DeepScanDemo({
  framing = false,
  headerLabel = "DEEP SCAN · preview build · live inference",
}: DeepScanDemoProps = {}) {
  const [rows, setRows] = useState<Row[]>(
    STREAM.map((s) => ({ ...s, score: null })),
  );
  const [status, setStatus] = useState<
    "loading" | "running" | "done" | "error"
  >("loading");

  useEffect(() => {
    // No run-once ref guard here: under React StrictMode's dev
    // double-mount, a ref guard blocks the second (surviving) effect run
    // while the first run was already cancelled, the demo would sit on
    // "loading" forever. Each run owns its own cancelled flag instead.
    let cancelled = false;

    (async () => {
      try {
        const { tf, model } = await loadDeepScan();
        if (cancelled) return;
        setStatus("running");

        const input = tf.tensor2d(STREAM.map((s) => s.features));
        const out = model.predict(input) as {
          data: () => Promise<Float32Array>;
        };
        const scores = await out.data();
        input.dispose?.();

        // Reveal one classification at a time, let the moment breathe.
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
        {/* Landing visitors arrive without the lesson's story context, one
            line answers "what is this" before the table starts filling in. */}
        {framing && (
          <p className="text-text-muted pb-2.5 mb-1 border-b border-border">
            A real 4 KB neural network, downloaded into this page (no server),
            scoring archived sensor readings from the story&rsquo;s ship.
          </p>
        )}
        {status === "loading" && (
          <p className="text-text-muted">
            loading model (4 KB) into your browser…
          </p>
        )}
        {status === "error" && (
          <p className="text-text-muted">
            model failed to load; check your connection and refresh
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
            // that number is real, an actual neural network computed it in your
            tab just now. Five readings it understood. One it didn&rsquo;t.
            Teaching it to answer is the rest of the course.
          </p>
        )}
      </div>
    </div>
  );
}
