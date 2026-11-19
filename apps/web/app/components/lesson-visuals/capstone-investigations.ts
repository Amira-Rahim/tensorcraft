import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";

const choice = (
  id: string,
  label: string,
  options: string[],
  initial = 0,
): InvestigationControl => ({
  id,
  label,
  kind: "choice",
  initial,
  options: options.map((label, value) => ({ label, value })),
});
const range = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  step = 1,
): InvestigationControl => ({
  id,
  label,
  kind: "range",
  initial,
  min,
  max,
  step,
});
const cells = (
  label: string,
  values: (number | string)[],
  columns = 2,
  highlight: number[] = [],
): InvestigationGraphic => ({
  kind: "cells",
  label,
  values,
  columns,
  highlight,
});
const path = (
  label: string,
  values: string[],
  highlight: number[] = [],
): InvestigationGraphic => ({ kind: "pipeline", label, values, highlight });
const rounded = (value: number) => Number(value.toPrecision(6));

export const CAPSTONE_ASYNC_WINDOW = [0.4, 1.2, 0.4, 1.2, 0.4, 1.2, 0.4, 1.2];
export const CAPSTONE_WINDOW = [1, 1.4, 0.6, 1, 1, 1.4, 0.6, 1];
export function compositionReference(raw: readonly number[]) {
  const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
  const variance =
    raw.reduce((sum, v) => sum + (v - mean) ** 2, 0) / raw.length;
  const normalized = raw.map((v) => (v - mean) / (Math.sqrt(variance) + 1e-8));
  const magnitudes = Array.from(
    { length: Math.floor(raw.length / 2) + 1 },
    (_, bin) => {
      const real = normalized.reduce(
        (sum, v, i) => sum + v * Math.cos((2 * Math.PI * bin * i) / raw.length),
        0,
      );
      const imaginary = normalized.reduce(
        (sum, v, i) => sum - v * Math.sin((2 * Math.PI * bin * i) / raw.length),
        0,
      );
      return Math.hypot(real, imaginary);
    },
  );
  return { mean, variance, normalized, magnitudes };
}
export const RELEASE_ROWS = [
  { predicted: "pulsar", actual: "pulsar" },
  { predicted: "noise", actual: "noise" },
  { predicted: "quasar", actual: "pulsar" },
  { predicted: "noise", actual: "noise" },
  { predicted: "anomaly", actual: "anomaly" },
];
export const CARD_RECALL = {
  pulsar: 0.96,
  noise: 0.95,
  quasar: 0.94,
  interference: 0.9,
  anomaly: 0.84,
};
export const MONITOR_DURATIONS = [
  ...Array.from({ length: 95 }, (_, i) => 40 + i),
  400,
  400,
  400,
  400,
  400,
];
export function nearestRank(values: readonly number[], percentile: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((sorted.length * percentile) / 100) - 1);
  return { sorted, index, value: sorted[index] ?? null };
}

export const CAPSTONE_INVESTIGATIONS: Record<string, LessonInvestigationSpec> =
  {
    "system-architecture": {
      title: "The value at each pipeline handoff",
      brief:
        "Follow the eight-sample composition probe through normalization, FFT magnitudes and an awaited tensor result. Inspect one value before predicting the next stage's width.",
      boundary:
        "This is the exercise's supplied eight-sample composition diagnostic. Its per-window scaler differs from the production classifier. The calculation below is a JavaScript reference, separate from your actual TFJS run and the fictional full-system diagram.",
      controls: [
        choice(
          "stage",
          "Handoff",
          ["Normalized window", "FFT magnitudes", "Model-input tensor"],
          1,
        ),
        {
          ...range("position", "Value position", 0, 0, 7),
          maxFor: (v) => (v.stage === 0 ? 7 : 4),
        },
        choice("async", "Stage completion", [
          "Awaited result",
          "Unsettled promise",
        ]),
      ],
      cases: [
        {
          id: "valid",
          label: "Eight-sample diagnostic",
          description:
            "The exact raw window from the composed feature-chain check.",
        },
        {
          id: "malformed",
          label: "Malformed diagnostic",
          description:
            "Six samples fail the supplied normalization stage before it runs.",
        },
      ],
      prediction: {
        prompt: "How many numeric values reach the selected handoff?",
        unit: "values",
      },
      evaluate: (v, id) => {
        const invalid = id === "malformed",
          ref = compositionReference(CAPSTONE_WINDOW);
        const values = v.stage === 0 ? ref.normalized : ref.magnitudes;
        const blocked = invalid || v.async === 1;
        const width = blocked ? 0 : values.length;
        return {
          graphics: [
            cells(
              "Supplied raw diagnostic window",
              (invalid ? CAPSTONE_WINDOW.slice(0, 6) : CAPSTONE_WINDOW).map(
                rounded,
              ),
              4,
            ),
            path(
              "Validation and completion",
              [
                invalid
                  ? "normalize rejects width 6"
                  : "normalize accepts width 8",
                invalid
                  ? "FFT skipped"
                  : v.async === 1
                    ? "Promise has not settled"
                    : "FFT receives completed array",
                blocked
                  ? "Tensor stage blocked"
                  : "Tensor result has shape [1,5]",
              ],
              [v.stage!],
            ),
            cells(
              "Selected handoff reference",
              [
                "Position",
                v.position!,
                "Value",
                blocked ? "No completed value" : rounded(values[v.position!]!),
                "Width",
                width,
                "Shape",
                v.stage === 2 && !blocked
                  ? "[1,5]"
                  : blocked
                    ? "No result"
                    : `[${width}]`,
              ],
              2,
            ),
          ],
          answer: width,
          answerLabel: "Completed numeric values",
          explanation: invalid
            ? "The normalize validator rejects six samples. Its process function and every later stage must stay uncalled."
            : v.async === 1
              ? "A Promise is a pending operation. Await it before passing its completed value to the next validator."
              : `The selected handoff has ${width} values. Position ${v.position} is ${rounded(values[v.position!]!)} in this reference. The FFT keeps bins 0-4, including DC and Nyquist. No sample rate is supplied here, so the positions are bins rather than hertz. The caller owns and releases the final tensor.`,
        };
      },
    },
    "ci-cd-pipeline": {
      title: "The cases and artifact behind the release gate",
      brief:
        "Inspect a supplied prediction row, its label and the denominator. Then inspect the separate export model's tensor inventory. These are two different checks.",
      boundary:
        "The five prediction rows are the exercise's fixed behavior probe. The export uses a separate, initially untrained 3/16/8/1 model with 209 parameters. Neither result deploys a model or proves generalization.",
      controls: [
        choice("view", "Evidence to inspect", [
          "Behavior gate",
          "Export inventory",
        ]),
        range("row", "Prediction row", 0, 0, 4),
        range("minimum", "Accuracy floor (%)", 80, 0, 100),
        choice("identity", "Candidate identity", [
          "Unchanged artifact",
          "Changed artifact",
        ]),
      ],
      cases: [
        {
          id: "high",
          label: "Supplied five-row probe",
          description: "Four of five supplied predictions match their labels.",
        },
        {
          id: "lower",
          label: "Missing-label reference",
          description:
            "Remove the second row's label in this reference. It stays in the denominator.",
        },
      ],
      prediction: {
        prompt: "What value does the selected check report?",
        unit: "score fraction or parameter count",
      },
      evaluate: (v, id) => {
        const rows = RELEASE_ROWS.map((row, i) => ({
          ...row,
          actual: id === "lower" && i === 1 ? null : row.actual,
        }));
        const correct = rows.filter(
            (row) => row.actual !== null && row.predicted === row.actual,
          ).length,
          score = correct / rows.length,
          row = rows[v.row!]!;
        const sizes = [48, 16, 128, 8, 8, 1];
        return {
          graphics: [
            cells(
              "Selected labeled probe",
              [
                "Row",
                v.row! + 1,
                "Prediction",
                row.predicted,
                "Label",
                row.actual ?? "Missing",
                "Counted correct",
                String(row.actual !== null && row.predicted === row.actual),
              ],
              2,
            ),
            cells(
              "Behavior denominator and rule",
              [
                "Correct",
                correct,
                "Total",
                rows.length,
                "Score",
                score,
                "Floor",
                v.minimum! / 100,
                "Gate passes",
                String(score >= v.minimum! / 100),
              ],
              2,
            ),
            cells("Separate exported tensor sizes", sizes, 3),
            path("Evidence ownership", [
              "Behavior probe: supplied rows",
              "Export probe: real serialized bytes",
              v.identity === 0
                ? "Keep each result with its own artifact"
                : "Changed artifact needs fresh checks",
            ]),
          ],
          answer: v.view === 0 ? score : 209,
          answerLabel:
            v.view === 0
              ? "Supplied probe accuracy"
              : "Export model parameters",
          explanation: `${correct}/${rows.length} gives ${score}. Missing labels stay in the total and cannot count as correct. Equality with the chosen floor passes this nonempty probe. The separate export has six weight tensors containing 48 + 16 + 128 + 8 + 8 + 1 = 209 parameters and 836 bytes when all are float32. Measure byteLength for other encodings. A round trip checks serialization parity, not the behavior of the gate's unrelated rows.${v.identity === 1 ? " The candidate changed, so its old report cannot approve it." : ""}`,
        };
      },
    },
    monitoring: {
      title: "The observations behind a monitoring summary",
      brief:
        "Choose scores, a latency percentile, or a feature mean. Follow the supplied log to the summary before deciding what needs investigation.",
      boundary:
        "These are the exercise's supplied diagnostic logs and a JavaScript reference calculation. The durations are provided numbers, not browser measurements. Scores and mean shifts establish no accuracy verdict.",
      controls: [
        choice(
          "view",
          "Measurement",
          ["Mean score", "Latency percentile", "Feature-mean distance"],
          1,
        ),
        range("percentile", "Requested percentile", 95, 0, 100),
        range("feature", "Feature position", 0, 0, 1),
      ],
      cases: [
        {
          id: "routine",
          label: "Supplied logs",
          description:
            "Scores 0.9, 0.8, 0.7. There are 95 durations from 40 to 134 ms, plus five 400 ms calls. Recent rows are [0, 0] and [2, 4].",
        },
        {
          id: "changed",
          label: "Empty logs",
          description:
            "No observations produce No data, rather than a measured zero.",
        },
      ],
      prediction: {
        prompt: "What summary value does this measurement return?",
        unit: "number or No data",
        choices: undefined,
      },
      evaluate: (v, id) => {
        const empty = id === "changed",
          scores = empty ? [] : [0.9, 0.8, 0.7],
          durations = empty ? [] : MONITOR_DURATIONS;
        const ranked = nearestRank(durations, v.percentile!),
          means = [1, 2],
          meanScore = scores.length
            ? scores.reduce((a, b) => a + b) / scores.length
            : null;
        const selected =
          v.view === 0
            ? meanScore
            : v.view === 1
              ? ranked.value
              : empty
                ? null
                : Math.hypot(...means);
        return {
          graphics: [
            cells("Score log", scores.length ? scores : ["No data"], 3),
            cells(
              "Nearest-rank selection",
              [
                "Duration count",
                durations.length,
                "Percentile",
                v.percentile!,
                "Sorted index",
                empty ? "No data" : ranked.index,
                "Selected ms",
                ranked.value ?? "No data",
              ],
              2,
            ),
            cells(
              "Feature mean reference",
              [
                "Position",
                v.feature!,
                "Baseline mean",
                empty ? "No data" : 0,
                "Recent mean",
                empty ? "No data" : means[v.feature!]!,
                "Difference",
                empty ? "No data" : means[v.feature!]!,
              ],
              2,
            ),
            ...(empty
              ? []
              : [
                  {
                    kind: "line" as const,
                    label: "Supplied sorted durations (ms)",
                    values: ranked.sorted,
                    layout: "series" as const,
                    highlight: [ranked.index],
                  },
                ]),
          ],
          answer: selected ?? "No data",
          answerLabel: "Monitoring summary",
          explanation: empty
            ? "The log is empty, so the result is null, displayed as No data. A recorded zero is a different observation."
            : `The score mean is 0.8. The nearest-rank P${v.percentile} uses max(0,ceil(100*${v.percentile}/100)-1), index ${ranked.index}, giving ${ranked.value} ms. P0 selects the minimum; P100 selects the maximum. Feature means [1, 2] are sqrt(5) from [0, 0]. A matching mean can still hide changed spread. Review labels before claiming accuracy changed.`,
        };
      },
    },
    documentation: {
      title: "A card line and the metadata it describes",
      brief:
        "Select one supplied field or class, then change that class recall in a reference. Follow its formatting into the model card and keep its evidence scope beside the result.",
      boundary:
        "The initial values are the exact fictional metadata from the model-card exercise. Changing class recall creates a modified reference, separate from downloaded models and your earlier measured runs. Formatting and completeness do not verify the claims.",
      controls: [
        choice("line", "Card field", [
          "Accuracy",
          "Weight-file bytes",
          "Inference duration",
          "Lowest recall",
          "Input format",
          "Output format",
        ]),
        range("class", "Recall class position", 4, 0, 4),
        range("recall", "Selected class recall reference (%)", 84, 0, 100),
      ],
      cases: [
        {
          id: "normal",
          label: "Supplied handover",
          description:
            "DEEP SCAN v1.0.0 has accuracy 0.918 at the pruning review, 3988 weight bytes and 0.035 ms inference duration.",
        },
        {
          id: "new",
          label: "New sensor request",
          description:
            "The same card accompanies a proposed sensor B use that has no recorded evaluation.",
        },
      ],
      prediction: {
        prompt: "Which class has the smallest recall in this reference?",
        choices: Object.keys(CARD_RECALL),
      },
      evaluate: (v, id) => {
        const entries = Object.entries(CARD_RECALL).map(
            ([name, value], index): [string, number] => [
              name,
              index === v.class ? v.recall! / 100 : value,
            ],
          ),
          selected = entries[v.class!]!,
          worst = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
        const lines = [
          "- Accuracy: 91.8% (measured at the pruning review)",
          "- Size: 3988 bytes",
          "- Inference: 0.035ms",
          `- Lowest recall: ${worst[0]} at ${(worst[1] * 100).toFixed(1)}%`,
          "- Input: Float32Array(64)",
          "- Output: { label, confidence }",
        ];
        return {
          graphics: [
            cells(
              "Supplied field and rendered line",
              [
                "Selected line",
                lines[v.line!]!,
                "Evaluation context",
                "the pruning review",
                "Selected class",
                selected[0],
                "Recall fraction",
                selected[1],
                "Percentage",
                `${(selected[1] * 100).toFixed(1)}%`,
              ],
              2,
            ),
            {
              kind: "bars",
              label: "Supplied per-class recall (%)",
              labels: entries.map(([name]) => name),
              values: entries.map(([, value]) => value * 100),
              highlight: [v.class!],
            },
            path("Handover evidence", [
              "Read supplied metadata",
              "Render percentages and sections",
              id === "new"
                ? "SensorB still needs evaluation"
                : "Keep the stated evaluation scope",
            ]),
          ],
          answer: worst[0],
          answerLabel: "Lowest-recall class",
          explanation: `Compare every recall value. The minimum is ${worst[0]} at ${(worst[1] * 100).toFixed(1)}%. Line ${v.line! + 1} reads: ${lines[v.line!]}. Weight-file bytes exclude other downloads; the supplied inference duration is not a whole-pipeline measurement.${id === "new" ? " The card's existing sensor results do not evaluate sensor B." : ""} The Challenge's actual generated string is the handover artifact.`,
        };
      },
    },
    launch: {
      title: "The three launch records",
      brief:
        "Follow one local verification check, the rehearsal gate or an adjacent interval ratio. Each task has its own inputs and result.",
      boundary:
        "The verification and rehearsal use separate local diagnostic models. The interval values and model scores are fictional mission inputs. This activity calculates references and contacts no host.",
      controls: [
        choice("task", "Launch task", [
          "Ordered verification",
          "Rehearsal release gate",
          "Interval classification",
        ]),
        range("check", "Verification check", 0, 0, 2),
        choice("failure", "Reference check outcome", [
          "All pass",
          "Second check fails",
          "Second check times out",
        ]),
        range("accuracy", "Reference canary accuracy (%)", 90, 0, 100),
        choice("drift", "Reference score shift", [
          "Within configured tolerance",
          "Exceeds configured tolerance",
        ]),
        range("ratio", "Adjacent interval pair", 0, 0, 5),
      ],
      cases: [
        {
          id: "local",
          label: "Local rehearsal",
          description:
            "Three ordered checks, a separate rehearsal gate, and the seven supplied zero-hour intervals.",
        },
        {
          id: "connected",
          label: "Hosted follow-up",
          description:
            "The local records still need hosted artifact identity and target-console checks before a real release.",
        },
      ],
      prediction: {
        prompt: "What does the selected task report?",
        unit: "passed checks, launch as 1 or 0, or interval ratio",
        tolerance: 0.001,
      },
      evaluate: (v, id) => {
        const intervals = [0.9, 0.9, 1.8, 2.7, 4.5, 7.2, 11.7],
          ratios = intervals.slice(1).map((value, i) => value / intervals[i]!);
        const count = v.failure === 0 ? 3 : v.failure === 1 ? 2 : 1;
        const names = ["output-contract", "anomaly-gate", "calm-gate"];
        const outcomes =
          v.failure === 0
            ? ["Pass", "Pass", "Pass"]
            : v.failure === 1
              ? ["Pass", "Fail", "Pass"]
              : ["Pass", "Timed out", "Skipped after timeout"];
        const launch = v.accuracy! >= 90 && v.drift === 0;
        return {
          graphics: [
            cells(
              "Selected verification reference",
              [
                "Check",
                names[v.check!]!,
                "Outcome",
                outcomes[v.check!]!,
                "Whole verification passes",
                String(count === 3),
              ],
              2,
            ),
            cells(
              "Rehearsal gate reference",
              [
                "Canary accuracy",
                v.accuracy! / 100,
                "Required floor",
                0.9,
                "Mean score within tolerance",
                String(v.drift === 0),
                "Candidate launches",
                String(launch),
              ],
              2,
            ),
            cells(
              "Supplied interval pair",
              [
                "Earlier gap (s)",
                intervals[v.ratio!]!,
                "Next gap (s)",
                intervals[v.ratio! + 1]!,
                "Ratio",
                ratios[v.ratio!]!,
                "Expected template ratio",
                [1, 2, 1.5, 5 / 3, 1.6, 1.625][v.ratio!]!,
              ],
              2,
            ),
            path("Separate evidence", [
              "Local check record",
              "Actual fit and canary result",
              "Supplied detector and interval decision",
              id === "connected"
                ? "Hosted verification still required"
                : "No hosted deployment performed",
            ]),
          ],
          answer:
            v.task === 0
              ? count
              : v.task === 1
                ? Number(launch)
                : ratios[v.ratio!]!,
          answerLabel:
            v.task === 0
              ? "Checks that passed"
              : v.task === 1
                ? "Reference launch decision"
                : "Adjacent interval ratio",
          explanation: `${count} of three checks pass in this reference. A failed check blocks the whole verification. Timeout also skips its dependents. The separate rehearsal requires accuracy at least 0.9 and no configured mean-score drift. Its actual training history and predictions come from your Challenge run. The selected interval ratio is ${ratios[v.ratio!]}. Common scaling leaves these ratios unchanged. The final decision combines the supplied detector votes and a finite template match. The scores 0.999 and 0.518 come from different systems, so their difference establishes no accuracy gain or signal origin.`,
        };
      },
    },
  };
