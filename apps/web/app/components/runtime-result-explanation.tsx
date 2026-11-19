"use client";

import { useId, useState } from "react";
import {
  policyReference,
  type PolicyResult,
  type InferenceResult,
  type CapacityResult,
  type ReportsResult,
  type RuntimeParityResult,
  type RuntimeResult,
} from "@/lib/runtime-result-explanations";

const control =
  "relative min-h-11 min-w-0 max-w-full border border-border bg-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-interactive";
const number = (value: number) =>
  Number.isFinite(value)
    ? Number(value.toPrecision(7)).toString()
    : "Outside JavaScript’s finite number range";
function Measures({ values }: { values: [string, number | string][] }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-4 text-lg sm:grid-cols-2">
      {values.map(([label, value]) => (
        <div key={label} className="min-w-0 [overflow-wrap:anywhere]">
          <dt className="text-text-secondary">{label}</dt>
          <dd className="font-mono">
            {typeof value === "number" ? number(value) : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Policy({ result }: { result: PolicyResult }) {
  const uid = useId(),
    [selected, setSelected] = useState(0);
  const row = result.cases[selected]!,
    reference = policyReference(row);
  return (
    <>
      <h3 className="text-2xl font-semibold">
        The requirements behind your recommendation
      </h3>
      <p className="text-lg leading-relaxed">
        These are supplied policy probes. Select a case to follow its local
        requirements, download budget, and latency preference beside the
        recommendation your function returned.
      </p>
      <label htmlFor={uid} className="grid gap-2">
        Policy probe
        <select
          id={uid}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.cases.map((row, i) => (
            <option key={i} value={i}>
              {row.source.startsWith("Local")
                ? "Local requirement"
                : "Boundary"}{" "}
              probe {i + 1}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Supplied model size in MB", row.size],
          ["Supplied latency preference in ms", row.latency],
          ["Sensitive input must stay local", row.sensitive ? "Yes" : "No"],
          ["Offline predictions required", row.offline ? "Yes" : "No"],
          ["Your returned recommendation", row.returned],
          ["Reference from the stated policy", reference.decision],
        ]}
      />
      <ol className="grid gap-3 text-lg">
        <li>
          {row.sensitive || row.offline
            ? "At least one input requires local predictions."
            : "Neither input requires local predictions."}
        </li>
        <li>
          {row.size <= 50
            ? "The model fits the inclusive 50 MB budget."
            : "The model exceeds the 50 MB budget."}
        </li>
        <li>
          {row.size > 50 || row.sensitive || row.offline
            ? "The size or local requirement decides this case before latency preference."
            : `The ${number(row.latency)} ms preference is ${row.latency < 50 ? "below" : "at or above"} 50 ms.`}
        </li>
      </ol>
      <p role="status" className="text-lg leading-relaxed">
        {reference.reason} Your function returned {row.returned}. These rules
        choose a location. Device and network measurements still determine
        whether the app meets its latency goal.
      </p>
    </>
  );
}
const featureNames: Record<string, string> = {
  amplitude: "Amplitude",
  frequency: "Zero-crossing count",
  phase: "Sample-pair angle",
};
function Inference({ result }: { result: InferenceResult }) {
  const uid = useId(),
    [selected, setSelected] = useState(0);
  const row = result.features[selected]!,
    reference = (row.raw - row.min) / (row.max - row.min);
  const expectedClass = result.output > 0.5 ? "anomaly" : "noise",
    expectedScore = result.output > 0.5 ? result.output : 1 - result.output;
  return (
    <>
      <h3 className="text-2xl font-semibold">
        A raw field through your handler
      </h3>
      <p className="text-lg leading-relaxed">
        The supplied diagnostic model echoes the amplitude input. The captures
        show what reached model.predict and the output that model returned. This
        is a preprocessing and decision probe.
      </p>
      <label htmlFor={uid} className="grid gap-2">
        Feature
        <select
          id={uid}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.features.map((row, i) => (
            <option key={row.key} value={i}>
              {featureNames[row.key]}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Feature position in the model row", selected],
          ["Supplied raw value", row.raw],
          ["Requested range minimum", row.min],
          ["Requested range maximum", row.max],
          ["JavaScript scaling reference", reference],
          ["Observed value at model.predict", row.observed],
          ["Observed model output", result.output],
          ["Your returned class", result.returned],
          ["Your selected-class score", result.score],
          ["Class from the strict above-0.5 rule", expectedClass],
          ["Score from the stated class rule", expectedScore],
        ]}
      />
      <p role="status" className="text-lg leading-relaxed">
        {featureNames[row.key]} uses (raw minus minimum) divided by (maximum
        minus minimum). The range is the exercise’s supplied reference. The
        observed tensor value remains your handler’s output. Positions start at
        0 in amplitude, frequency, phase order.
      </p>
      <p className="text-lg leading-relaxed">
        The legacy frequency key carries a zero-crossing count. The phase key
        carries a supplied sample-pair angle in radians. Neither field is an FFT
        frequency or FFT phase. A chosen-class score does not measure
        classification accuracy.
      </p>
      {result.memory && (
        <>
          <Measures
            values={[
              ["Separate cleanup probe: tensors before", result.memory.before],
              ["Separate cleanup probe: tensors after", result.memory.after],
              [
                "Separate cleanup probe: count change",
                result.memory.after - result.memory.before,
              ],
            ]}
          />
          <p className="text-lg leading-relaxed">
            The count check uses a separate prediction call. Matching counts
            show that call released its temporary tensors. They do not measure
            total browser memory.
          </p>
        </>
      )}
    </>
  );
}
function Capacity({ result }: { result: CapacityResult }) {
  const uid = useId(),
    [selected, setSelected] = useState(0);
  const elapsed = result.last.time - result.first.time,
    change = result.last.count - result.first.count,
    rate = change / elapsed,
    remaining = result.budget - result.last.count;
  const usableRate =
    Number.isFinite(elapsed) &&
    elapsed > 0 &&
    Number.isFinite(rate) &&
    !(rate === 0 && change !== 0);
  const steps = [
    {
      name: "Elapsed hours",
      value: elapsed,
      detail: `${number(result.last.time)} minus ${number(result.first.time)} hours.`,
    },
    {
      name: "Count change",
      value: change,
      detail: `${number(result.last.count)} minus ${number(result.first.count)} tensors.`,
    },
    {
      name: "Endpoint rate",
      value: usableRate ? rate : NaN,
      detail: `${number(change)} tensors divided by ${number(elapsed)} hours.`,
    },
    {
      name: "Remaining capacity",
      value: remaining,
      detail: `${number(result.budget)} budget tensors minus the latest ${number(result.last.count)}.`,
    },
    {
      name: "Projected hours",
      value: usableRate ? (rate > 0 ? remaining / rate : Infinity) : NaN,
      detail: !usableRate
        ? "The captured numbers exceed this view's calculation range, so it cannot calculate a deadline."
        : rate > 0
          ? `${number(remaining)} remaining tensors divided by ${number(rate)} tensors per hour.`
          : "A flat or falling endpoint rate gives no projected growth deadline.",
    },
  ];
  const step = steps[selected]!;
  return (
    <>
      <h3 className="text-2xl font-semibold">
        The endpoints behind your capacity estimate
      </h3>
      <p className="text-lg leading-relaxed">
        This fixed incident worksheet supplies the first and last snapshots.
        Follow the arithmetic, then compare the reference projection with your
        returned values. The calculation assumes the endpoint rate continues.
      </p>
      <label htmlFor={uid} className="grid gap-2">
        Projection calculation
        <select
          id={uid}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {steps.map((row, i) => (
            <option key={row.name} value={i}>
              {row.name}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["First snapshot: hours", result.first.time],
          ["First snapshot: tensors", result.first.count],
          ["Last snapshot: hours", result.last.time],
          ["Last snapshot: tensors", result.last.count],
          ["Supplied tensor budget", result.budget],
          [
            "Selected calculation reference",
            usableRate && rate <= 0 && selected === 4
              ? "No projected growth deadline"
              : step.value,
          ],
          ["Your growing flag", String(result.returned.growing)],
          ["Your returned tensors per hour", result.returned.rate],
          ["Your returned hours to budget", result.returned.hours],
        ]}
      />
      <p role="status" className="text-lg leading-relaxed">
        {step.name}: {step.detail}
      </p>
      <p className="text-lg leading-relaxed">
        These counts cannot identify a leak or prove a steady trend. Startup and
        caching can also raise counts. A flat or falling count can change later.
      </p>
    </>
  );
}
function Reports({ result }: { result: ReportsResult }) {
  const uid = useId(),
    [selected, setSelected] = useState(0);
  const row = result.supplied[selected]!;
  const matches = result.returned.flatMap((item, i) =>
    item.text === row.text ? [{ ...item, rank: i + 1 }] : [],
  );
  const rank =
    [...result.supplied]
      .sort((a, b) => b.score - a.score)
      .findIndex((item) => item.position === row.position) + 1;
  return (
    <>
      <h3 className="text-2xl font-semibold">
        One report keeps its prediction when sorted
      </h3>
      <p className="text-lg leading-relaxed">
        The simulation supplies one positional prediction per report. Select an
        original report and follow its label and score into the queue your code
        returned.
      </p>
      <label htmlFor={uid} className="grid gap-2">
        Original report
        <select
          id={uid}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.supplied.map((row, i) => (
            <option key={row.position} value={i}>
              {row.position}: {row.text}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Supplied report text", row.text],
          ["Original position", row.position],
          ["Supplied sentiment label", row.label],
          ["Supplied sentiment score", row.score],
          ["Reference rank by supplied score", rank],
          ["Returned rows with this report text", matches.length],
        ]}
      />
      {matches.map((item, i) => (
        <Measures
          key={i}
          values={[
            ["Returned queue position", item.rank],
            ["Your returned label", item.label],
            ["Your returned score", item.score],
          ]}
        />
      ))}
      <p role="status" className="text-lg leading-relaxed">
        {matches.length === 1
          ? `Your queue puts this report at position ${matches[0]!.rank}. Its label and score ${matches[0]!.label === row.label && matches[0]!.score === row.score ? "match" : "differ from"} the supplied pair.`
          : matches.length === 0
            ? "Your queue contains no row with this original report text."
            : "Your queue repeats this report text. Inspect each returned row before treating it as one result per report."}{" "}
        Pair the text with its prediction before sorting the rows.
      </p>
      <p className="text-lg leading-relaxed">
        The reference ranks both sentiment labels by score. A high sentiment
        score does not establish urgency, model accuracy, or suitability for
        ship reports.
      </p>
    </>
  );
}
function Parity({ result }: { result: RuntimeParityResult }) {
  const uid = useId(),
    [selected, setSelected] = useState(0),
    left = result.runs[0]!,
    right = result.runs[1]!;
  const difference = Math.abs(left.output - right.output),
    sameInputs = left.inputs.every((value, i) => value === right.inputs[i]);
  return (
    <>
      <h3 className="text-2xl font-semibold">
        The inputs and outputs behind your parity decision
      </h3>
      <p className="text-lg leading-relaxed">
        This probe uses planted TensorFlow.js weights and a simulated ONNX
        session and clock. Its two observed outputs and returned decision come
        from the same comparison call.
      </p>
      <label htmlFor={uid} className="grid gap-2">
        Input position
        <select
          id={uid}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {left.inputs.map((_, i) => (
            <option key={i} value={i}>
              Position {i}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Observed TFJS input", left.inputs[selected]!],
          ["Observed ONNX input", right.inputs[selected]!],
          ["All three observed inputs match", String(sameInputs)],
          ["Observed TFJS output", left.output],
          ["Observed ONNX output", right.output],
          ["JavaScript absolute output difference", difference],
          ["Inclusive parity tolerance", 0.0001],
          ["Reference outputs agree", String(difference <= 0.0001)],
          ["Your returned outputsAgree", String(result.returned)],
          ["Your TFJS simulated interval", result.tfjsMs],
          ["Your ONNX simulated interval", result.onnxMs],
        ]}
      />
      <p role="status" className="text-lg leading-relaxed">
        Position {selected}{" "}
        {left.inputs[selected] === right.inputs[selected]
          ? "matches"
          : "differs"}{" "}
        across the observed inputs. The parity reference allows an output
        difference of at most 0.0001. Parity compares outputs. It establishes no
        prediction accuracy.
      </p>
      <p className="text-lg leading-relaxed">
        The clock advances by fixed test steps. These intervals measure no
        device speed and support no runtime ranking. Real measurements need
        loading outside the timer, completed output readback, repeated runs, and
        recorded backend/provider conditions.
      </p>
    </>
  );
}
export function RuntimeResultExplanation({
  result,
}: {
  result: RuntimeResult;
}) {
  const explanation =
    result.kind === "deployment-policy" ? (
      <Policy result={result} />
    ) : result.kind === "inference-trace" ? (
      <Inference result={result} />
    ) : result.kind === "capacity-estimate" ? (
      <Capacity result={result} />
    ) : result.kind === "report-pairing" ? (
      <Reports result={result} />
    ) : (
      <Parity result={result} />
    );
  return (
    <>
      {explanation}
      <p className="text-lg leading-relaxed">
        Displayed numbers are rounded. References and comparisons use full
        captured precision. The result tables preserve the captured values.
      </p>
    </>
  );
}
