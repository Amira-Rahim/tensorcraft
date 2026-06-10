"use client";

import { useEffect, useState } from "react";

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

export function DeepScanDemo() {
  const [rows, setRows] = useState<Row[]>(
    STREAM.map((s) => ({ ...s, score: null })),
  );
  const [status, setStatus] = useState<
    "loading" | "running" | "done" | "error"
  >("loading");

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
          DEEP SCAN · preview build · live inference
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
      </div>
    </div>
  );
}
