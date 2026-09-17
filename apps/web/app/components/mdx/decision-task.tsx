"use client";
import { useEffect, useId, useState } from "react";
import {
  DECISIONS,
  checkDecision,
  decisionDraft,
  parseDecision,
  readyToSubmit,
  type DecisionDraft,
} from "./decision-task-data";
const button =
  "rounded border border-interactive px-3 py-2 text-sm hover:bg-surface disabled:opacity-50 focus-visible:outline focus-visible:outline-2";
export function DecisionTask({ id }: { id: string }) {
  // A keyed child keeps stored attempts separate when MDX navigation reuses a slot.
  return DECISIONS[id] ? <DecisionTaskBody key={id} id={id} /> : null;
}
function DecisionTaskBody({ id }: { id: string }) {
  const uid = useId(),
    spec = DECISIONS[id],
    key = `tensorcraft:decision:v1:${id}`;
  const [draft, setDraft] = useState<DecisionDraft>(() => decisionDraft(id));
  const [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) setDraft(parseDecision(raw, id));
    } catch {
      setError(
        "The previous draft could not be loaded. Start a new attempt and download a copy.",
      );
    }
    setReady(true);
  }, [id, key]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, key, ready]);
  const attempt = draft.attempts.at(-1),
    result = attempt ? checkDecision(id, attempt) : null;
  const edit = (
    field: "calculation" | "rationale" | "help" | "minutes",
    value: string,
  ) => setDraft((d) => ({ ...d, [field]: value }));
  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="my-8 space-y-4 rounded border border-border bg-surface/40 p-5"
    >
      <h3 id={`${uid}-title`} className="text-lg font-semibold">
        {spec.title}
      </h3>
      <p>{spec.brief}</p>
      {spec.counts && (
        <div className="space-y-2">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left">
              Validation results on the same 100 builds
            </caption>
            <thead>
              <tr>
                <th scope="col">Policy</th>
                {["TP", "FP", "TN", "FN"].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.counts.map((row) => (
                <tr key={row.policy}>
                  <th scope="row" className="text-left">
                    {row.policy}
                  </th>
                  {[row.tp, row.fp, row.tn, row.fn].map((value, i) => (
                    <td className="text-center" key={i}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-text-muted">
            TP: failures flagged. FP: successful builds flagged. TN: successful
            builds left alone. FN: failures missed.
          </p>
        </div>
      )}

      <fieldset disabled={!ready} className="space-y-4">
        <legend className="font-semibold">Your decision</legend>
        {spec.options.map((option) => (
          <label className="flex items-start gap-3" key={option.id}>
            <input
              className="mt-1"
              type="radio"
              name={uid}
              value={option.id}
              checked={draft.choice === option.id}
              onChange={() => setDraft((d) => ({ ...d, choice: option.id }))}
            />
            <span>{option.text}</span>
          </label>
        ))}
        {spec.number && (
          <label className="block">
            {spec.number.label}
            <input
              className="mt-2 block w-full rounded border border-interactive bg-page p-2"
              type="number"
              value={draft.calculation}
              onChange={(e) => edit("calculation", e.target.value)}
            />
          </label>
        )}
        <label className="block">
          Your reasoning
          <textarea
            className="mt-2 block w-full rounded border border-interactive bg-page p-3"
            rows={4}
            maxLength={5000}
            value={draft.rationale}
            onChange={(e) => edit("rationale", e.target.value)}
            aria-describedby={`${uid}-prompt`}
          />
        </label>
        <p id={`${uid}-prompt`} className="text-sm text-text-muted">
          {spec.evidencePrompt}
        </p>
        <label className="block">
          Help used, or None
          <input
            className="mt-2 block w-full rounded border border-interactive bg-page p-2"
            maxLength={5000}
            value={draft.help}
            onChange={(e) => edit("help", e.target.value)}
          />
        </label>
        <label className="block">
          Minutes spent (your estimate)
          <input
            className="mt-2 block w-full rounded border border-interactive bg-page p-2"
            type="number"
            min="0"
            step="any"
            value={draft.minutes}
            onChange={(e) => edit("minutes", e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className={button}
            type="button"
            disabled={!readyToSubmit(draft) || draft.attempts.length >= 20}
            onClick={() =>
              setDraft((d) => ({
                ...d,
                attempts: [
                  ...d.attempts,
                  {
                    choice: d.choice,
                    calculation: d.calculation,
                    rationale: d.rationale,
                    help: d.help,
                    minutes: d.minutes,
                    submittedAt: new Date().toISOString(),
                  },
                ],
              }))
            }
          >
            Submit decision and show feedback
          </button>
          <button
            className={button}
            type="button"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(draft, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = `${id}-decisions.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            }}
          >
            Download decision record
          </button>
        </div>
      </fieldset>
      {attempt && result && (
        <div role="status" className="space-y-2 rounded bg-surface p-3">
          <p>
            Attempt {draft.attempts.length}:{" "}
            {result.choiceCorrect
              ? "Choice matches the stated constraints."
              : "Recheck the stated constraints before choosing."}{" "}
            {spec.number &&
              (result.calculationCorrect
                ? "Cost calculation matches."
                : "Recalculate the cost from false positives and false negatives.")}
          </p>
          <p>{spec.explanation}</p>
          <p className="text-sm">
            Your explanation is recorded for review. It has not been
            automatically graded. Later attempts follow revealed feedback; the
            first attempt is kept in this tab record.
          </p>
        </div>
      )}
      <p className="text-sm text-text-muted">
        {saved
          ? "Saved in this tab. Download the record before closing it."
          : "Tab storage unavailable or loading. Download the record to keep it."}{" "}
        Up to 20 attempts are kept. This task does not award XP or certify
        independent mastery.
      </p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
