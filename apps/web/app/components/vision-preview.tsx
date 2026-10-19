"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  NEON_PREVIEW_PREREQUISITES,
  TRANSFER_CAPABILITIES,
} from "@tensorcraft/shared";
import {
  VISION_KERNEL,
  visionFeatureMap,
  visionImage,
  type VisionPattern,
} from "@/lib/vision-preview";

const control =
  "min-h-11 min-w-0 max-w-full border border-border bg-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const show = (value: number) => Number(value.toFixed(3)).toString();

export function VisionPreview() {
  const id = useId();
  const [pattern, setPattern] = useState<VisionPattern>("vertical");
  const [brighter, setBrighter] = useState(false);
  const [column, setColumn] = useState(1);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const pixels = visionImage(pattern, brighter);
  const features = visionFeatureMap(pixels);
  const expected = features[1][column];
  function clear() {
    setAnswer("");
    setFeedback("");
  }
  return (
    <section
      id="vision-preview"
      aria-labelledby={`${id}-title`}
      data-testid="vision-preview"
      className="scroll-mt-24 min-w-0 break-words border border-border bg-surface p-4 sm:p-6 space-y-5"
    >
      <p className="font-mono text-xs uppercase tracking-wider text-primary">
        Free vision sample, full course coming later
      </p>
      <h2 id={`${id}-title`} className="text-2xl font-bold">
        Which edge does this filter see?
      </h2>
      <p className="leading-relaxed">
        A bright patch in a camera frame could be a doorway, a reflection, or a
        blank wall. Before a model can distinguish them, it needs features that
        describe local patterns. Here, a small grid of weights measures a change
        from dark to light across an image.
      </p>
      <p className="leading-relaxed">
        Each number is a grayscale intensity from 0 (black) to 1 (white).
        Multiply the nine pixels in the selected window by the nine kernel
        weights, then add. Sliding the same kernel across the image produces a
        feature map.
      </p>
      <details className="border border-border p-3">
        <summary className="cursor-pointer font-medium min-h-6">
          Returning from Deep Orbit, or already know the basics?
        </summary>
        <p className="mt-3">
          This sample needs array indexing and weighted sums. Continue directly
          if those are familiar. Review only the part you need:
        </p>
        <ul className="mt-2 space-y-2">
          {NEON_PREVIEW_PREREQUISITES.map((key) => (
            <li key={key}>
              <Link
                className="underline underline-offset-4"
                href={TRANSFER_CAPABILITIES[key].href}
              >
                {TRANSFER_CAPABILITIES[key].label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-text-muted">
          Spatial neighborhoods and shared kernel weights are the new idea.
          Evaluating a vision model brings new questions that the full course
          will cover.
        </p>
      </details>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          Image pattern
          <select
            className={control}
            value={pattern}
            onChange={(event) => {
              setPattern(event.target.value as VisionPattern);
              clear();
            }}
          >
            <option value="vertical">Dark left, bright right</option>
            <option value="reversed">Bright left, dark right</option>
            <option value="horizontal">Dark top, bright bottom</option>
            <option value="uniform">Uniform gray</option>
          </select>
        </label>
        <label className="grid gap-2">
          Window start column (middle output row)
          <select
            className={control}
            value={column}
            onChange={(event) => {
              setColumn(Number(event.target.value));
              clear();
            }}
          >
            {[0, 1, 2].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-3 min-h-11">
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={brighter}
          onChange={(event) => {
            setBrighter(event.target.checked);
            clear();
          }}
        />
        Add 0.1 brightness to every pixel
      </label>
      <p className="text-sm">
        Selected input: rows 1 to 3, columns {column} to {column + 2}. The
        outlined cells feed output [1, {column}]. Indices start at zero.
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div
          role="region"
          aria-label="Grayscale image table"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
        >
          <table className="w-full text-center font-mono text-sm border-collapse">
            <caption className="text-left mb-2 font-sans font-medium">
              Input: 5 × 5 pixels
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sr-only">
                  Row
                </th>
                {pixels[0].map((_, col) => (
                  <th scope="col" key={col} className="py-2">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pixels.map((row, r) => (
                <tr key={r}>
                  <th scope="row" className="px-1">
                    {r}
                  </th>
                  {row.map((value, c) => (
                    <td
                      key={c}
                      className="p-2 border-2"
                      style={{
                        background: `rgb(${value * 255} ${value * 255} ${value * 255})`,
                        color: value >= 0.5 ? "#111" : "#fff",
                        borderColor:
                          r >= 1 && r <= 3 && c >= column && c <= column + 2
                            ? "var(--tc-primary)"
                            : "var(--tc-border)",
                      }}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          role="region"
          aria-label="Kernel weights"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
        >
          <table className="w-full text-center font-mono text-sm border-collapse self-start">
            <caption className="text-left mb-2 font-sans font-medium">
              Kernel: left-to-right contrast (Sobel X)
            </caption>
            <tbody>
              {VISION_KERNEL.map((row, r) => (
                <tr key={r}>
                  {row.map((value, c) => (
                    <td key={c} className="p-3 border border-border">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!answer.trim() || !Number.isFinite(Number(answer))) {
            setFeedback("Enter a finite number, such as 0 or -2.8.");
            return;
          }
          setFeedback(
            Math.abs(Number(answer) - expected) < 0.001
              ? `Matched: output [1, ${column}] is ${show(expected)}.`
              : `Output [1, ${column}] is ${show(expected)}. Compare the products below, then try another window.`,
          );
        }}
      >
        <label className="grid gap-2" htmlFor={`${id}-answer`}>
          Predict output [1, {column}]
          <input
            id={`${id}-answer`}
            value={answer}
            maxLength={40}
            onChange={(event) => setAnswer(event.target.value)}
            className={`${control} w-full sm:max-w-64`}
            autoComplete="off"
          />
        </label>
        <button className={control} type="submit">
          Check this window
        </button>
      </form>
      <p role="status" aria-live="polite">
        {feedback}
      </p>
      {feedback && (
        <div className="space-y-4">
          <p className="font-mono text-sm break-words">
            {VISION_KERNEL.flatMap((row, r) =>
              row.map(
                (weight, c) => `${pixels[1 + r][column + c]} × (${weight})`,
              ),
            ).join(" + ")}{" "}
            = {show(expected)}
          </p>
          <div
            role="region"
            aria-label="Feature map values"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full text-center font-mono text-sm border-collapse">
              <caption className="text-left mb-2 font-sans font-medium">
                Feature map: 3 × 3 weighted sums
              </caption>
              <tbody>
                {features.map((row, r) => (
                  <tr key={r}>
                    {row.map((value, c) => (
                      <td
                        key={c}
                        className={`p-3 border border-border ${r === 1 && c === column ? "font-bold bg-surface-raised" : ""}`}
                      >
                        {show(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Positive values mean the right side is brighter under this kernel.
            Reversed contrast gives a negative response. A uniform patch gives
            zero because the weights sum to zero. A horizontal boundary also
            gives zero here: this kernel measures a particular direction.
          </p>
          <p>
            Try adding 0.1 to every pixel. These values stay in range without
            clipping, so the response stays the same. This does not establish
            invariance to arbitrary lighting changes.
          </p>
        </div>
      )}
      <details className="border border-border p-3">
        <summary className="cursor-pointer font-medium min-h-6">
          The JavaScript and TensorFlow.js connection
        </summary>
        <pre
          tabIndex={0}
          role="region"
          aria-label="Vision sample code"
          className="my-3 overflow-auto p-3 bg-code-bg text-sm"
        >
          <code>{`// One output at row r, column c:
let value = 0;
for (let kr = 0; kr < 3; kr++) {
  for (let kc = 0; kc < 3; kc++) {
    value += image[r + kr][c + kc] * kernel[kr][kc];
  }
}

// Equivalent feature map with TensorFlow.js imported as tf:
const values = tf.tidy(() => {
  const input = tf.tensor4d(image.flat(), [1, 5, 5, 1]);
  const filter = tf.tensor4d(kernel.flat(), [3, 3, 1, 1]);
  return Array.from(tf.conv2d(input, filter, 1, 'valid').dataSync());
});`}</code>
        </pre>
        <p>
          Stride 1 moves one pixel at a time. With no padding, a 3 × 3 kernel
          fits in three positions along each axis of a 5 × 5 image. CNN
          libraries call this convolution, although the unflipped-kernel
          operation is cross-correlation. This example keeps the same weights. A
          trained convolutional layer learns its weights.
        </p>
        <p className="mt-3">
          A feature response is not an object label or a probability. The full
          vision curriculum adds training, evaluation, boxes and masks. This
          isolated sample does not train a model or record course completion.
        </p>
      </details>
    </section>
  );
}
