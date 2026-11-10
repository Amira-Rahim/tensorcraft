"use client";

import { useId, useState } from "react";
import { ExerciseOutput } from "@tensorcraft/ui";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { CourseResultExplanation } from "./course-result-explanation";
import { TrainingResultExplanation } from "./training-result-explanation";
import { RuntimeResultExplanation } from "./runtime-result-explanation";
import type {
  LessonResultExplanation as Explanation,
  SensorResult,
  GradientResult,
  DenseForwardResult,
} from "@/lib/lesson-result-explanations";

const control =
  "relative min-h-11 min-w-0 max-w-full border border-border bg-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-interactive";
const number = (value: number) => Number(value.toPrecision(7)).toString();

function SensorExplanation({
  result,
  sensor,
  moment,
  select,
}: {
  result: SensorResult;
  sensor: number;
  moment: number;
  select: (sensor: number, moment: number) => void;
}) {
  const uid = useId();
  const captured = result.series[sensor]!.values[moment]!;
  const source = result.sourceRows[moment]![sensor]!;
  const position = moment * result.sensors.length + sensor;
  return (
    <>
      <h3 className="text-2xl font-semibold">A reading from source to chart</h3>
      <p className="text-lg leading-relaxed">
        Demir’s fictional recording: sensors A-D at three selected moments, in
        the header’s sensor order.
      </p>
      <p className="text-lg leading-relaxed">
        {result.operation === "create"
          ? "The supplied chart code groups the readings into one line per sensor. Compare the captured values with Demir’s recording."
          : "The chart uses one row of your bySensor result per sensor. Check a reading against its original position."}
      </p>
      <div className="flex flex-wrap gap-4">
        <label htmlFor={`${uid}-sensor`} className="grid gap-2">
          Sensor
          <select
            id={`${uid}-sensor`}
            className={control}
            value={sensor}
            onChange={(event) => select(Number(event.target.value), moment)}
          >
            {result.sensors.map((name, i) => (
              <option key={name} value={i}>
                Sensor {name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${uid}-moment`} className="grid gap-2">
          Selected moment
          <select
            id={`${uid}-moment`}
            className={control}
            value={moment}
            onChange={(event) => select(sensor, Number(event.target.value))}
          >
            {result.labels.map((label, i) => (
              <option key={label} value={i}>
                Moment {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ol
        aria-label="Supplied recording in flat order"
        className="grid grid-cols-4 gap-2 !list-none !p-0"
      >
        {result.sourceRows.flatMap((row, time) =>
          row.map((value, column) => (
            <li
              key={time * result.sensors.length + column}
              className="!m-0 min-w-0"
            >
              <button
                type="button"
                aria-pressed={time === moment && column === sensor}
                onClick={() => select(column, time)}
                className={`${control} grid w-full gap-1 !px-1 text-center ${time === moment && column === sensor ? "!bg-primary/10 !border-primary" : ""}`}
              >
                <span className="text-sm">
                  {result.sensors[column]} at {time + 1}
                </span>
                <strong className="font-mono">{number(value)}</strong>
                <span className="sr-only">
                  , flat index {time * result.sensors.length + column}
                </span>
              </button>
            </li>
          )),
        )}
      </ol>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-lg">
        <div>
          <dt className="text-text-secondary">Value in supplied recording</dt>
          <dd className="font-mono">{number(source)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Value in captured chart</dt>
          <dd className="font-mono">{number(captured)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Index in supplied flat list</dt>
          <dd className="font-mono">{position}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            Position in captured chart data
          </dt>
          <dd>
            Sensor row {sensor}, moment column {moment}
          </dd>
        </div>
      </dl>
      <p role="status" className="text-lg leading-relaxed">
        Sensor {result.sensors[sensor]} at selected moment {moment + 1}: the run
        reports {number(captured)}.{" "}
        {Math.abs(captured - source) <= 1e-6
          ? "It matches the supplied reading."
          : "It differs from the supplied reading. Check the grouping before using this line."}{" "}
        All indexes start at 0.
      </p>
    </>
  );
}

function GradientExplanation({ result }: { result: GradientResult }) {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const variable = result.variables[selected]!;
  const difference = Math.abs(variable.automatic - variable.numerical);
  return (
    <>
      <h3 className="text-2xl font-semibold">
        Two methods on the same supplied loss
      </h3>
      <p className="text-lg leading-relaxed">
        These captures compare your functions on the supplied three-variable
        test loss. They report gradients and the number of times each method
        calculates that loss.
      </p>
      <label htmlFor={`${uid}-variable`} className="grid gap-2">
        Variable
        <select
          id={`${uid}-variable`}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.variables.map((row, i) => (
            <option key={row.name} value={i}>
              {row.name}
            </option>
          ))}
        </select>
      </label>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-lg">
        <div>
          <dt className="text-text-secondary">Captured automatic gradient</dt>
          <dd className="font-mono">{number(variable.automatic)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Captured numerical estimate</dt>
          <dd className="font-mono">{number(variable.numerical)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            Automatic forward calculations
          </dt>
          <dd className="font-mono">{result.automaticCalls}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            Numerical forward calculations
          </dt>
          <dd className="font-mono">{result.numericalCalls}</dd>
        </div>
      </dl>
      <p role="status" className="text-lg leading-relaxed">
        For {variable.name}, the captured estimates differ by{" "}
        {Number.isFinite(difference)
          ? number(difference)
          : "more than JavaScript can represent as a finite number"}
        . The step size and rounding can affect numerical estimates. Automatic
        differentiation calculates gradients. Applying them is a separate weight
        update. Numerical estimation temporarily changes a variable and must
        restore it afterward. Gradient values alone cannot confirm that
        restoration.
      </p>
    </>
  );
}

function DenseForwardExplanation({ result }: { result: DenseForwardResult }) {
  const uid = useId();
  const [row, setRow] = useState(0);
  const [unit, setUnit] = useState(0);
  const reading = result.readings[row]!;
  const terms = reading.inputs.map(
    (input, index) => input * result.kernel[index]![unit]!,
  );
  const bias = result.bias[unit]!;
  const sum = terms[0]! + terms[1]! + bias;
  const captured = reading.outputs[unit]!;
  const difference = Math.abs(sum - captured);
  const calculated = (value: number) =>
    Number.isFinite(value)
      ? number(value)
      : "Outside JavaScript’s finite number range";
  return (
    <>
      <h3 className="text-2xl font-semibold">
        One output from this forward pass
      </h3>
      <p className="text-lg leading-relaxed">
        This view uses the input rows, weights, bias, and outputs captured in
        this run’s two-input, three-unit comparison. Select one output to follow
        its calculation. Random starting weights can change on another run.
      </p>
      <div className="flex flex-wrap gap-4">
        <label htmlFor={`${uid}-reading`} className="grid gap-2">
          Reading
          <select
            id={`${uid}-reading`}
            className={control}
            value={row}
            onChange={(event) => setRow(Number(event.target.value))}
          >
            {result.readings.map((reading, index) => (
              <option key={reading.id} value={index}>
                Reading {reading.id}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${uid}-unit`} className="grid gap-2">
          Output unit
          <select
            id={`${uid}-unit`}
            className={control}
            value={unit}
            onChange={(event) => setUnit(Number(event.target.value))}
          >
            {[0, 1, 2].map((index) => (
              <option key={index} value={index}>
                Unit {index + 1}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ol
        className="grid gap-4 !list-none !p-0"
        aria-label="Captured inputs and their contributions"
      >
        {reading.inputs.map((input, index) => (
          <li key={index} className="!m-0 border border-border p-4 text-lg">
            Input {index + 1}: {number(input)} times captured weight{" "}
            {number(result.kernel[index]![unit]!)} gives{" "}
            <strong>{calculated(terms[index]!)}</strong>.
          </li>
        ))}
      </ol>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-lg">
        <div>
          <dt className="text-text-secondary">Captured bias</dt>
          <dd className="font-mono">{number(bias)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">
            Sum of captured terms and bias
          </dt>
          <dd className="font-mono">{calculated(sum)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Captured output</dt>
          <dd className="font-mono">{number(captured)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Difference from that sum</dt>
          <dd className="font-mono">{calculated(difference)}</dd>
        </div>
      </dl>
      <p role="status" className="text-lg leading-relaxed">
        Reading {reading.id}, unit {unit + 1}: the run reports{" "}
        {number(captured)}. The calculation above uses JavaScript numbers.
        TensorFlow.js can round intermediate values. This comparison checks the
        layer’s arithmetic. Prediction accuracy needs labeled evaluation data.
      </p>
    </>
  );
}

export function LessonResultExplanation({
  result,
  artifacts,
  stale,
  complete,
  scopeLabel,
}: {
  result: Explanation;
  artifacts: ExerciseArtifact[];
  stale: boolean;
  complete: boolean;
  scopeLabel?: string;
}) {
  const [sensor, setSensor] = useState(0);
  const [moment, setMoment] = useState(0);
  const [chartSensor, setChartSensor] = useState<number | null>(0);
  const select = (nextSensor: number, nextMoment: number) => {
    setSensor(nextSensor);
    setMoment(nextMoment);
    setChartSensor(nextSensor);
  };
  return (
    <section
      aria-label={
        scopeLabel
          ? `${scopeLabel}: explanation of your captured result`
          : "Explanation of your captured result"
      }
      className="my-8 grid min-w-0 gap-6 text-text-primary"
    >
      {stale && (
        <p className="text-lg text-warning">
          The editor has changed. This explanation belongs to the submitted
          code.
        </p>
      )}
      {result.kind === "spectrogram-frames" ||
      result.kind === "spectrum-peak" ||
      result.kind === "composition-output" ||
      result.kind === "model-card-output" ? (
        <CourseResultExplanation result={result} />
      ) : result.kind === "sensor-layout" ? (
        <SensorExplanation
          result={result}
          sensor={sensor}
          moment={moment}
          select={select}
        />
      ) : result.kind === "gradient-comparison" ? (
        <GradientExplanation result={result} />
      ) : result.kind === "dense-forward" ? (
        <DenseForwardExplanation result={result} />
      ) : result.kind === "loss-comparison" ||
        result.kind === "scalar-updates" ||
        result.kind === "training-history" ? (
        <TrainingResultExplanation result={result} />
      ) : (
        <RuntimeResultExplanation result={result} />
      )}
      <ExerciseOutput
        outputLabel={
          scopeLabel ? `${scopeLabel}: output from your code` : undefined
        }
        artifacts={artifacts}
        stale={stale}
        complete={complete}
        seriesSelection={
          result.kind === "sensor-layout"
            ? { artifactIndex: result.artifactIndex, seriesIndex: chartSensor }
            : undefined
        }
        onSeriesSelect={(index, selected) => {
          if (result.kind !== "sensor-layout" || index !== result.artifactIndex)
            return;
          setChartSensor(selected);
          if (selected !== null) setSensor(selected);
        }}
      />
    </section>
  );
}
