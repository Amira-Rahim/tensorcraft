"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ActivitySyncStatus,
  type LocalActivityRecord,
} from "../activity-sync-status";
import { useActivityUser } from "../learning-activity-scope";
import { EVENTS, track } from "@/lib/analytics-events";
import {
  EXPERIMENTS,
  DEFAULT_SETTINGS,
  experimentDraft,
  parseExperimentDraft,
  experimentExpected,
  matchNumbers,
  standardize,
  fixedNeuron,
  policyMetrics,
  gradientTrace,
  spectrum,
  attention,
  cacheReplay,
  VALIDATION_SCORES,
  HELD_OUT_SCORES,
  KEYS,
  VALUES,
  type ExperimentId,
  type ExperimentDraft,
  type CacheMode,
} from "./learning-experiment-data";

const button =
  "min-h-11 border border-border px-3 py-2 text-sm font-medium hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive disabled:opacity-50";
const input =
  "min-h-11 w-full min-w-0 border border-border bg-background px-3 py-2 text-base text-text focus-visible:outline-2 focus-visible:outline-interactive";
const number = (n: number) => Number(n.toFixed(3)).toString();

export function LearningExperiment({ id }: { id: ExperimentId }) {
  return EXPERIMENTS[id] ? <ExperimentBody key={id} id={id} /> : null;
}

function ExperimentBody({ id }: { id: ExperimentId }) {
  const uid = useId(),
    spec = EXPERIMENTS[id];
  const userId = useActivityUser();
  const guestKey = `tensorcraft:experiment:deep-orbit-${id}:v1`;
  const storageKey = userId ? `${guestKey}:account:${userId}` : guestKey;
  const [draft, setDraft] = useState(() => experimentDraft(id));
  const [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setDraft(parseExperimentDraft(raw, id));
    } catch {
      setNotice(
        "This experiment draft could not be read. Start here again; your lesson and editor progress are unchanged.",
      );
    }
    setReady(true);
  }, [id, storageKey]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, ready, storageKey]);
  const changed = draft.phase === "changed_case",
    record = draft[draft.phase];
  const expected = experimentExpected(id, draft);
  const eventBase = {
    worldId: "deep-orbit",
    lessonId: spec.lesson,
    experimentId: `deep-orbit-${id}`,
    contentVersion: 1,
  };
  const update = (patch: Partial<ExperimentDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  function changeSetting(index: number, value: number) {
    const settings = [...draft.settings];
    settings[index] = value;
    update({ settings, answer: "", result: null, revealed: false });
  }
  function help() {
    update({ revealed: true, [draft.phase]: { ...record, help: true } });
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !draft.answer.trim() || record.count >= 20) return;
    if (draft.prediction.count + draft.changed_case.count === 0)
      track(EVENTS.EXPERIMENT_STARTED, eventBase);
    const outcome = {
      correct: matchNumbers(draft.answer, expected),
      assisted: record.help,
    };
    update({
      result: outcome,
      [draft.phase]: {
        ...record,
        first: record.first ?? outcome,
        latest: outcome,
        count: record.count + 1,
        help: true,
      },
    });
    track(EVENTS.EXPERIMENT_SUBMITTED, {
      ...eventBase,
      phase: draft.phase,
      attempt: record.count + 1,
      ...outcome,
    });
  }
  function followup() {
    update({
      phase: "changed_case",
      frozen: id === "threshold" ? (draft.frozen ?? [...draft.settings]) : null,
      answer: "",
      result: null,
      revealed: false,
    });
  }
  return (
    <section
      data-testid={`experiment-${id}`}
      aria-labelledby={`${uid}-title`}
      className="learning-experiment my-8 min-w-0 border border-border bg-surface p-4 sm:p-6"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
        {changed ? "Changed case" : "Try the calculation"}
      </p>
      <h3 id={`${uid}-title`}>{spec.title}</h3>
      <Introduction id={id} />
      {notice && <p role="status">{notice}</p>}
      <fieldset disabled={!ready} className="min-w-0 space-y-5">
        <legend className="sr-only">{spec.title} controls</legend>
        {!changed && (
          <fieldset
            disabled={id === "threshold" && draft.frozen !== null}
            className="min-w-0 grid gap-4 sm:grid-cols-2"
          >
            <legend className="sr-only">Experiment inputs</legend>
            <Controls id={id} values={draft.settings} change={changeSetting} />
          </fieldset>
        )}
        {id === "threshold" && draft.frozen && (
          <p className="font-medium">
            Frozen policy: alert above {draft.frozen[0]}; false-alarm cost{" "}
            {draft.frozen[1]}, miss cost {draft.frozen[2]}. Controls stay locked
            after viewing the final test, including after refresh or reset.
          </p>
        )}
        <GivenData id={id} draft={draft} />
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor={`${uid}-answer`} className="block font-medium">
            <Question id={id} changed={changed} />
          </label>
          <input
            id={`${uid}-answer`}
            value={draft.answer}
            onChange={(e) => update({ answer: e.target.value, result: null })}
            className={`${input} font-mono`}
            autoComplete="off"
            maxLength={80}
            aria-describedby={`${uid}-format`}
          />
          <p id={`${uid}-format`} className="text-sm text-text-muted">
            Enter numbers separated by commas when there is more than one.
            Rounding to three decimal places is enough.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={button}
              disabled={!draft.answer.trim() || record.count >= 20}
            >
              Check prediction
            </button>
            <button type="button" className={button} onClick={help}>
              Show calculation and help
            </button>
          </div>
        </form>
        <div role="status" aria-live="polite">
          {draft.result && (
            <p>
              {draft.result.correct
                ? "Your prediction matches this calculation."
                : `The calculation returns ${expected.map(number).join(", ")}. Compare the inputs and formula below, then try again.`}{" "}
              {draft.result.assisted
                ? "Recorded with help."
                : "Recorded before viewing a calculation in this case."}
            </p>
          )}
        </div>
        {(draft.revealed || draft.result) && <Results id={id} draft={draft} />}
        <div className="flex flex-wrap gap-2">
          {!changed && (
            <button
              type="button"
              className={button}
              onClick={followup}
              disabled={!draft.prediction.count && !draft.revealed}
            >
              {id === "threshold"
                ? draft.frozen
                  ? "Return to final test"
                  : "Freeze policy and open final test"
                : "Try a changed case"}
            </button>
          )}
          {changed && (
            <button
              type="button"
              className={button}
              onClick={() =>
                update({
                  phase: "prediction",
                  answer: "",
                  result: null,
                  revealed: false,
                  changed_case: { ...draft.changed_case, help: true },
                })
              }
            >
              Return to worked case (records reference use)
            </button>
          )}
          <button
            type="button"
            className={button}
            onClick={() =>
              update({
                answer: "",
                result: null,
                revealed: false,
                settings: draft.frozen ?? [...DEFAULT_SETTINGS[id]],
              })
            }
          >
            Reset controls
          </button>
        </div>
        <p className="text-sm text-text-muted">
          {record.count}/20 checks in this case.{" "}
          {record.first
            ? `First: ${record.first.correct ? "matched" : "did not match"}${record.first.assisted ? " with help" : " before help"}. Latest: ${record.latest?.correct ? "matched" : "did not match"}.`
            : "No prediction recorded yet."}{" "}
          Viewing feedback also counts as help for later attempts. Reset keeps
          attempts, help and any frozen policy.{" "}
          {saved ? "Draft saved in this tab." : "Draft is in memory only."} This
          practice does not complete the lesson.
        </p>
      </fieldset>
      <ActivitySyncStatus
        activityId={`deep-orbit-${id}`}
        storageKey={storageKey}
        guestKey={guestKey}
        ready={ready}
        records={activityRecords(draft)}
        readGuest={(raw) => activityRecords(parseExperimentDraft(raw, id))}
      />
    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: [number, string][];
  onChange: (n: number) => void;
}) {
  const selectId = useId();
  return (
    <div className="block min-w-0 space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium">
        {label}
      </label>
      <select
        id={selectId}
        className={input}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
function Controls({
  id,
  values,
  change,
}: {
  id: ExperimentId;
  values: number[];
  change: (i: number, v: number) => void;
}) {
  const select = (i: number, label: string, options: [number, string][]) => (
    <Select
      key={label}
      label={label}
      value={values[i]}
      options={options}
      onChange={(v) => change(i, v)}
    />
  );
  const nums = (vs: number[]): [number, string][] =>
    vs.map((v) => [v, String(v)]);
  switch (id) {
    case "normalization":
      return (
        <>
          {select(0, "Temperature (°C)", nums([20, 22, 24, 28]))}
          {select(1, "Signal (relative units)", nums([0, 1, 2]))}
          {select(2, "Preprocessing", [
            [0, "Raw inputs"],
            [1, "Saved training scaler v1"],
            [2, "Refit on this one reading (mismatch)"],
          ])}
        </>
      );
    case "threshold":
      return (
        <>
          {select(0, "Alert threshold", nums([0.2, 0.4, 0.7, 1]))}
          {select(1, "Cost per false alarm", nums([1, 5]))}
          {select(2, "Cost per missed positive", nums([1, 10]))}
        </>
      );
    case "learning-rate":
      return select(0, "Learning rate", [
        [0.1, "0.1: small step"],
        [0.5, "0.5: larger step"],
        [2.2, "2.2: large step"],
      ]);
    case "fft":
      return (
        <>
          {select(0, "Observed samples", nums([32, 64, 128]))}
          {select(1, "DFT size", [
            [0, "Observed sample count"],
            [1, "Twice the count (zero-padding)"],
          ])}
        </>
      );
    case "attention":
      return select(0, "Query vector", [
        [0, "[1, 0]"],
        [1, "[0, 1]"],
        [2, "[-1, 0]"],
      ]);
    case "cache":
      return (
        <>
          {select(0, "Cache key", [
            [0, "Exact input + model + scaler"],
            [1, "Rounded input + model + scaler"],
            [2, "Exact input only (no versions)"],
          ])}
          {select(1, "Model on request 4", [
            [1, "v1"],
            [2, "v2: logit + 0.2"],
          ])}
          {select(2, "Scaler on request 4", [
            [1, "v1"],
            [2, "v2: input + 0.01"],
          ])}
        </>
      );
  }
}
function Introduction({ id }: { id: ExperimentId }) {
  const text: Record<ExperimentId, string> = {
    normalization:
      "These four synthetic training rows fit the scaler. The neuron keeps weights [0.6, -0.8] and bias 0.1 throughout. Change preprocessing or one reading and watch the score change. The weights are supplied, not trained here, and the sigmoid score is not a calibrated probability.",
    threshold:
      "Compare policies on 21 labeled validation examples. Alert only when score > threshold; equality stays quiet. Cost = FP × false-alarm cost + FN × miss cost. True-positive review work is excluded from this particular cost model. The rows are synthetic, with no claim about mission prevalence.",
    "learning-rate":
      "Use the toy loss L(w) = 0.5 × (w - target)². Its derivative is w - target. One update is w - learningRate × (w - target). The coding exercise uses w² instead, whose derivative is 2w. This convex one-weight example does not predict neural-network convergence.",
    fft: "Sample a generated 10 Hz sine plus a half-amplitude 12 Hz sine at 128 samples/second. Use a rectangular window. The displayed one-sided magnitude is |DFT| / observed samples, without amplitude doubling. This teaching signal is separate from the ship's capture.",
    attention:
      "Use the lesson's unscaled QKᵀ scores, then softmax across three keys and multiply by V. Shapes: Q [1,2], K [3,2], scores and weights [1,3], V [3,2], output [1,2]. Softmax subtracts the largest score before exponentiation. These weights describe this computation; they do not establish causes or human understanding.",
    cache:
      "Replay four requests through a fresh cache. The toy score is sigmoid(100 × (scaledInput - 0.5) + modelOffset). An alert is score ≥ 0.5. Inspect the expected fresh score beside the cached return. Calls and hits are simulated counts, not measured latency.",
  };
  return <p>{text[id]}</p>;
}
function Question({ id, changed }: { id: ExperimentId; changed: boolean }) {
  const text: Record<ExperimentId, [string, string]> = {
    normalization: [
      "Predict the two values that reach the neuron.",
      "The model requires scaler v1. Predict both scaled values for [26, 3].",
    ],
    threshold: [
      "Predict total validation cost for the selected policy.",
      "Apply the frozen policy once. Predict total final-test cost.",
    ],
    "learning-rate": [
      "Starting at w = 4, target = 0, predict w after one update.",
      "Now w = -3, target = 1, rate = 0.5. Predict w after one update.",
    ],
    fft: [
      "Predict the displayed DFT grid spacing in Hz.",
      "64 observed samples, zero-padded to 128: give grid spacing, then native spacing, in Hz.",
    ],
    attention: [
      "Predict the dot-product score for the first key, [1, 0].",
      "Use query [0, 2]. Predict both coordinates of the weighted value vector.",
    ],
    cache: [
      "How many model calls will these four requests need?",
      "Use exact input, model and scaler in the key; request 4 changes both versions to v2. How many model calls?",
    ],
  };
  return text[id][changed ? 1 : 0];
}
function GivenData({
  id,
  draft: d,
}: {
  id: ExperimentId;
  draft: ExperimentDraft;
}) {
  const changed = d.phase === "changed_case";
  switch (id) {
    case "normalization":
      return (
        <div className="space-y-2">
          <p>
            Training rows [temperature, signal]: [20, 0], [20, 2], [24, 0], [24,
            2]. Population mean [22, 1], standard deviation [2, 1]. A saved zero
            standard deviation uses divisor 1; the saved statistic stays zero.
          </p>
          <p className="font-mono text-sm">
            artifact: demo-neuron-v1 · scaler: training-v1 · features:
            temperature, signal
          </p>
          {changed && (
            <p>
              A deployment accidentally pairs the model with scaler v2: mean
              [24, 3], std [2, 1]. Its input becomes [1, 0]. Recover the input
              required by the saved v1 contract, without fitting anything on
              this new reading.
            </p>
          )}
        </div>
      );
    case "threshold": {
      const rows = changed ? HELD_OUT_SCORES : VALIDATION_SCORES;
      return (
        <div>
          <p className="font-medium">
            {changed
              ? "Final test: 10 separate examples. Do not retune on these rows."
              : "Validation: choose your costs before comparing policies."}
          </p>
          <p>
            Positive scores:{" "}
            {rows
              .filter((r) => r.positive)
              .map((r) => number(r.score))
              .join(", ")}
            .
          </p>
          <p>
            Negative scores:{" "}
            {rows
              .filter((r) => !r.positive)
              .map((r) => number(r.score))
              .join(", ")}
            .
          </p>
          <p>
            TP: positive alerted. FP: negative alerted. TN: negative quiet. FN:
            positive missed. Precision, recall and F1 are displayed as 0 when
            their denominator is 0.
          </p>
        </div>
      );
    }
    case "attention":
      return (
        <>
          <NumberTable
            caption="Fixed keys and values"
            headers={["Row", "Key", "Value"]}
            rows={KEYS.map((k, i) => [
              i + 1,
              `[${k.join(", ")}]`,
              `[${VALUES[i].join(", ")}]`,
            ])}
          />
          {changed && (
            <p>
              For Q = [0, 2], scores are [0, 2, 2]. Normalize exp(score - max)
              to sum to 1, then sum each value coordinate with those weights.
            </p>
          )}
        </>
      );
    case "cache":
      return (
        <p>
          Requests 1–3: input 0.499, then 0.501, then 0.501 again, all using
          model v1 and scaler v1. Request 4 repeats 0.501 using{" "}
          {changed ? "both v2 versions" : "the versions selected above"}.
          Rounding to two decimals turns both nearby inputs into 0.50.
        </p>
      );
    default:
      return null;
  }
}
function Results({
  id,
  draft: d,
}: {
  id: ExperimentId;
  draft: ExperimentDraft;
}) {
  const changed = d.phase === "changed_case",
    [a, b, c] = changed && id === "threshold" ? d.frozen! : d.settings;
  let result: ReactNode;
  switch (id) {
    case "normalization": {
      const raw = changed ? [26, 3] : [a, b],
        scaled = standardize(raw);
      const mismatch = changed
        ? standardize(raw, { mean: [24, 3], std: [2, 1] })
        : [0, 0];
      result = (
        <>
          <NumberTable
            caption="Same weights, different preprocessing"
            headers={["Path", "Neuron inputs", "Score"]}
            rows={[
              ["Raw", raw.map(number).join(", "), number(fixedNeuron(raw))],
              [
                "Saved v1",
                scaled.map(number).join(", "),
                number(fixedNeuron(scaled)),
              ],
              [
                changed ? "Wrong v2" : "Refit one row",
                mismatch.map(number).join(", "),
                number(fixedNeuron(mismatch)),
              ],
            ]}
          />
          <p>
            Apply (reading - training mean) / training std in the saved feature
            order. A one-row refit centers that reading to zero and discards its
            distance from training. A different score shows sensitivity to
            preprocessing; it does not show which reading is truly anomalous.
          </p>
        </>
      );
      break;
    }
    case "threshold": {
      const m = policyMetrics(
        changed ? HELD_OUT_SCORES : VALIDATION_SCORES,
        a,
        b,
        c,
      );
      result = (
        <>
          <NumberTable
            caption={`${changed ? "Final test" : "Validation"}: threshold ${a}`}
            headers={["TP", "FP", "TN", "FN"]}
            rows={[[m.tp, m.fp, m.tn, m.fn]]}
          />
          <p>
            Precision {number(m.precision)}, recall {number(m.recall)}, F1{" "}
            {number(m.f1)}. Cost = {m.fp} × {b} + {m.fn} × {c} ={" "}
            <strong>{m.cost}</strong>.
          </p>
          {!changed && (
            <>
              <NumberTable
                caption="Compare on validation only, using your selected costs"
                headers={["Threshold", "F1", "Cost"]}
                rows={[0.2, 0.4, 0.7, 1].map((t) => {
                  const r = policyMetrics(VALIDATION_SCORES, t, b, c);
                  return [t, number(r.f1), r.cost];
                })}
              />
              <p>
                At equal unit costs, 0.4 has higher F1 than 0.7, yet costs more.
                Threshold 1 flags nothing and misses every positive. A cost
                objective and a recall requirement can choose differently.
                Freeze your policy before opening the final test.
              </p>
            </>
          )}
          {changed && (
            <p>
              This is one held-out result for the frozen policy. Report a
              disappointing result as such. Choosing another cutoff after this
              view would turn these examples into validation data.
            </p>
          )}
        </>
      );
      break;
    }
    case "learning-rate":
      result = (
        <>
          <NumberTable
            caption="Four calculated updates"
            headers={["Step", "Weight", "Loss"]}
            rows={gradientTrace(
              changed ? 0.5 : a,
              changed ? -3 : 4,
              changed ? 1 : 0,
            ).map((r) => [r.step, number(r.weight), number(r.loss)])}
          />
          <p>
            The derivative supplies direction and size at the current weight.
            Subtract it times the rate. Here 2.2 crosses the target and
            increases the distance on each update. Overshooting alone does not
            always mean divergence; for example, a rate of 1.2 crosses and
            approaches this target.
          </p>
        </>
      );
      break;
    case "fft": {
      const r = spectrum(changed ? 64 : a, changed || b === 1);
      const bins = r.bins.filter((v) => v.hz <= 24);
      result = (
        <>
          <p>
            Observed duration {r.seconds} s. Native spacing 1/duration ={" "}
            {r.nativeSpacing} Hz. Displayed grid {r.gridSpacing} Hz.
          </p>
          <figure>
            <svg
              viewBox="0 0 320 130"
              role="img"
              aria-label="Magnitude bins from zero to 24 Hz; exact values follow in the table"
              className="w-full text-interactive"
            >
              <line x1="15" y1="105" x2="310" y2="105" stroke="currentColor" />
              {bins.map((v) => (
                <line
                  key={v.hz}
                  x1={15 + (v.hz / 24) * 295}
                  x2={15 + (v.hz / 24) * 295}
                  y1="105"
                  y2={105 - v.magnitude * 150}
                  stroke="currentColor"
                  strokeWidth="3"
                />
              ))}
              <text x="15" y="125" fill="currentColor" fontSize="10">
                0 Hz
              </text>
              <text x="280" y="125" fill="currentColor" fontSize="10">
                24 Hz
              </text>
            </svg>
            <figcaption className="text-sm">
              The numerical table includes every displayed bin.
            </figcaption>
          </figure>
          <NumberTable
            caption="Frequency bins, 0–24 Hz"
            headers={["Hz", "Magnitude / N"]}
            rows={bins.map((v) => [number(v.hz), number(v.magnitude)])}
          />
          <p>
            Padding samples this same finite-window spectrum more densely; it
            adds no observed signal. Two nearby frequencies are not guaranteed
            to be resolved merely because they occupy different bins. Window
            duration, window shape and relative strengths matter. A tone between
            the native bins leaks into neighbors under this rectangular window.
          </p>
        </>
      );
      break;
    }
    case "attention": {
      const r = attention(
        changed
          ? [0, 2]
          : [
              [1, 0],
              [0, 1],
              [-1, 0],
            ][a],
      );
      result = (
        <>
          <NumberTable
            caption="Score, normalized weight, and value contribution"
            headers={["Key row", "Score", "Weight", "Contribution"]}
            rows={r.scores.map((s, i) => [
              i + 1,
              number(s),
              number(r.weights[i]),
              VALUES[i].map((v) => number(v * r.weights[i])).join(", "),
            ])}
          />
          <p>
            Weighted output [{r.value.map(number).join(", ")}]. Sum the
            contributions by column. Display rounding may make the displayed
            weights sum slightly above or below 1.
          </p>
        </>
      );
      break;
    }
    case "cache": {
      const r = cacheReplay(
        changed
          ? "exact"
          : (["exact", "rounded", "unversioned"] as CacheMode[])[a],
        changed ? 2 : b,
        changed ? 2 : c,
      );
      result = (
        <>
          <NumberTable
            caption="Actual deterministic replay; every row has a fresh-score comparison"
            headers={["Request / key", "Fresh", "Returned", "Reuse"]}
            rows={r.rows.map((v, i) => [
              `${i + 1}: ${v.key}`,
              number(v.expected),
              `${number(v.returned)} (${v.returned >= 0.5 ? "alert" : "quiet"})`,
              v.wrong ? "WRONG reuse" : v.hit ? "hit" : "model call",
            ])}
          />
          <p>
            {r.calls} model calls, {r.hits} cache hits. A rounded key can return
            a quiet score for an input whose fresh result alerts. Without both
            versions, replacement artifacts can also reuse a stale score. An
            exact key preserves this toy function's inputs and versions; its
            lookup overhead still needs measurement on the actual runtime.
          </p>
        </>
      );
      break;
    }
  }
  return (
    <div className="space-y-4 border border-border bg-background p-3 sm:p-4">
      {result}
    </div>
  );
}
function NumberTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-interactive"
    >
      <table className="w-full min-w-72 text-left text-sm">
        <caption className="mb-2 text-left font-medium">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col" className="border-b border-border p-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="break-words border-b border-border p-2 font-mono"
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function activityRecords(draft: ExperimentDraft): LocalActivityRecord[] {
  return (["prediction", "changed_case"] as const).map((phase) => ({
    phase,
    count: draft[phase].count,
    first: draft[phase].first,
    latest: draft[phase].latest,
    assistance: draft[phase].help,
  }));
}
