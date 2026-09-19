"use client";
import { useEffect, useId, useState } from "react";
import {
  ActivitySyncStatus,
  type LocalActivityRecord,
} from "../activity-sync-status";
import { useActivityUser } from "../learning-activity-scope";

const guestKey = "tensorcraft:project-run:room-occupancy:v1";
const field =
  "min-h-11 w-full border border-interactive bg-background px-3 py-2 text-base text-text";
interface RunDraft {
  version: 1;
  metric: "accuracy" | "f1" | "cost";
  baseline: string;
  model: string;
  examples: string;
  split: string;
  observed: string;
  help: "" | "none" | "used";
  ran: boolean;
  record: LocalActivityRecord;
}
function empty(): RunDraft {
  return {
    version: 1,
    metric: "accuracy",
    baseline: "",
    model: "",
    examples: "",
    split: "",
    observed: "",
    help: "",
    ran: false,
    record: {
      phase: "application",
      count: 0,
      first: null,
      latest: null,
      assistance: false,
    },
  };
}
function parse(raw: string): RunDraft {
  if (raw.length > 6000) throw new Error("Project record too large");
  const d = JSON.parse(raw) as RunDraft;
  if (
    !d ||
    d.version !== 1 ||
    !["accuracy", "f1", "cost"].includes(d.metric) ||
    !["", "none", "used"].includes(d.help) ||
    typeof d.ran !== "boolean" ||
    [d.baseline, d.model, d.examples].some(
      (v) => typeof v !== "string" || v.length > 24,
    ) ||
    [d.split, d.observed].some(
      (v) => typeof v !== "string" || v.length > 2000,
    ) ||
    !d.record ||
    d.record.phase !== "application" ||
    !Number.isInteger(d.record.count) ||
    d.record.count < 0 ||
    d.record.count > 20 ||
    typeof d.record.assistance !== "boolean" ||
    [d.record.first, d.record.latest].some(
      (v) =>
        v !== null &&
        (!v ||
          typeof v.correct !== "boolean" ||
          typeof v.assisted !== "boolean"),
    ) ||
    (d.record.count === 0) !== (d.record.first === null) ||
    (d.record.count === 0) !== (d.record.latest === null)
  )
    throw new Error("Incompatible project record");
  return d;
}
export function ProjectRunRecord() {
  const userId = useActivityUser(),
    uid = useId(),
    key = userId ? `${guestKey}:account:${userId}` : guestKey;
  const [draft, setDraft] = useState(empty),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) setDraft(parse(raw));
    } catch {
      setMessage(
        "The local project draft could not be read. Your exported project files are unchanged.",
      );
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        sessionStorage.setItem(key, JSON.stringify(draft));
      } catch {
        setMessage(
          "This draft is in memory only. Download a copy before leaving.",
        );
      }
  }, [draft, key, ready]);
  const validNumbers = [draft.model, draft.baseline].every(
    (v) =>
      v.trim() !== "" &&
      Number.isFinite(Number(v)) &&
      Number(v) >= 0 &&
      (draft.metric === "cost" || Number(v) <= 1),
  );
  const valid =
    validNumbers &&
    Number.isSafeInteger(Number(draft.examples)) &&
    Number(draft.examples) > 0 &&
    Number(draft.examples) <= 1_000_000 &&
    draft.split.trim() &&
    draft.observed.trim() &&
    draft.help &&
    draft.ran;
  const edit = (patch: Partial<RunDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  function record(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || draft.record.count >= 20) return;
    const assistance = draft.record.assistance || draft.help === "used";
    const outcome = { correct: true, assisted: assistance };
    edit({
      record: {
        phase: "application",
        count: draft.record.count + 1,
        first: draft.record.first ?? outcome,
        latest: outcome,
        assistance,
      },
    });
    setMessage(
      "External run reported. This records your account of the work; it does not award an independent project pass.",
    );
  }
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            project: "room-occupancy-v1",
            provenance: "Learner report; not independently verified",
            ...draft,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "room-project-run-record.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="my-6 space-y-4 border border-border bg-surface p-4"
    >
      <h3 id={`${uid}-title`} className="font-semibold">
        Record your external run
      </h3>
      <p>
        Use your own evaluation report and local app. The starter supplies data,
        evaluation helpers and the app shell. You create the training code,
        model/scaler artifact and explanation. Keep validation choices separate
        from the final test. A rule can be the better result.
      </p>
      <p className="text-sm text-text-muted">
        The fields below stay in this tab and in your explicit download. Only a
        compact learner-reported completion and assistance summary syncs to your
        account. Exporting a folder or GitHub repository is a separate action.
      </p>
      <form onSubmit={record}>
        <fieldset disabled={!ready} className="space-y-4">
          <legend className="sr-only">Local project evidence</legend>
          <label className="block space-y-2">
            <span className="block">
              Comparison metric on the same final-test rows
            </span>
            <select
              className={field}
              value={draft.metric}
              onChange={(e) =>
                edit({ metric: e.target.value as RunDraft["metric"] })
              }
            >
              <option value="accuracy">Accuracy (0–1)</option>
              <option value="f1">F1 (0–1)</option>
              <option value="cost">
                Total error cost (same units for both)
              </option>
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["baseline", "Baseline result"],
                ["model", "Model result"],
                ["examples", "Final-test row count"],
              ] as const
            ).map(([name, label]) => (
              <label key={name} className="block min-w-0 space-y-2">
                <span className="block">{label}</span>
                <input
                  className={field}
                  value={draft[name]}
                  inputMode={name === "examples" ? "numeric" : "decimal"}
                  maxLength={24}
                  onChange={(e) => edit({ [name]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="block">
              Why this split and metric? Which rows fitted the scaler?
            </span>
            <textarea
              className={field}
              rows={3}
              maxLength={2000}
              value={draft.split}
              onChange={(e) => edit({ split: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="block">
              What did you observe after artifact reload? Include one input, its
              output, and a failure or limitation.
            </span>
            <textarea
              className={field}
              rows={3}
              maxLength={2000}
              value={draft.observed}
              onChange={(e) => edit({ observed: e.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="block">
              Help beyond the supplied starter and documentation
            </span>
            <select
              className={field}
              value={draft.help}
              onChange={(e) =>
                edit({ help: e.target.value as RunDraft["help"] })
              }
            >
              <option value="">Choose a report</option>
              <option value="none">No additional help used</option>
              <option value="used">
                Used hints, a solution, an assistant or another person
              </option>
            </select>
          </label>
          <label className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={draft.ran}
              onChange={(e) => edit({ ran: e.target.checked })}
              className="mt-1 size-5 shrink-0"
            />
            <span>
              I ran the exported artifact in the local app and recorded my own
              observations above.
            </span>
          </label>
          <p className="text-sm text-text-muted">
            These fields check completeness and numeric ranges only. Your
            rationale is for self-review or a later reviewer; it is not
            automatically graded.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={!valid || draft.record.count >= 20}
              className="min-h-11 border border-interactive px-3 py-2"
            >
              Record external run
            </button>
            <button
              type="button"
              onClick={download}
              className="min-h-11 border border-interactive px-3 py-2"
            >
              Download this record
            </button>
          </div>
        </fieldset>
      </form>
      {draft.record.count > 0 && (
        <p>
          Last local report: external run reported. Editing these fields does
          not replace that summary until you record another run.
        </p>
      )}
      <p role="status">{message}</p>
      <ActivitySyncStatus
        activityId="room-project-run"
        storageKey={key}
        guestKey={guestKey}
        ready={ready}
        records={[draft.record]}
        readGuest={(raw) => [parse(raw).record]}
      />
    </section>
  );
}
