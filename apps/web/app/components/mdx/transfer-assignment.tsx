"use client";

import { useEffect, useId, useState, type ChangeEvent } from "react";
import {
  ASSIGNMENT_VERSION,
  DRAFT_KEY,
  REPORT_FIELDS,
  REVIEW_CHECKS,
  RESCUES,
  canSelfReview,
  emptyDraft,
  parseDraft,
  type TransferDraft,
} from "./transfer-assignment-state";

const buttonClass =
  "rounded border border-interactive px-3 py-2 text-sm text-text-primary hover:bg-surface disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function TransferAssignment() {
  const id = useId();
  const [draft, setDraft] = useState<TransferDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      if (stored) setDraft(parseDraft(stored));
    } catch {
      setMessage(
        "This page could not load the previous tab draft. You can import an exported report.",
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, ready]);

  function downloadReport() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ASSIGNMENT_VERSION}-report.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function importReport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error("This report is too large.");
      const next = parseDraft(await file.text());
      // Loading an earlier report must not erase help already revealed in this tab.
      setDraft((previous) => ({
        ...next,
        openedRescues: [
          ...new Set([...previous.openedRescues, ...next.openedRescues]),
        ],
        selfReviewedAt: null,
      }));
      setMessage(
        "Report loaded. Review the answers again before marking your self-review.",
      );
    } catch {
      setMessage(
        "That file is not a valid build-triage-v1 report. Your current draft stays the same.",
      );
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="my-8 space-y-5 rounded border border-border bg-surface/40 p-5"
    >
      <h3
        id={`${id}-title`}
        className="text-lg font-semibold text-text-primary"
      >
        Independent assignment: build failure triage
      </h3>
      <p>
        At the instant a software build starts, predict whether it will fail so
        an engineer can review it. Use the unfamiliar dataset to choose your own
        features, split, baseline, model and metric.
      </p>
      <p>
        The 720 builds are synthetic practice data. Keep your code and explain
        whether the model earns its complexity, even if your baseline wins.
        Allow 60 to 90 minutes for a first attempt. This is an author estimate.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          className={buttonClass}
          href="/assignments/build-triage-v1.zip"
          download
        >
          Download assignment
        </a>
        <a
          className={buttonClass}
          href="/assignments/build-triage-v1/README.md"
          target="_blank"
          rel="noreferrer"
        >
          Read brief and field definitions
        </a>
      </div>
      <p className="text-sm text-text-muted">
        The download includes data, a JavaScript starter, setup instructions and
        a reuse license. Work in your own editor. The download includes no model
        solution or target score.
      </p>
      <fieldset disabled={!ready} className="space-y-4">
        <legend className="font-semibold">Your experiment report</legend>
        <p className="text-sm text-text-muted" role="status">
          {!ready
            ? "Loading tab draft…"
            : saved
              ? "This tab keeps your draft. It does not sync it to your account. Download a copy to keep it after closing the tab."
              : "Tab storage is unavailable. Download your report before navigating away."}
        </p>
        {REPORT_FIELDS.map((field) => (
          <div key={field.id}>
            <label htmlFor={`${id}-${field.id}`} className="block font-medium">
              {field.label}
            </label>
            <p
              id={`${id}-${field.id}-help`}
              className="mb-2 text-sm text-text-muted"
            >
              {field.prompt}
            </p>
            <textarea
              id={`${id}-${field.id}`}
              aria-describedby={`${id}-${field.id}-help`}
              rows={4}
              maxLength={10_000}
              className="w-full rounded border border-interactive bg-page p-3 text-sm text-text-primary"
              value={draft.answers[field.id]}
              onChange={(event) => {
                const answer = event.target.value;
                setDraft((d) => ({
                  ...d,
                  answers: { ...d.answers, [field.id]: answer },
                  selfReviewedAt: null,
                }));
              }}
            />
          </div>
        ))}
        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold">Self-review</legend>
          {REVIEW_CHECKS.map((check, i) => (
            <label key={check} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.checks[i]}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setDraft((d) => ({
                    ...d,
                    checks: d.checks.map((value, j) =>
                      j === i ? checked : value,
                    ),
                    selfReviewedAt: null,
                  }));
                }}
              />
              <span>{check}</span>
            </label>
          ))}
        </fieldset>
        <p className="text-sm">
          Status: {draft.selfReviewedAt ? "Self-reviewed" : "Draft"}. This
          records your own review. It provides no grade or independent
          assessment. It does not award XP or gate the next lesson.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonClass}
            disabled={!canSelfReview(draft) || Boolean(draft.selfReviewedAt)}
            onClick={() =>
              setDraft((d) => ({
                ...d,
                selfReviewedAt: new Date().toISOString(),
              }))
            }
          >
            Mark self-reviewed
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={downloadReport}
          >
            Download report
          </button>
        </div>
        <label className="block text-sm">
          Load a saved report (replaces current answers)
          <input
            type="file"
            accept="application/json,.json"
            className="mt-2 block max-w-full"
            onChange={importReport}
          />
        </label>
        <p role="status" className="text-sm text-text-muted">
          {message}
        </p>
      </fieldset>
      <fieldset disabled={!ready} className="space-y-3">
        <legend className="font-semibold">Optional rescue hints</legend>
        <p className="text-sm text-text-muted">
          Try your own approach first. This tab draft and the exported report
          record which hints you opened. Also record help from outside this
          page.
        </p>
        {RESCUES.map((rescue) => (
          <div key={rescue.id}>
            <button
              type="button"
              className={buttonClass}
              aria-expanded={draft.openedRescues.includes(rescue.id)}
              aria-controls={`${id}-rescue-${rescue.id}`}
              disabled={draft.openedRescues.includes(rescue.id)}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  openedRescues: [...d.openedRescues, rescue.id],
                  selfReviewedAt: null,
                }))
              }
            >
              {rescue.title}
            </button>
            {draft.openedRescues.includes(rescue.id) && (
              <p id={`${id}-rescue-${rescue.id}`} className="mt-2 text-sm">
                {rescue.body}
              </p>
            )}
          </div>
        ))}
      </fieldset>
    </section>
  );
}
