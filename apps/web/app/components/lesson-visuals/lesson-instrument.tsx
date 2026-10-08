"use client";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { LessonVisualSpec } from "./deep-orbit-visuals";
import { TensorInvestigation } from "./tensor-investigation";
import { TensorFlowCode } from "../mdx/tensorflow-reference";
import {
  READING_VALUES,
  NORMALIZATION_ROWS,
  screening,
  gradientStep,
  trainingTrace,
  softmax,
  magnitudeSpectrum,
  teachingSignal,
  quantize,
  kalmanUpdate,
} from "./instrument-math";

const fmt = (n: number, digits = 2) => Number(n.toFixed(digits)).toString();
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const sage = "var(--tc-primary)";
const brass = "var(--iv-brass)";
const blue = "var(--iv-blue)";

function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  display?: string;
}) {
  const id = useId();
  return (
    <div className="iv-control">
      <div>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{display ?? fmt(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
function Choices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="iv-choices" role="group" aria-label={label}>
      {options.map((option, i) => (
        <button
          type="button"
          key={option}
          aria-pressed={value === i}
          onClick={() => onChange(i)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
function Readout({ children, code }: { children: ReactNode; code?: string }) {
  return (
    <div className="iv-readout">
      <div role="status" aria-live="polite" aria-atomic="true">
        {children}
      </div>
      {code && (
        <pre tabIndex={0} aria-label="JavaScript for this example">
          <code>
            <TensorFlowCode code={code} />
          </code>
        </pre>
      )}
    </div>
  );
}
function Grid({
  values,
  width,
  label,
  selected = -1,
  muted = false,
}: {
  values: number[];
  width: number;
  label: string;
  selected?: number;
  muted?: boolean;
}) {
  return (
    <div className="iv-tensor">
      <p>{label}</p>
      <div
        role="list"
        aria-label={label}
        className={`iv-cells ${muted ? "iv-cells-muted" : ""}`}
        style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      >
        {values.map((v, i) => (
          <span
            role="listitem"
            key={i}
            data-selected={i === selected || undefined}
          >
            {fmt(v)}
          </span>
        ))}
      </div>
    </div>
  );
}
interface Series {
  values: number[];
  color: string;
  label: string;
  dashed?: boolean;
}
function Plot({
  series,
  label,
  min,
  max,
  xLabel,
  yLabel,
  selected,
  xStart = "0",
  xEnd,
}: {
  series: Series[];
  label: string;
  min?: number;
  max?: number;
  xLabel: string;
  yLabel: string;
  selected?: number;
  xStart?: string;
  xEnd?: string;
}) {
  const all = series.flatMap((s) => s.values);
  const low = min ?? Math.min(...all),
    high = max ?? Math.max(...all);
  const spread = high - low || 1;
  const x = (i: number, count: number) =>
    44 + (i / Math.max(1, count - 1)) * 410;
  const y = (v: number) => 178 - ((v - low) / spread) * 142;
  return (
    <figure className="iv-plot">
      <div className="iv-legend">
        {series.map((s) => (
          <span key={s.label}>
            <i
              style={{
                background: s.color,
                borderRadius: s.dashed ? "50%" : 0,
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 480 246" role="img" aria-label={label}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <path d={`M44 ${36 + t * 142}H454`} className="iv-gridline" />
            <text x="36" y={41 + t * 142} textAnchor="end">
              {fmt(high - t * spread, 1)}
            </text>
          </g>
        ))}
        <text x="44" y="18">
          {yLabel}
        </text>
        <text x="44" y="211">
          {xStart}
        </text>
        <text x="454" y="211" textAnchor="end">
          {xEnd ?? String(Math.max(...series.map((s) => s.values.length)) - 1)}
        </text>
        <text x="249" y="240" textAnchor="middle">
          {xLabel}
        </text>
        {series.map((s) => (
          <polyline
            key={s.label}
            points={s.values
              .map((v, i) => `${x(i, s.values.length)},${y(v)}`)
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="3"
            strokeDasharray={s.dashed ? "6 5" : undefined}
          />
        ))}
        {selected !== undefined &&
          series.map((s) =>
            s.values[selected] === undefined ? null : (
              <g key={s.label}>
                <path
                  d={`M${x(selected, s.values.length)} 36V178`}
                  stroke={s.color}
                  strokeDasharray="3 6"
                  opacity=".5"
                />
                <circle
                  cx={x(selected, s.values.length)}
                  cy={y(s.values[selected]!)}
                  r="5"
                  fill={s.color}
                  stroke="var(--tc-surface)"
                  strokeWidth="2"
                />
              </g>
            ),
          )}
      </svg>
    </figure>
  );
}
function Bars({
  values,
  labels,
  title,
  second,
  secondLabel,
}: {
  values: number[];
  labels: string[];
  title: string;
  second?: number[];
  secondLabel?: string;
}) {
  const max = Math.max(
    1,
    ...values.map(Math.abs),
    ...(second ?? []).map(Math.abs),
  );
  return (
    <div
      className="iv-bars"
      role="img"
      aria-label={`${title}. ${labels.map((l, i) => `${l}: ${fmt(values[i]!)}${second ? `; ${secondLabel}: ${fmt(second[i]!)}` : ""}`).join(". ")}`}
    >
      <p>
        {title}
        {second && <span> / {secondLabel}</span>}
      </p>
      {values.map((v, i) => (
        <div className="iv-bar-row" key={i}>
          <span>{labels[i]}</span>
          <div>
            <i
              style={{
                width: `${(Math.abs(v) / max) * 100}%`,
                background: sage,
              }}
            />
            {second && (
              <i
                style={{
                  width: `${(Math.abs(second[i]!) / max) * 100}%`,
                  background: brass,
                }}
              />
            )}
          </div>
          <output>
            {fmt(v)}
            {second && ` / ${fmt(second[i]!)}`}
          </output>
        </div>
      ))}
    </div>
  );
}

function TensorInstrument({ mode }: { mode: string }) {
  const [option, setOption] = useState(0);
  const [correction, setCorrection] = useState(2),
    [batch, setBatch] = useState(0);
  let before = [...READING_VALUES],
    after: number[] = [],
    width = 3,
    code = "",
    note = "",
    label = "Tensor values";
  if (mode === "reshape") {
    after = before;
    width = [3, 2, 6][option]!;
    code = `const grid = tf.tensor1d(values).reshape([${6 / width}, ${width}]);\n// ${6 / width} rows × ${width} columns = 6 values`;
    note = `${6 / width} rows of ${width} values. Read across each row, then down. Reshape does not transpose the entries.`;
  }
  if (mode === "operations") {
    before = [2, 10, 4, 12, 6, 14];
    after = before.map((v, i) => ((v + [4, 8][i % 2]!) / 2) * correction);
    width = 2;
    label = "Boosted average: [3, 2]";
    code = `const merged = pass1.add(pass2).div(2);\nconst boosted = merged.mul(${correction});`;
    note = `The second pass [4, 8] broadcasts down the two columns. Their average is [3, 9], [4, 10], [5, 11]. Gain ${correction} scales that average without changing channel order.`;
  }
  if (mode === "batch") {
    before = Array.from({ length: 16 }, (_, i) => i);
    const order = [2, 0, 3, 1, 6, 4, 7, 5, 10, 8, 11, 9, 14, 12, 15, 13];
    const rows = order.slice(batch * 4, batch * 4 + 4);
    after = rows.flatMap((i) => [i * 100, i, i / 10]);
    width = 3;
    code =
      "const dataset = source.shuffle(10).batch(4);\n// xs shape [4, 3], ys shape [4, 1]";
    label = "One batch: amplitude, zero-crossing count, phase";
    note = `Rows ${rows.join(", ")} in one possible shuffle. Four samples, three features each. This is the exercise's 16-row stand-in; a different shuffle can group them differently.`;
  }
  if (mode === "normalize") {
    before = NORMALIZATION_ROWS.flat();
    after = before.map((v, i) =>
      option === 1
        ? (v - [23, 0.5][i % 2]!) / [Math.sqrt(5), Math.sqrt(0.05)][i % 2]!
        : option === 2
          ? (v - [20, 0.2][i % 2]!) / [6, 0.6][i % 2]!
          : v,
    );
    width = 2;
    label = [
      "Raw inputs",
      "Z-scores with saved statistics",
      "Min-max with saved bounds",
    ][option]!;
    code =
      option === 0
        ? "const scores = previewModel.predict(batch);\n// Raw inputs saturate this fixed neuron."
        : option === 2
          ? "const scaled = rows.sub(min).div(max.sub(min));"
          : "const scaled = rows.sub(mean).div(std);\n// Mean [23, 0.5], std [2.236…, 0.2236…]";
    const scores = NORMALIZATION_ROWS.map(
      (_, i) =>
        1 /
        (1 + Math.exp(-(0.9 * after[i * 2]! - 1.4 * after[i * 2 + 1]! - 0.3))),
    );
    note =
      option === 2
        ? "Each training column now spans 0 to 1. These are a different input contract from z-scores; do not switch a deployed model's scaler without evaluating it."
        : `Fixed-neuron scores: ${scores.map((v) => v.toFixed(3)).join(", ")}. The weights stay [0.9, -1.4] and bias -0.3; only the input scale changes.`;
  }
  return (
    <>
      <div className="iv-tensor-pair">
        <Grid
          values={before}
          width={
            mode === "reshape"
              ? 6
              : mode === "batch"
                ? 8
                : mode === "normalize" || mode === "operations"
                  ? 2
                  : 3
          }
          label={
            mode === "batch"
              ? "Archive row IDs (0–15), in recording order"
              : mode === "normalize"
                ? "Training batch: temperature, signal strength"
                : mode === "operations"
                  ? "Pass 1: three readings, two channels"
                  : "Input values"
          }
          muted
        />
        <span className="iv-transform" aria-hidden="true">
          ↓
        </span>
        <Grid values={after} width={width} label={label} />
      </div>
      {mode === "reshape" && (
        <Choices
          label="Tensor shape"
          options={["2 × 3", "3 × 2", "1 × 6"]}
          value={option}
          onChange={setOption}
        />
      )}
      {mode === "operations" && (
        <Range
          label="Gain on the merged passes"
          value={correction}
          min={0}
          max={3}
          step={0.5}
          onChange={setCorrection}
        />
      )}
      {mode === "batch" && (
        <Range
          label="Inspect batch"
          value={batch}
          min={0}
          max={3}
          display={`${batch + 1} of 4`}
          onChange={setBatch}
        />
      )}
      {mode === "normalize" && (
        <Choices
          label="Scaling"
          options={["Raw readings", "Z-score", "Min-max"]}
          value={option}
          onChange={setOption}
        />
      )}
      <Readout code={code}>{note}</Readout>
    </>
  );
}
function NeuronInstrument({ mode }: { mode: string }) {
  const [input, setInput] = useState(1),
    [fn, setFn] = useState(0);
  if (mode === "linear") {
    const output = 0.4 * input + 0.8 * -0.5 + 0.2;
    return (
      <>
        <svg
          className="iv-diagram"
          viewBox="0 0 480 230"
          role="img"
          aria-label={`Inputs 0.4 and 0.8, weights ${fmt(input)} and -0.5, bias 0.2. Output ${fmt(output)}.`}
        >
          <path
            d="M90 65L235 115M90 170L235 115M285 115H406"
            className="iv-wire"
          />
          <circle cx="65" cy="65" r="30" className="iv-node" />
          <circle cx="65" cy="170" r="30" className="iv-node" />
          <circle cx="260" cy="115" r="38" className="iv-node-active" />
          <text x="65" y="71" textAnchor="middle">
            0.4
          </text>
          <text x="65" y="176" textAnchor="middle">
            0.8
          </text>
          <text x="160" y="66" textAnchor="middle">
            × {fmt(input)}
          </text>
          <text x="160" y="183" textAnchor="middle">
            × −0.5
          </text>
          <text x="260" y="120" textAnchor="middle">
            sum
          </text>
          <text x="260" y="216" textAnchor="middle">
            bias +0.2
          </text>
          <text x="418" y="121" textAnchor="middle">
            {fmt(output)}
          </text>
        </svg>
        <Range
          label="First weight"
          value={input}
          min={-2}
          max={2}
          step={0.1}
          onChange={setInput}
        />
        <Readout
          code={`const output = 0.4 * ${fmt(input)} + 0.8 * -0.5 + 0.2;\n// ${fmt(output)}`}
        >
          The first contribution is {fmt(0.4 * input)}. The second is −0.4. Add
          bias 0.2 to get <strong>{fmt(output)}</strong>.
        </Readout>
      </>
    );
  }
  const names = ["ReLU", "Sigmoid", "Tanh"],
    functions = [
      (x: number) => Math.max(0, x),
      (x: number) => 1 / (1 + Math.exp(-x)),
      Math.tanh,
    ];
  const calculate = functions[fn]!;
  return (
    <>
      <Plot
        series={[
          {
            values: Array.from({ length: 61 }, (_, i) =>
              calculate((i - 30) / 10),
            ),
            color: sage,
            label: names[fn]!,
          },
        ]}
        label={`${names[fn]} activation curve. Input ${fmt(input)} produces ${fmt(calculate(input))}.`}
        xLabel="Input to activation"
        yLabel="Output"
        xStart="−3"
        xEnd="3"
        min={fn === 2 ? -1 : 0}
        max={fn === 0 ? 3 : 1}
        selected={Math.round(input * 10 + 30)}
      />
      <Choices
        label="Activation function"
        options={names}
        value={fn}
        onChange={setFn}
      />
      <Range
        label="Input"
        value={input}
        min={-3}
        max={3}
        step={0.1}
        onChange={setInput}
      />
      <Readout
        code={
          fn === 0
            ? `Math.max(0, ${fmt(input)})`
            : fn === 1
              ? `1 / (1 + Math.exp(-(${fmt(input)})))`
              : `Math.tanh(${fmt(input)})`
        }
      >
        {names[fn]}({fmt(input)}) = <strong>{fmt(calculate(input))}</strong>.{" "}
        {fn === 0
          ? "Negative inputs become zero; positive inputs pass through."
          : fn === 1
            ? "The output stays between 0 and 1."
            : "The output stays between −1 and 1."}
      </Readout>
    </>
  );
}
function NetworkInstrument({ mode }: { mode: string }) {
  const [width, setWidth] = useState(3),
    [step, setStep] = useState(0);
  const count = mode === "forward" ? 2 : width;
  const layers = [2, count, 1];
  const pos = (l: number, n: number) => ({
    x: 70 + l * 170,
    y: 115 + (n - (layers[l]! - 1) / 2) * 48,
  });
  return (
    <>
      <svg
        className="iv-diagram iv-network"
        viewBox="0 0 480 255"
        role="img"
        aria-label={`Network with two inputs, ${count} hidden units and one output. ${mode === "forward" ? `Forward pass at stage ${step + 1}.` : `${3 * count + count + 1} trainable parameters including biases.`}`}
      >
        {[0, 1].flatMap((l) =>
          Array.from({ length: layers[l]! }, (_, a) =>
            Array.from({ length: layers[l + 1]! }, (_, b) => {
              const p = pos(l, a),
                q = pos(l + 1, b);
              return (
                <line
                  key={`${l}-${a}-${b}`}
                  x1={p.x}
                  y1={p.y}
                  x2={q.x}
                  y2={q.y}
                  className="iv-wire"
                  opacity={mode === "forward" && step <= l ? 0.25 : 1}
                />
              );
            }),
          ),
        )}
        {layers.map((n, l) =>
          Array.from({ length: n }, (_, i) => {
            const p = pos(l, i);
            return (
              <g key={`${l}-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="20"
                  className={
                    mode === "forward" && l <= step
                      ? "iv-node-active"
                      : "iv-node"
                  }
                />
                <text x={p.x} y={p.y + 5} textAnchor="middle">
                  {mode === "forward" && l <= step
                    ? [[".5", "1"], [".6", ".4"], [".54"]][l]![i]
                    : ""}
                </text>
              </g>
            );
          }),
        )}
        {["Input [1, 2]", `Hidden [1, ${count}]`, "Output [1, 1]"].map(
          (l, i) => (
            <text key={l} x={70 + i * 170} y="235" textAnchor="middle">
              {l}
            </text>
          ),
        )}
      </svg>
      {mode === "forward" ? (
        <Choices
          label="Forward pass stage"
          options={["Input", "Hidden", "Output"]}
          value={step}
          onChange={setStep}
        />
      ) : (
        <Range
          label="Hidden units"
          value={width}
          min={2}
          max={4}
          onChange={setWidth}
        />
      )}
      <Readout
        code={
          mode === "forward"
            ? [
                "const x = [0.5, 1];",
                "const h = [Math.max(0, .5*.8 + 1*.2),\n           Math.max(0, .5*-.4 + 1*.6)];",
                "const y = .6 * .7 + .4 * .3; // 0.54",
              ][step]
            : `// Dense layers, with bias\nconst parameters = (2 + 1) * ${count} + (${count} + 1) * 1;\n// ${4 * count + 1}`
        }
      >
        {mode === "forward" ? (
          [
            "One example has two input features. The leading 1 is the batch size.",
            "The hidden units apply fixed weights and ReLU. Both biases are zero in this example.",
            "The linear output combines the hidden values into 0.54. No training occurred.",
          ][step]
        ) : (
          <>
            {count} hidden units need {3 * count} parameters. The output needs{" "}
            {count + 1}. Total: <strong>{4 * count + 1}</strong>.
          </>
        )}
      </Readout>
    </>
  );
}
function LossInstrument() {
  const [prediction, setPrediction] = useState(5);
  const targets = [2, 4, 6],
    predictions = [2, prediction, 5];
  const errors = predictions.map((p, i) => (p - targets[i]!) ** 2);
  return (
    <>
      <Bars
        values={targets}
        second={predictions}
        labels={["A", "B", "C"]}
        title="Target"
        secondLabel="Prediction"
      />
      <Range
        label="Prediction for B"
        value={prediction}
        min={0}
        max={8}
        step={0.25}
        onChange={setPrediction}
      />
      <Bars
        values={errors}
        labels={["A", "B", "C"]}
        title="Squared error by example"
      />
      <Readout
        code={`const errors = [0, ${fmt(errors[1]!)}, 1];\nconst mse = errors.reduce((a, b) => a + b, 0) / 3;`}
      >
        The total squared error is {fmt(sum(errors))}. Divide by three examples:
        MSE = <strong>{fmt(sum(errors) / 3)}</strong>.
      </Readout>
    </>
  );
}
function GradientInstrument({ mode }: { mode: string }) {
  const [rate, setRate] = useState(0.3),
    [weights, setWeights] = useState([0.5]),
    [weight, setWeight] = useState(1.5);
  if (mode === "chain") {
    const y = 2 * weight,
      loss = (y - 6) ** 2;
    return (
      <>
        <div className="iv-chain" aria-label="Forward calculation">
          <div>
            <small>Weight w</small>
            <strong>{fmt(weight)}</strong>
          </div>
          <span>× 2</span>
          <div>
            <small>Prediction y</small>
            <strong>{fmt(y)}</strong>
          </div>
          <span>(y − 6)²</span>
          <div>
            <small>Loss L</small>
            <strong>{fmt(loss)}</strong>
          </div>
        </div>
        <div className="iv-backward">
          <span>dL/dw = {fmt(4 * (y - 6))}</span>
          <span>← multiply ←</span>
          <span>dL/dy = {fmt(2 * (y - 6))}</span>
        </div>
        <Range
          label="Weight"
          value={weight}
          min={0}
          max={4}
          step={0.1}
          onChange={setWeight}
        />
        <Readout
          code={`// y = 2*w; L = (y - 6)**2\nconst dLdy = 2 * (${fmt(y)} - 6);\nconst dydw = 2;\nconst dLdw = dLdy * dydw; // ${fmt(4 * (y - 6))}`}
        >
          The local derivative dy/dw is 2. Multiply it by dL/dy to get the
          gradient <strong>{fmt(4 * (y - 6))}</strong>.
        </Readout>
      </>
    );
  }
  const w = weights[weights.length - 1]!;
  return (
    <>
      <Plot
        series={[
          {
            values: Array.from({ length: 61 }, (_, i) => (i / 10 - 3) ** 2),
            color: sage,
            label: "Loss (w − 3)²",
          },
        ]}
        label={`Quadratic loss minimized at weight 3. Current weight ${fmt(w)}, loss ${fmt((w - 3) ** 2)}.`}
        min={0}
        max={9}
        xLabel="Weight"
        yLabel="Loss"
        xEnd="6"
        selected={Math.round(w * 10)}
      />
      <Range
        label="Learning rate"
        value={rate}
        min={0.05}
        max={1.2}
        step={0.05}
        onChange={(v) => {
          setRate(v);
          setWeights([0.5]);
        }}
      />
      <div className="iv-actions">
        <button
          type="button"
          disabled={
            weights.length >= 5 ||
            Math.abs(gradientStep(w, rate)) > 6 ||
            gradientStep(w, rate) < 0
          }
          onClick={() => setWeights([...weights, gradientStep(w, rate)])}
        >
          Take a gradient step
        </button>
        <button type="button" onClick={() => setWeights([0.5])}>
          Reset
        </button>
      </div>
      <Readout
        code={`const gradient = 2 * (${fmt(w)} - 3);\nconst nextWeight = ${fmt(w)} - ${fmt(rate)} * gradient;\n// ${fmt(gradientStep(w, rate))}`}
      >
        Weight <strong>{fmt(w)}</strong>; loss{" "}
        <strong>{fmt((w - 3) ** 2)}</strong>.{" "}
        {weights.length > 1
          ? `Previous loss: ${fmt((weights[weights.length - 2]! - 3) ** 2)}.`
          : "The minimum is at weight 3."}{" "}
        {gradientStep(w, rate) > 6 || gradientStep(w, rate) < 0
          ? "The next step leaves this plot. Reset or lower the learning rate."
          : weights.length >= 5
            ? "Four steps shown. Reset to compare another rate."
            : ""}
      </Readout>
    </>
  );
}
function TrainingInstrument() {
  const [epoch, setEpoch] = useState(8);
  const row = trainingTrace[epoch]!,
    best = trainingTrace
      .slice(0, epoch + 1)
      .reduce((a, b) => (b.validation < a.validation ? b : a));
  return (
    <>
      <Plot
        series={[
          {
            values: trainingTrace.map((r) => r.train),
            color: sage,
            label: "Training",
          },
          {
            values: trainingTrace.map((r) => r.validation),
            color: brass,
            label: "Validation",
            dashed: true,
          },
        ]}
        label={`Illustrative loss trace. At epoch ${epoch}, training loss ${fmt(row.train, 3)}, validation loss ${fmt(row.validation, 3)}. Best validation so far at epoch ${best.epoch}.`}
        min={0}
        max={0.9}
        xLabel="Epoch"
        yLabel="Loss"
        selected={epoch}
      />
      <Range
        label="Inspect epoch"
        min={0}
        max={24}
        value={epoch}
        onChange={setEpoch}
      />
      <div className="iv-measures">
        <div>
          <span>Training loss</span>
          <strong>{fmt(row.train, 3)}</strong>
        </div>
        <div>
          <span>Validation loss</span>
          <strong>{fmt(row.validation, 3)}</strong>
        </div>
        <div>
          <span>Best epoch so far</span>
          <strong>{best.epoch}</strong>
        </div>
      </div>
      <Readout>
        The training curve keeps falling.{" "}
        {epoch === best.epoch
          ? "This is the lowest validation loss seen so far."
          : `Validation was better at epoch ${best.epoch}. The latest weights are not the best checkpoint so far.`}{" "}
        These curves are illustrative, not a live training run.
      </Readout>
    </>
  );
}
function EvaluationInstrument() {
  const [threshold, setThreshold] = useState(0.5),
    [selected, setSelected] = useState(2);
  const result = screening(threshold),
    c = result.cells[selected]!;
  const names: Record<string, string> = {
    TP: "Anomaly found",
    TN: "Normal cleared",
    FP: "False alarm",
    FN: "Anomaly missed",
  };
  return (
    <>
      <div
        className="iv-case-grid"
        role="group"
        aria-label="Inspect labeled teaching cases"
      >
        {result.cells.map((cell, i) => (
          <button
            type="button"
            key={i}
            className={`iv-case iv-case-${cell.category.toLowerCase()}`}
            aria-pressed={selected === i}
            aria-label={`Case ${i + 1}: ${names[cell.category]}`}
            onClick={() => setSelected(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{cell.category}</strong>
          </button>
        ))}
      </div>
      <div className="iv-case-legend">
        {Object.entries(names).map(([key, name]) => (
          <span key={key}>
            {key}: {name}
          </span>
        ))}
      </div>
      <Range
        label="Anomaly threshold"
        value={threshold}
        min={0.1}
        max={0.9}
        step={0.05}
        onChange={setThreshold}
      />
      <div className="iv-measures">
        <div>
          <span>False alarms</span>
          <strong>{result.fp}</strong>
        </div>
        <div>
          <span>Missed anomalies</span>
          <strong>{result.fn}</strong>
        </div>
        <div>
          <span>Correct / 12</span>
          <strong>{result.tp + result.tn}</strong>
        </div>
      </div>
      <Readout
        code={`const predictedAnomaly = ${c.score} >= ${fmt(threshold)};\n// ${c.predicted}`}
      >
        Case {selected + 1}: score {c.score}; known label{" "}
        <strong>{c.anomaly ? "anomaly" : "normal"}</strong>. At this threshold:{" "}
        <strong>{names[c.category].toLowerCase()}</strong>.
      </Readout>
    </>
  );
}
function SignalInstrument({ mode }: { mode: string }) {
  const [frequency, setFrequency] = useState(12),
    [amplitude, setAmplitude] = useState(0.6),
    [window, setWindow] = useState(4),
    [taper, setTaper] = useState(0);
  const signal = teachingSignal(
    mode === "window" ? 10.5 : frequency,
    amplitude,
    mode === "spectrogram" ? window * 8 : 0,
    mode === "window" && taper === 1,
    mode === "spectrogram",
  );
  const spectrum = magnitudeSpectrum(signal);
  const dominant = spectrum.reduce((a, v, i) => (v > spectrum[a]! ? i : a), 0);
  const frames =
    mode === "spectrogram"
      ? Array.from({ length: 9 }, (_, i) =>
          magnitudeSpectrum(teachingSignal(12, 0.6, i * 8, false, true)),
        )
      : [];
  return (
    <>
      {mode === "spectrogram" ? (
        <div
          className="iv-spectrogram"
          role="img"
          aria-label={`Spectrogram of nine overlapping windows. A 4 Hz tone persists; a 12 Hz tone starts at one second. Selected window starts at ${window / 8} seconds.`}
        >
          <div className="iv-spectro-axis">
            <span>32 Hz</span>
            <span>16</span>
            <span>0</span>
          </div>
          <div className="iv-spectro-grid">
            {Array.from({ length: 33 }, (_, row) =>
              frames.map((frame, col) => (
                <i
                  key={`${row}-${col}`}
                  data-window={window === col || undefined}
                  style={{
                    opacity: 0.13 + Math.min(1, frame[32 - row]!) * 0.87,
                  }}
                />
              )),
            )}
          </div>
          <span className="iv-spectro-caption">
            Window start: 0 to 1 s · lighter cells have greater magnitude
          </span>
        </div>
      ) : (
        <Plot
          series={[{ values: signal, color: blue, label: "Signal in time" }]}
          label={`Illustrative signal sampled at 64 Hz, combining 4 Hz and ${mode === "window" ? 10.5 : frequency} Hz tones.`}
          min={-1.7}
          max={1.7}
          xLabel="Time (seconds)"
          yLabel="Amplitude"
          xEnd="0.98"
        />
      )}
      <figure className="iv-spectrum">
        <svg
          viewBox="0 0 480 160"
          role="img"
          aria-label={`Magnitude spectrum. Largest bin is ${dominant} Hz, magnitude ${fmt(spectrum[dominant]!)}.`}
        >
          <path d="M40 128H455" className="iv-gridline" />
          <text x="40" y="19">
            Magnitude
          </text>
          {spectrum.map((m, i) => (
            <rect
              key={i}
              x={40 + i * 12.5}
              y={128 - Math.min(1.4, m) * 74}
              width="8"
              height={Math.min(1.4, m) * 74}
              fill={sage}
            />
          ))}
          <text x="40" y="152">
            0 Hz
          </text>
          <text x="240" y="152" textAnchor="middle">
            16
          </text>
          <text x="455" y="152" textAnchor="end">
            32 Hz
          </text>
        </svg>
      </figure>
      {mode === "views" && (
        <Range
          label="Second tone amplitude"
          value={amplitude}
          min={0}
          max={1}
          step={0.1}
          onChange={setAmplitude}
        />
      )}
      {(mode === "fourier" || mode === "features") && (
        <Range
          label="Second tone frequency (Hz)"
          value={frequency}
          min={6}
          max={24}
          step={2}
          onChange={setFrequency}
        />
      )}
      {mode === "spectrogram" && (
        <Range
          label="Inspect time window"
          value={window}
          min={0}
          max={8}
          onChange={setWindow}
        />
      )}
      {mode === "window" && (
        <Choices
          label="Window function"
          options={["Rectangular", "Hann taper"]}
          value={taper}
          onChange={setTaper}
        />
      )}
      <Readout
        code={
          mode === "features"
            ? `// Magnitude bins at 4, ${frequency}, 20 Hz\nconst features = [${[4, frequency, 20].map((i) => fmt(spectrum[i]!, 3)).join(", ")}];`
            : undefined
        }
      >
        {mode === "window"
          ? `${taper ? "Hann taper" : "Rectangular window"}: magnitude at 10 Hz is ${fmt(spectrum[10]!, 3)}. The 10.5 Hz tone falls between bins. Tapering reduces distant leakage and spreads the main peak; these magnitudes are not gain-corrected.`
          : mode === "spectrogram"
            ? `This window starts at ${window / 8} s. The 12 Hz component enters the signal at 1 s, so overlapping windows reveal it gradually.`
            : `The two component frequencies are 4 Hz and ${frequency} Hz. Their amplitudes are 1 and ${fmt(amplitude)}.`}{" "}
        This teaching signal uses 64 samples at 64 Hz, separate from the ship's
        sensor data.
      </Readout>
    </>
  );
}
const sequenceValues = [2, 4, 3, 6, 5, 8, 7, 9];
function SequenceInstrument({ mode }: { mode: string }) {
  const [step, setStep] = useState(0),
    [reverse, setReverse] = useState(0),
    [gate, setGate] = useState(0.75),
    [blend, setBlend] = useState(0.5);
  if (mode === "gates") {
    const retained = gate * 0.8,
      added = 0.4 * -0.2,
      memory = retained + added;
    return (
      <>
        <div className="iv-memory">
          <div>
            <span>Old memory</span>
            <strong>0.8</strong>
          </div>
          <span>× {fmt(gate)}</span>
          <div>
            <span>Retained</span>
            <strong>{fmt(retained)}</strong>
          </div>
          <span>+ (−0.08)</span>
          <div>
            <span>New memory</span>
            <strong>{fmt(memory)}</strong>
          </div>
        </div>
        <Range
          label="Forget gate"
          value={gate}
          min={0}
          max={1}
          step={0.05}
          onChange={setGate}
        />
        <Readout
          code={`const nextCell = ${fmt(gate)} * 0.8 + 0.4 * -0.2;\n// ${fmt(memory)}`}
        >
          The input gate is fixed at 0.4; its candidate is −0.2.{" "}
          {fmt(gate * 100)}% of the old cell value remains before the new
          contribution is added. A full LSTM also has an output gate.
        </Readout>
      </>
    );
  }
  if (mode === "ensemble") {
    const a = [8, 9, 11, 13],
      b = [9, 10, 10, 11],
      actual = [8.4, 9.2, 10.5, 11.8];
    const combined = a.map((v, i) => blend * v + (1 - blend) * b[i]!);
    const mae = sum(combined.map((v, i) => Math.abs(v - actual[i]!))) / 4;
    return (
      <>
        <Plot
          series={[
            { values: a, color: blue, label: "Forecast A", dashed: true },
            { values: b, color: brass, label: "Forecast B", dashed: true },
            { values: actual, color: "var(--tc-muted)", label: "Observed" },
            { values: combined, color: sage, label: "Combined" },
          ]}
          label={`Weighted ensemble. Weight on A ${fmt(blend)}. Mean absolute error ${fmt(mae)}.`}
          xLabel="Forecast horizon"
          yLabel="Value"
          xStart="1"
          xEnd="4"
        />
        <Range
          label="Weight on forecast A"
          min={0}
          max={1}
          step={0.05}
          value={blend}
          onChange={setBlend}
        />
        <Readout
          code={`const combined = a.map((v, i) => ${fmt(blend)} * v + ${fmt(1 - blend)} * b[i]);`}
        >
          Forecast B receives weight {fmt(1 - blend)}. Mean absolute error of
          this combination: <strong>{fmt(mae)}</strong>. The best weight on
          these four cases may not be best on future data.
        </Readout>
      </>
    );
  }
  if (mode === "forecast" || mode === "predict") {
    const observed = [8, 8.8, 10.1, 10.7, 11.7],
      forecast = [8];
    for (let i = 1; i < 5; i++) forecast.push(forecast[i - 1]! * 1.15 + 0.1);
    // Keep the common x domain by revealing observations and forecasts together.
    return (
      <>
        <Plot
          series={[
            { values: observed, color: blue, label: "Observed later" },
            {
              values: forecast,
              color: brass,
              label: "Illustrative forecast",
              dashed: true,
            },
          ]}
          label={`Recursive forecast. At horizon ${step}, predicted ${fmt(forecast[step]!)}, observed ${observed[step]}.`}
          xLabel="Steps after last observed input"
          yLabel="Reading"
          min={7}
          max={15}
          selected={step}
        />
        <Range
          label="Inspect forecast horizon"
          value={step}
          min={0}
          max={4}
          onChange={setStep}
        />
        <Readout
          code={`const next = previous * 1.15 + 0.1;\n// Fixed teaching rule; no model was trained here.`}
        >
          {step === 0 ? (
            "At horizon 0 the forecast starts from the observed value 8."
          ) : (
            <>
              At horizon {step}, prediction{" "}
              <strong>{fmt(forecast[step]!)}</strong> differs from observation{" "}
              {observed[step]} by{" "}
              <strong>{fmt(forecast[step]! - observed[step]!)}</strong>. The
              next input is this prediction.
            </>
          )}
        </Readout>
      </>
    );
  }
  const values = reverse ? [...sequenceValues].reverse() : sequenceValues;
  const states: number[] = [];
  values.forEach((x, i) =>
    states.push(Math.tanh(0.5 * (x / 10) + 0.7 * (i ? states[i - 1]! : 0))),
  );
  const selected = mode === "windows" ? step + 3 : step;
  return (
    <>
      <Plot
        series={[{ values, color: blue, label: "Readings in time order" }]}
        label={`Sequence ${values.join(", ")}. ${mode === "windows" ? `Input window ${values.slice(step, step + 3).join(", ")} predicts target ${values[step + 3]}.` : "Order is preserved."}`}
        xLabel="Time index"
        yLabel="Reading"
        selected={mode === "order" ? undefined : selected}
      />
      <div className="iv-sequence" role="list" aria-label="Sequence positions">
        {values.map((v, i) => (
          <span
            role="listitem"
            key={i}
            data-active={
              (mode === "windows" ? i >= step && i < step + 3 : i === step) ||
              undefined
            }
            data-target={(mode === "windows" && i === selected) || undefined}
          >
            <small>t{i}</small>
            <strong>{v}</strong>
          </span>
        ))}
      </div>
      {mode === "order" ? (
        <Choices
          label="Sequence order"
          options={["Original order", "Reverse order"]}
          value={reverse}
          onChange={setReverse}
        />
      ) : (
        <Range
          label={mode === "windows" ? "Window start" : "Current time index"}
          value={step}
          min={0}
          max={mode === "windows" ? 4 : 7}
          onChange={setStep}
        />
      )}
      <Readout
        code={
          mode === "windows"
            ? `const input = series.slice(${step}, ${step + 3});\nconst target = series[${step + 3}];`
            : mode === "rnn"
              ? `const h = Math.tanh(0.5 * ${values[step]! / 10} + 0.7 * ${fmt(step ? states[step - 1]! : 0, 3)});`
              : `const change = values.at(-1) - values[0];\n// ${values[7]! - values[0]!}`
        }
      >
        {mode === "windows" ? (
          <>
            Input [{values.slice(step, step + 3).join(", ")}] ends before target{" "}
            <strong>{values[step + 3]}</strong>. The outlined cell is the
            target.
          </>
        ) : mode === "rnn" ? (
          <>
            Input is scaled by 10 for this example. Previous state{" "}
            {fmt(step ? states[step - 1]! : 0, 3)} becomes{" "}
            <strong>{fmt(states[step]!, 3)}</strong> after reading{" "}
            {values[step]}.
          </>
        ) : (
          <>
            Total change: <strong>{values[7]! - values[0]!}</strong>. Reversing
            the same eight readings changes the direction of the trend.
          </>
        )}
      </Readout>
    </>
  );
}
function AttentionInstrument() {
  const [query, setQuery] = useState(0.8);
  const keys = [-1, -0.4, 0.2, 0.7, 1.2],
    values = [2, 7, 3, 8, 4],
    scores = keys.map((k) => query * k),
    weights = softmax(scores),
    context = sum(weights.map((w, i) => w * values[i]!));
  return (
    <>
      <div
        className="iv-attention"
        role="img"
        aria-label={`Five attention weights ${weights.map((w) => fmt(w, 3)).join(", ")}. Weighted value ${fmt(context)}.`}
      >
        {weights.map((w, i) => (
          <div key={i}>
            <span>t{i}</span>
            <div>
              <i style={{ height: `${w * 220}px` }} />
            </div>
            <strong>{fmt(w * 100, 1)}%</strong>
            <small>value {values[i]}</small>
          </div>
        ))}
      </div>
      <Range
        label="Scalar query"
        value={query}
        min={-2}
        max={2}
        step={0.1}
        onChange={setQuery}
      />
      <Readout
        code={`const scores = [${scores.map((v) => fmt(v)).join(", ")}];\nconst weights = softmax(scores);\nconst context = sum(weights.map((w, i) => w * values[i]));`}
      >
        Keys are [{keys.join(", ")}]. Similarity is query × key; softmax makes
        the weights sum to 1. The weighted summary is{" "}
        <strong>{fmt(context)}</strong>. This scalar example omits multi-head
        projections.
      </Readout>
    </>
  );
}
function KalmanInstrument() {
  const [noise, setNoise] = useState(4);
  const { gain, estimate, variance } = kalmanUpdate(10, 14, 4, noise);
  return (
    <>
      <svg
        className="iv-diagram"
        viewBox="0 0 480 220"
        role="img"
        aria-label={`Prediction 10, measurement 14, updated estimate ${fmt(estimate)}, Kalman gain ${fmt(gain)}.`}
      >
        <path d="M50 130H430" className="iv-wire" />
        {[8, 10, 12, 14, 16].map((v) => (
          <g key={v}>
            <path
              d={`M${50 + ((v - 8) / 8) * 380} 126v8`}
              className="iv-wire"
            />
            <text x={50 + ((v - 8) / 8) * 380} y="158" textAnchor="middle">
              {v}
            </text>
          </g>
        ))}
        <circle cx="145" cy="130" r="9" fill={blue} />
        <text x="145" y="95" textAnchor="middle">
          Prediction 10
        </text>
        <circle cx="335" cy="130" r="9" fill={brass} />
        <text x="335" y="95" textAnchor="middle">
          Measured 14
        </text>
        <path
          d={`M${50 + ((estimate - 8) / 8) * 380} 118v-64`}
          stroke={sage}
          strokeWidth="3"
        />
        <circle
          cx={50 + ((estimate - 8) / 8) * 380}
          cy="130"
          r="6"
          fill={sage}
        />
        <text x="240" y="33" textAnchor="middle">
          Updated estimate {fmt(estimate)}
        </text>
      </svg>
      <Range
        label="Measurement variance R"
        value={noise}
        min={0.5}
        max={16}
        step={0.5}
        onChange={setNoise}
      />
      <Readout
        code={`const gain = 4 / (4 + ${fmt(noise)});\nconst estimate = 10 + gain * (14 - 10);`}
      >
        Predicted variance P stays at 4. Gain <strong>{fmt(gain)}</strong> moves
        the estimate {fmt(gain * 100, 1)}% toward the measurement. Updated
        variance: {fmt(variance)}.
      </Readout>
    </>
  );
}
function AnomalyInstrument({ mode }: { mode: string }) {
  const [reading, setReading] = useState(
    mode === "baseline" || mode === "agreement" ? 13 : 6,
  );
  if (mode === "baseline" || mode === "agreement") {
    const z = Math.abs(reading - 10) / Math.sqrt(2),
      flags = [Math.abs(reading - 10) > 3, z > 2, reading < 7 || reading > 12];
    return (
      <>
        <svg
          className="iv-diagram"
          viewBox="0 0 480 210"
          role="img"
          aria-label={`Reference readings 8, 9, 10, 11, 12. Candidate ${reading}. Distance from mean 10 is ${fmt(Math.abs(reading - 10))}.`}
        >
          <path d="M40 125H440" className="iv-wire" />
          {[4, 6, 8, 10, 12, 14, 16].map((v) => (
            <text
              key={v}
              x={40 + ((v - 4) / 12) * 400}
              y="151"
              textAnchor="middle"
            >
              {v}
            </text>
          ))}
          {[8, 9, 10, 11, 12].map((v) => (
            <circle
              key={v}
              cx={40 + ((v - 4) / 12) * 400}
              cy="125"
              r="9"
              fill={blue}
            />
          ))}
          <path
            d={`M${40 + ((reading - 4) / 12) * 400} 65v48`}
            stroke={sage}
            strokeWidth="2"
          />
          <circle
            cx={40 + ((reading - 4) / 12) * 400}
            cy="62"
            r="9"
            fill={sage}
          />
          <text x="240" y="29" textAnchor="middle">
            Candidate {reading}
          </text>
          <text x="240" y="190" textAnchor="middle">
            Reference mean 10 · population variance 2
          </text>
        </svg>
        <Range
          label="Candidate reading"
          value={reading}
          min={4}
          max={16}
          step={0.5}
          onChange={setReading}
        />
        {mode === "agreement" && (
          <div className="iv-rule-results">
            {[
              "Distance > 3",
              "Standardized distance > 2",
              "Outside [7, 12]",
            ].map((rule, i) => (
              <p key={rule}>
                <span>{rule}</span>
                <strong>{flags[i] ? "Flag" : "Clear"}</strong>
              </p>
            ))}
          </div>
        )}
        <Readout>
          Distance from the reference mean:{" "}
          <strong>{fmt(Math.abs(reading - 10))}</strong>, or {fmt(z)} reference
          standard deviations.{" "}
          {mode === "agreement"
            ? "These three rules share the same underlying reading, so their agreement is correlated evidence."
            : "A changed operating condition could also move this reading. Review context before assigning a label."}
        </Readout>
      </>
    );
  }
  const input = [2, 3, reading, 5],
    latent = [(input[0]! + input[1]!) / 2, (input[2]! + input[3]!) / 2],
    rebuilt = [latent[0]!, latent[0]!, latent[1]!, latent[1]!],
    residuals = input.map((v, i) => (v - rebuilt[i]!) ** 2);
  return (
    <>
      {mode === "rebuild" && (
        <div className="iv-compression">
          <span>4 input values</span>
          <b>↓</b>
          <span>2 averages: [{latent.map((v) => fmt(v)).join(", ")}]</span>
          <b>↓</b>
          <span>4 reconstructed values</span>
        </div>
      )}
      <Bars
        values={input}
        second={rebuilt}
        labels={["A", "B", "C", "D"]}
        title="Input"
        secondLabel="Reconstruction"
      />
      <Range
        label="Input feature C"
        value={reading}
        min={0}
        max={10}
        step={0.5}
        onChange={setReading}
      />
      {mode === "error" && (
        <Bars
          values={residuals}
          labels={["A", "B", "C", "D"]}
          title="Squared residual by feature"
        />
      )}
      <Readout
        code={`const latent = [(x[0] + x[1]) / 2, (x[2] + x[3]) / 2];\nconst rebuilt = [latent[0], latent[0], latent[1], latent[1]];`}
      >
        Reconstruction MSE: <strong>{fmt(sum(residuals) / 4)}</strong>. This
        fixed averaging encoder/decoder makes information loss visible. A real
        autoencoder learns its encoding and decoding weights.
      </Readout>
    </>
  );
}
function PrecisionInstrument({ mode }: { mode: string }) {
  const [bits, setBits] = useState(3),
    [cutoff, setCutoff] = useState(0.2);
  const original = [-0.83, -0.31, -0.07, 0.14, 0.46, 0.91];
  const modified =
    mode === "quantize"
      ? quantize(original, bits)
      : original.map((w) => (Math.abs(w) < cutoff ? 0 : w));
  const error =
    sum(modified.map((v, i) => Math.abs(v - original[i]!))) / original.length;
  return (
    <>
      <Plot
        series={[
          { values: original, color: blue, label: "Original weights" },
          {
            values: modified,
            color: brass,
            label: mode === "quantize" ? "Rounded weights" : "Pruned weights",
            dashed: true,
          },
        ]}
        label={`${mode === "quantize" ? "Quantized" : "Pruned"} weights ${modified.map((v) => fmt(v)).join(", ")}.`}
        min={-1}
        max={1}
        xLabel="Weight index"
        yLabel="Weight"
      />
      {mode === "quantize" ? (
        <Range
          label="Bits per weight"
          value={bits}
          min={2}
          max={8}
          onChange={setBits}
        />
      ) : (
        <Range
          label="Magnitude cutoff"
          value={cutoff}
          min={0}
          max={1}
          step={0.05}
          onChange={setCutoff}
        />
      )}
      <Readout
        code={
          mode === "quantize"
            ? `const levels = 2 ** ${bits} - 1;\nconst rounded = Math.round((w + 1) / 2 * levels) / levels * 2 - 1;`
            : `const kept = Math.abs(w) < ${fmt(cutoff)} ? 0 : w;`
        }
      >
        {mode === "quantize" ? (
          <>
            {2 ** bits} equally spaced levels in [−1, 1]. Mean absolute weight
            error: <strong>{fmt(error, 4)}</strong>. This is a teaching
            quantizer, not a model accuracy measurement.
          </>
        ) : (
          <>
            <strong>{modified.filter((v) => v === 0).length} of 6</strong>{" "}
            weights become zero. Check model behavior before deciding whether
            those changes are acceptable.
          </>
        )}
      </Readout>
    </>
  );
}
function FlowInstrument({ spec }: { spec: LessonVisualSpec }) {
  const [selected, setSelected] = useState(0);
  const stages = spec.stages!,
    current = stages[selected]!;
  return (
    <>
      <ol className="iv-flow" aria-label="Inspect pipeline stages">
        {stages.map((stage, i) => (
          <li key={stage.name}>
            <button
              type="button"
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span aria-hidden="true">{i + 1}</span>
              <strong>{stage.name}</strong>
              <small>{stage.value}</small>
            </button>
          </li>
        ))}
      </ol>
      <div className="iv-stage-detail">
        <h3>{current.name}</h3>
        <Readout code={current.code}>{current.detail}</Readout>
      </div>
    </>
  );
}
export function LessonInstrument({ spec }: { spec: LessonVisualSpec }) {
  let content: ReactNode;
  switch (spec.kind) {
    case "tensor":
      if (spec.mode === "create") return <TensorInvestigation spec={spec} />;
      content = <TensorInstrument mode={spec.mode} />;
      break;
    case "neuron":
      content = <NeuronInstrument mode={spec.mode} />;
      break;
    case "network":
      content = <NetworkInstrument mode={spec.mode} />;
      break;
    case "loss":
      content = <LossInstrument />;
      break;
    case "gradient":
      content = <GradientInstrument mode={spec.mode} />;
      break;
    case "training":
      content = <TrainingInstrument />;
      break;
    case "evaluation":
      content = <EvaluationInstrument />;
      break;
    case "signal":
      content = <SignalInstrument mode={spec.mode} />;
      break;
    case "sequence":
      content = <SequenceInstrument mode={spec.mode} />;
      break;
    case "attention":
      content = <AttentionInstrument />;
      break;
    case "kalman":
      content = <KalmanInstrument />;
      break;
    case "anomaly":
      content = <AnomalyInstrument mode={spec.mode} />;
      break;
    case "precision":
      content = <PrecisionInstrument mode={spec.mode} />;
      break;
    case "flow":
      content = <FlowInstrument spec={spec} />;
      break;
  }
  return (
    <div
      className="lesson-instrument"
      data-no-swipe
      data-instrument={spec.kind}
      data-mode={spec.mode}
    >
      <p className="iv-instruction">{spec.action}</p>
      {content}
      <p className="iv-takeaway">{spec.takeaway}</p>
      <p className="iv-provenance">
        {spec.kind === "flow"
          ? "Illustrative handoff; code excerpts are not a live system run."
          : spec.kind === "tensor" && spec.mode === "create"
            ? "Runs with TensorFlow.js in your browser. Values are rounded for display."
            : "Practice data for this mechanism. Your challenge runs its own checks."}
      </p>
    </div>
  );
}
