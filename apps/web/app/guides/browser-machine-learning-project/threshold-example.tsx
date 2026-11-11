"use client";

import { useId, useState } from "react";
import preview from "@/public/assignments/room-project-preview.json";

export function ThresholdExample() {
  const id = useId();
  const [threshold, setThreshold] = useState(preview.threshold);
  const occupied = preview.prediction.score >= threshold;
  const recordedOccupied = preview.row.occupied === 1;
  const baselineOccupied = preview.row.light >= preview.baseline.threshold;
  return (
    <figure className="my-8 border-y border-border py-6">
      <figcaption className="max-w-3xl text-lg font-semibold">
        One validation reading where both policies were wrong
      </figcaption>
      <p className="mt-3 max-w-3xl leading-relaxed text-text-muted">
        This supplied score comes from our recorded demonstration. Changing the
        threshold applies a decision rule to that score. It does not retrain the
        model or evaluate the rest of the data.
      </p>
      <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3">
        <dt>Temperature</dt>
        <dd>{preview.row.temperature} °C</dd>
        <dt>Light</dt>
        <dd>{preview.row.light} lux</dd>
        <dt>CO₂</dt>
        <dd>{preview.row.co2.toFixed(1)} ppm</dd>
        <dt>Recorded label</dt>
        <dd>{recordedOccupied ? "Occupied" : "Unoccupied"}</dd>
        <dt>Supplied model score</dt>
        <dd>{preview.prediction.score.toFixed(3)}</dd>
        <dt>Rule: light ≥ {preview.baseline.threshold} lux</dt>
        <dd>
          {baselineOccupied ? "Occupied" : "Unoccupied"},{" "}
          {baselineOccupied === recordedOccupied ? "correct" : "incorrect"} on
          this row
        </dd>
      </dl>
      <div className="mt-8 max-w-2xl">
        <label htmlFor={id} className="font-medium">
          Model decision threshold: {threshold.toFixed(2)}
        </label>
        <input
          id={id}
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
          className="mt-3 min-h-11 w-full accent-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4"
        />
        <p role="status" className="mt-3 leading-relaxed">
          At threshold {threshold.toFixed(2)}, the model policy says{" "}
          {occupied ? "occupied" : "unoccupied"}.
          {occupied === recordedOccupied
            ? " It matches the recorded label on this one row."
            : " It disagrees with the recorded label."}{" "}
          The score stays {preview.prediction.score.toFixed(3)}.
        </p>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-muted">
        A matching label here does not establish a useful threshold. Choose a
        policy using validation data and the costs of missed occupancy and false
        alarms. Keep the final test period separate. This score is not a
        calibrated probability.
      </p>
    </figure>
  );
}
