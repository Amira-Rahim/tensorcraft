"use client";
import { useId, useState } from "react";
import type { CourseResult } from "@/lib/course-result-explanations";
import {
  CAPSTONE_ASYNC_WINDOW,
  compositionReference,
  CARD_RECALL,
} from "./lesson-visuals/capstone-investigations";
const control =
  "w-full min-w-0 min-h-11 max-w-full border border-border bg-background p-2 text-base text-text-primary";
const number = (v: number) => Number(v.toPrecision(7)).toString();
export function CourseResultExplanation({ result }: { result: CourseResult }) {
  const id = useId(),
    [selected, setSelected] = useState(0);
  if (result.kind === "spectrogram-frames") {
    const frame = Math.min(selected, result.values.length - 1),
      start = Number(result.labels[frame]);
    return (
      <>
        <h3 className="text-2xl font-semibold">
          The captured tone in one frame
        </h3>
        <p>
          This result captures one magnitude from each returned spectrum. Select
          a frame to inspect your 40 Hz value and its position in the supplied
          synthetic burst.
        </p>
        <label htmlFor={id} className="grid min-w-0 gap-2">
          Captured frame
          <select
            id={id}
            className={control}
            value={frame}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {result.labels.map((label, i) => (
              <option key={i} value={i}>
                Frame {i + 1}, starts at {label} s
              </option>
            ))}
          </select>
        </label>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt>Captured raw magnitude at 40 Hz</dt>
            <dd className="font-mono">{number(result.values[frame]!)}</dd>
          </div>
          <div>
            <dt>Supplied frame interval</dt>
            <dd className="font-mono">
              {start} to {start + 0.25} s, end excluded
            </dd>
          </div>
          <div>
            <dt>Supplied sample positions</dt>
            <dd className="font-mono">
              {frame * 64} through {frame * 64 + 63}
            </dd>
          </div>
          <div>
            <dt>Reference tone in this frame</dt>
            <dd>
              {frame === 1
                ? "40 Hz burst present"
                : "Outside the supplied burst"}
            </dd>
          </div>
        </dl>
        <p>
          The declared fixture has 256 samples at 256 Hz. It places a 40 Hz
          burst at sample positions 64 through 127. Rectangular frames contain
          64 samples and advance by 64, giving 4 Hz bin spacing. The captured
          value comes from bin 10. The source samples and other spectrum bins
          are absent from this capture. The ordinary chart below preserves your
          four actual returned values.
        </p>
      </>
    );
  }
  if (result.kind === "spectrum-peak")
    return (
      <>
        <h3 className="text-2xl font-semibold">
          The returned frequency and its bin
        </h3>
        <p>
          The supplied synthetic probe has {result.samples} samples at{" "}
          {result.sampleRate} Hz. It lasts one second. The capture reports bin
          spacing {number(result.spacing)} Hz and your returned frequency{" "}
          {number(result.frequency)} Hz.
        </p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt>Returned frequency divided by bin spacing</dt>
            <dd className="font-mono">
              {number(result.frequency / result.spacing)}
            </dd>
          </div>
          <div>
            <dt>Eligible bin centers</dt>
            <dd className="font-mono">1 through 64 Hz</dd>
          </div>
        </dl>
        <p>
          This probe supplies a 5 Hz tone. Dividing a returned frequency by the
          spacing identifies its bin position. The capture contains no full
          spectrum, so it cannot show the magnitudes your implementation
          searched. Excluding DC and keeping the first eligible tie belong to
          the exercise rule. This one-second probe differs from the mission’s
          73.4 Hz signal.
        </p>
      </>
    );
  if (result.kind === "composition-output") {
    const position = Math.min(selected, result.values.length - 1),
      actual = result.values[position]!,
      reference = compositionReference(CAPSTONE_ASYNC_WINDOW).magnitudes[
        position
      ]!;
    return (
      <>
        <h3 className="text-2xl font-semibold">
          A magnitude delivered through your pipeline
        </h3>
        <p>
          The capture contains the actual five values read from the final tensor
          in the supplied eight-sample composition probe.
        </p>
        <label htmlFor={id} className="grid min-w-0 gap-2">
          FFT bin
          <select
            id={id}
            className={control}
            value={position}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {result.values.map((_, i) => (
              <option key={i} value={i}>
                Bin {i}
              </option>
            ))}
          </select>
        </label>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt>Captured magnitude</dt>
            <dd className="font-mono">{number(actual)}</dd>
          </div>
          <div>
            <dt>JavaScript reference magnitude</dt>
            <dd className="font-mono">{number(reference)}</dd>
          </div>
          <div>
            <dt>Difference at full captured precision</dt>
            <dd className="font-mono">{number(actual - reference)}</dd>
          </div>
        </dl>
        <p>
          The recorded async-middle probe supplies [0.4, 1.2, 0.4, 1.2, 0.4,
          1.2, 0.4, 1.2]. Its reference centers that window and divides by its
          population standard deviation plus 1e-8, then computes the real FFT
          magnitudes. It does not observe your intermediate stages. TFJS float32
          arithmetic can round differently. Displayed numbers are rounded, and
          the comparison uses full captured precision. These positions are bins
          because the fixture supplies no sample rate. This result checks
          composition and leaves the full branch scheduler and production model
          contract separate.
        </p>
      </>
    );
  }
  const line = Math.min(selected, result.lines.length - 1),
    text = result.lines[line]!;
  const worst = Object.entries(CARD_RECALL).reduce((a, b) =>
    b[1] < a[1] ? b : a,
  );
  let reference =
    "This line belongs to your returned string. Check its section and wording against the supplied metadata and required format.";
  if (text.includes("Accuracy:"))
    reference =
      "The supplied accuracy fraction is 0.918. Multiplying by 100 and keeping one decimal gives 91.8%. Its evaluation context is the pruning review.";
  else if (text.includes("Lowest recall:"))
    reference = `The supplied class recalls are pulsar 0.96, noise 0.95, quasar 0.94, interference 0.90 and anomaly 0.84. The minimum is ${worst[0]}, formatted as ${(worst[1] * 100).toFixed(1)}%. Find the minimum again for another metadata record.`;
  else if (text.includes("Size:"))
    reference =
      "The metadata supplies 3988 weight-file bytes. Other download assets are outside this count.";
  else if (text.includes("Inference:"))
    reference =
      "The metadata supplies a 0.035 ms classifier duration. It records no whole-pipeline timing or device protocol.";
  else if (text.includes("Input:"))
    reference =
      "The metadata requires Float32Array(64): 64 signal samples, separate from the archive’s 64 sensor channels.";
  else if (text.includes("Output:"))
    reference =
      "The supplied output format is { label, confidence }. Its score needs separate calibration and accuracy review.";
  return (
    <>
      <h3 className="text-2xl font-semibold">
        A line from your generated handover card
      </h3>
      <p>
        Select a line in the actual string your function returned. Its supplied
        fictional metadata remains a separate reference.
      </p>
      <label htmlFor={id} className="grid min-w-0 gap-2">
        Card line
        <select
          id={id}
          className={control}
          value={line}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {result.lines.map((value, i) => (
            <option key={i} value={i}>
              Line {i + 1}: {value.slice(0, 70) || "Blank line"}
            </option>
          ))}
        </select>
      </label>
      <pre
        className="min-w-0 whitespace-pre-wrap break-words border border-border bg-surface-raised p-4 font-mono"
        aria-label="Selected captured card line"
      >
        {text || "Blank line"}
      </pre>
      <p role="status" aria-label="Selected card line reference">
        {reference}
      </p>
      <p>
        Formatting a card does not verify its claims or evaluate a new sensor.
        Farah still needs the source records and an operator-reviewed runbook.
      </p>
    </>
  );
}
