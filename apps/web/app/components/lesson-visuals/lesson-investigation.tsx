"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnswerFeedback } from "@tensorcraft/ui/answer-feedback";
import {
  clampInvestigationValues,
  initialInvestigationValues,
  investigationControlMax,
  matchesInvestigationPrediction,
  type InvestigationResult,
  type LessonInvestigationSpec,
} from "./investigation-types";
import {
  formatInvestigationValue,
  InvestigationGraphic,
  investigationDomain,
} from "./investigation-graphic";

interface ExperimentRun {
  number: number;
  caseId: string;
  caseLabel: string;
  values: Record<string, number>;
  prediction: string;
  result: InvestigationResult;
}

function resultUnit(unit: string | undefined, value: number | string) {
  if (!unit) return "";
  const singular: Record<string, string> = {
    values: "value",
    files: "file",
    checks: "check",
    claims: "claim",
    records: "record",
    samples: "sample",
    frames: "frame",
    steps: "step",
    parts: "part",
    requirements: "requirement",
    alerts: "alert",
    "valid hits": "valid hit",
  };
  return ` ${Number(value) === 1 ? (singular[unit] ?? unit) : unit}`;
}

function sameInputs(
  run: ExperimentRun,
  caseId: string,
  values: Record<string, number>,
) {
  return (
    run.caseId === caseId &&
    Object.keys(values).length === Object.keys(run.values).length &&
    Object.entries(values).every(([key, value]) => run.values[key] === value)
  );
}

function RunResult({
  run,
  spec,
  label,
  pairedRun,
  feedbackId,
}: {
  run: ExperimentRun;
  spec: LessonInvestigationSpec;
  label: string;
  pairedRun?: ExperimentRun;
  feedbackId?: string;
}) {
  const titleId = useId();
  const hasPrediction = Boolean(run.prediction.trim());
  const matched =
    hasPrediction &&
    matchesInvestigationPrediction(
      run.prediction,
      run.result.answer,
      spec.prediction.tolerance,
    );
  // The first diagram is the input. Keep the remaining diagrams with this run.
  const graphics =
    run.result.graphics.length > 1
      ? run.result.graphics.slice(1)
      : run.result.graphics;
  return (
    <section className="orbit-investigation-run" aria-labelledby={titleId}>
      <div className="orbit-investigation-result-head">
        <h4 id={titleId}>{label}</h4>
        <p>
          {run.caseLabel} · Run {run.number}
        </p>
      </div>
      <dl className="orbit-investigation-run-values">
        {spec.controls.map((control) => (
          <div key={control.id}>
            <dt>{control.label}</dt>
            <dd>
              {control.kind === "choice"
                ? (control.options?.find(
                    (option) => option.value === run.values[control.id],
                  )?.label ?? formatInvestigationValue(run.values[control.id]!))
                : formatInvestigationValue(run.values[control.id]!)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="orbit-investigation-result-answer">
        <span>{run.result.answerLabel}</span>
        <strong>
          {formatInvestigationValue(run.result.answer)}
          {resultUnit(spec.prediction.unit, run.result.answer)}
        </strong>
      </p>
      <AnswerFeedback
        id={feedbackId}
        className="orbit-investigation-feedback"
        status={hasPrediction ? (matched ? "correct" : "incorrect") : "neutral"}
        title={hasPrediction ? undefined : "No prediction to check."}
        announce={false}
      >
        <p>
          {hasPrediction ? (
            <>
              You predicted {run.prediction}
              {resultUnit(spec.prediction.unit, run.prediction)}.
              {!matched &&
                " Compare your prediction with the result, then run again."}
            </>
          ) : (
            "You ran the experiment without making a prediction."
          )}
        </p>
      </AnswerFeedback>
      <div className="orbit-investigation-graphics">
        {graphics.map((graphic, index) => {
          const pairedGraphics =
            pairedRun?.result.graphics.length &&
            pairedRun.result.graphics.length > 1
              ? pairedRun.result.graphics.slice(1)
              : pairedRun?.result.graphics;
          const pairedGraphic = pairedGraphics?.[index];
          const inputGraphic = run.result.graphics[0];
          const pairedInput = pairedRun?.result.graphics[0];
          const domain =
            graphic.kind === "bars" || graphic.kind === "line"
              ? investigationDomain(
                  [graphic, pairedGraphic, inputGraphic, pairedInput].filter(
                    (item): item is NonNullable<typeof item> =>
                      Boolean(item && item.kind === graphic.kind),
                  ),
                )
              : undefined;
          return (
            <InvestigationGraphic
              key={`${graphic.label}-${index}`}
              graphic={graphic}
              domain={domain}
            />
          );
        })}
      </div>
      <p className="orbit-investigation-explanation">
        {run.result.explanation}
      </p>
      {run.result.code && (
        <details className="orbit-investigation-method">
          <summary>Read the code for this run</summary>
          <pre
            className="orbit-investigation-code"
            tabIndex={0}
            aria-label="Code for this run"
          >
            <code>{run.result.code}</code>
          </pre>
        </details>
      )}
    </section>
  );
}

export function LessonInvestigation({
  spec,
  lessonSlug,
}: {
  spec: LessonInvestigationSpec;
  lessonSlug: string;
}) {
  const id = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [caseId, setCaseId] = useState(spec.cases[0]!.id);
  const [values, setValues] = useState(() => initialInvestigationValues(spec));
  const [prediction, setPrediction] = useState("");
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [compare, setCompare] = useState(false);
  const [resetMessage, setResetMessage] = useState(false);
  const preview = useMemo(
    () => spec.evaluate(values, caseId),
    [spec, values, caseId],
  );
  const currentCase = spec.cases.find((item) => item.id === caseId)!;
  const latest = runs.at(-1);
  const previous = runs.at(-2);
  const inputsChanged = Boolean(latest && !sameInputs(latest, caseId, values));
  const predictionChanged = Boolean(latest && latest.prediction !== prediction);
  const dirty = inputsChanged || predictionChanged;
  const hasPrediction = Boolean(latest?.prediction.trim());
  const predictionMatched = Boolean(
    latest &&
    hasPrediction &&
    matchesInvestigationPrediction(
      latest.prediction,
      latest.result.answer,
      spec.prediction.tolerance,
    ),
  );
  const currentFeedback = Boolean(latest && !dirty);
  const predictionDescription = `${id}-prediction-help${currentFeedback ? ` ${id}-prediction-result` : ""}`;
  const predictionInvalid =
    currentFeedback && hasPrediction && !predictionMatched;
  const resultLabel = inputsChanged
    ? "Last run (inputs changed)"
    : predictionChanged
      ? "Last run (prediction changed)"
      : "What happened";
  const inputGraphic = preview.graphics[0];
  const inputDomain =
    latest &&
    !dirty &&
    inputGraphic &&
    (inputGraphic.kind === "bars" || inputGraphic.kind === "line")
      ? investigationDomain(
          [
            ...latest.result.graphics,
            ...(compare && previous ? previous.result.graphics : []),
          ].filter((graphic) => graphic.kind === inputGraphic.kind),
        )
      : undefined;
  const status = inputsChanged
    ? "Inputs changed. Run again to update the result. The last run below keeps its original inputs."
    : predictionChanged
      ? "Prediction changed. Run again to check it. The last run below keeps its original prediction."
      : latest
        ? `${hasPrediction ? (predictionMatched ? "Correct prediction. " : "Incorrect prediction. ") : "No prediction to check. "}Run ${latest.number} complete. ${latest.result.answerLabel}: ${formatInvestigationValue(latest.result.answer)}${resultUnit(spec.prediction.unit, latest.result.answer)}.`
        : resetMessage
          ? "Experiment reset. Choose your inputs and run again."
          : "Choose your inputs, then run the experiment.";

  const updateValue = (controlId: string, value: number) => {
    setValues((current) =>
      clampInvestigationValues(spec, { ...current, [controlId]: value }),
    );
    setResetMessage(false);
  };

  const runExperiment = () => {
    const result = spec.evaluate(values, caseId);
    setRuns((current) => [
      ...current.slice(-1),
      {
        number: (current.at(-1)?.number ?? 0) + 1,
        caseId,
        caseLabel: currentCase.label,
        values: { ...values },
        prediction,
        result,
      },
    ]);
    setResetMessage(false);
  };

  return (
    <section
      className="orbit-investigation"
      data-testid="lesson-investigation"
      data-lesson={lessonSlug}
      aria-labelledby={`${id}-title`}
    >
      <header className="orbit-investigation-header">
        <h3 id={`${id}-title`}>{spec.title}</h3>
        <p>{spec.brief}</p>
        <p className="orbit-investigation-boundary">{spec.boundary}</p>
      </header>
      <div className="orbit-investigation-layout">
        <form
          className="orbit-investigation-setup"
          onSubmit={(event) => {
            event.preventDefault();
            runExperiment();
          }}
        >
          <fieldset disabled={!ready} className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">Experiment controls</legend>
            <div className="orbit-investigation-case">
              <label htmlFor={`${id}-case`}>Choose an example</label>
              <select
                id={`${id}-case`}
                value={caseId}
                onChange={(event) => {
                  setCaseId(event.target.value);
                  setValues(
                    initialInvestigationValues(spec, event.target.value),
                  );
                  setPrediction("");
                  setResetMessage(false);
                }}
              >
                {spec.cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p>{currentCase.description}</p>
            </div>
            <div className="orbit-investigation-controls">
              {spec.controls.map((control) => (
                <div className="orbit-investigation-control" key={control.id}>
                  <div className="orbit-investigation-control-heading">
                    <label htmlFor={`${id}-control-${control.id}`}>
                      {control.label}
                    </label>
                    {control.kind === "range" && (
                      <output htmlFor={`${id}-control-${control.id}`}>
                        {formatInvestigationValue(values[control.id]!)}
                      </output>
                    )}
                  </div>
                  {control.kind === "choice" ? (
                    <select
                      id={`${id}-control-${control.id}`}
                      value={values[control.id]}
                      onChange={(event) =>
                        updateValue(control.id, Number(event.target.value))
                      }
                    >
                      {control.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`${id}-control-${control.id}`}
                      type="range"
                      min={control.min}
                      max={investigationControlMax(control, values)}
                      step={control.step ?? 1}
                      value={values[control.id]}
                      onChange={(event) =>
                        updateValue(control.id, Number(event.target.value))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="orbit-investigation-input">
              <h4>Current inputs</h4>
              {inputGraphic && (
                <InvestigationGraphic
                  graphic={inputGraphic}
                  domain={inputDomain}
                />
              )}
            </div>
            <div className="orbit-investigation-prediction">
              <label htmlFor={`${id}-prediction`}>
                {spec.prediction.prompt}
              </label>
              {spec.prediction.choices ? (
                <select
                  id={`${id}-prediction`}
                  value={prediction}
                  onChange={(event) => setPrediction(event.target.value)}
                  aria-describedby={predictionDescription}
                  aria-invalid={predictionInvalid || undefined}
                >
                  <option value="">Choose a prediction (optional)</option>
                  {spec.prediction.choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${id}-prediction`}
                  type="text"
                  inputMode={
                    typeof preview.answer === "number" ? "decimal" : "text"
                  }
                  placeholder={
                    spec.prediction.unit
                      ? `Your prediction (${spec.prediction.unit})`
                      : undefined
                  }
                  value={prediction}
                  onChange={(event) => setPrediction(event.target.value)}
                  aria-describedby={predictionDescription}
                  aria-invalid={predictionInvalid || undefined}
                  autoComplete="off"
                />
              )}
              <p id={`${id}-prediction-help`}>
                Make a prediction, or run the experiment to see the result.
              </p>
            </div>
            <div className="orbit-investigation-actions">
              <button type="submit">Run experiment</button>
              <button
                type="button"
                onClick={() => {
                  setCaseId(spec.cases[0]!.id);
                  setValues(initialInvestigationValues(spec));
                  setPrediction("");
                  setRuns([]);
                  setCompare(false);
                  setResetMessage(true);
                }}
              >
                Reset experiment
              </button>
            </div>
          </fieldset>
        </form>
        <div
          className="orbit-investigation-results"
          data-stale={dirty ? "true" : "false"}
        >
          <p
            className="orbit-investigation-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Experiment status"
          >
            {status}
          </p>
          {!latest && (
            <p className="orbit-investigation-empty">
              Your result will appear here. After two runs, you can compare what
              changed.
            </p>
          )}
          {latest && (
            <>
              {previous && (
                <button
                  type="button"
                  className="orbit-investigation-compare-toggle"
                  aria-pressed={compare}
                  onClick={() => setCompare((current) => !current)}
                >
                  Compare with previous run
                </button>
              )}
              {!(compare && previous) && (
                <RunResult
                  run={latest}
                  spec={spec}
                  label={resultLabel}
                  feedbackId={
                    currentFeedback ? `${id}-prediction-result` : undefined
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
      {compare && previous && latest && (
        <div className="orbit-investigation-comparison">
          <RunResult
            run={previous}
            spec={spec}
            label="Previous run"
            pairedRun={latest}
          />
          <RunResult
            run={latest}
            spec={spec}
            label={dirty ? resultLabel : "Latest run"}
            pairedRun={previous}
            feedbackId={currentFeedback ? `${id}-prediction-result` : undefined}
          />
        </div>
      )}
    </section>
  );
}

export function BriefingInvestigationVisual({
  spec,
}: {
  spec: LessonInvestigationSpec;
}) {
  const values = initialInvestigationValues(spec);
  const result = spec.evaluate(values, spec.cases[0]!.id);
  const first = result.graphics[0];
  const last = result.graphics.at(-1);
  const sharedDomain =
    first &&
    last &&
    first.kind === last.kind &&
    (first.kind === "bars" || first.kind === "line")
      ? investigationDomain([first, last])
      : undefined;
  return (
    <div className="orbit-investigation-briefing-visual">
      {first && (
        <div className="orbit-investigation-briefing-figure">
          <InvestigationGraphic graphic={first} domain={sharedDomain} />
        </div>
      )}
      {last && last !== first && (
        <div className="orbit-investigation-briefing-figure">
          <InvestigationGraphic graphic={last} domain={sharedDomain} />
        </div>
      )}
    </div>
  );
}
