"use client";

import { useEffect, useId, useState } from "react";
import {
  ActivitySyncStatus,
  type LocalActivityRecord,
} from "../activity-sync-status";
import { useActivityUser } from "../learning-activity-scope";
import { EVENTS, track } from "@/lib/analytics-events";
import {
  CHANNEL_EXPERIMENT_ID,
  CHANNEL_EXPERIMENT_VERSION,
  CHANNEL_STORAGE_KEY,
  WORKED_PACKET,
  CHECK_PACKET,
  channelDraft,
  parseChannelDraft,
  channelValues,
  transformPacket,
  matchesTrace,
  checkChannelTransfer,
  type ChannelDraft,
  type LayoutOperation,
} from "./channel-layout-data";

const button =
  "min-h-11 border border-border px-3 py-2 text-base font-medium text-text hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive disabled:opacity-50";
const input =
  "min-h-11 w-full min-w-0 border border-border bg-background px-3 py-2 font-mono text-base text-text focus-visible:outline-2 focus-visible:outline-interactive";
const eventBase = {
  worldId: "deep-orbit",
  lessonId: "tensor-shapes",
  experimentId: CHANNEL_EXPERIMENT_ID,
  contentVersion: CHANNEL_EXPERIMENT_VERSION,
};

export function ChannelLayoutExperiment() {
  const uid = useId();
  const userId = useActivityUser();
  const storageKey = userId
    ? `${CHANNEL_STORAGE_KEY}:account:${userId}`
    : CHANNEL_STORAGE_KEY;
  const [draft, setDraft] = useState<ChannelDraft>(channelDraft);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) setDraft(parseChannelDraft(raw));
    } catch {
      setNotice(
        "We couldn't load your saved work for this activity, so we're starting it again. Your lesson progress and code haven't changed.",
      );
    }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, ready, storageKey]);

  function update(patch: Partial<ChannelDraft>) {
    if (!draft.started) track(EVENTS.EXPERIMENT_STARTED, eventBase);
    setDraft({ ...draft, ...patch, started: true });
  }
  const output = draft.operation
    ? transformPacket(WORKED_PACKET, draft.operation)
    : null;
  const expected = channelValues(WORKED_PACKET, draft.channel);
  function submitPrediction(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !draft.prediction.trim() || draft.predictionAttempts >= 20)
      return;
    const attempt = {
      correct: matchesTrace(draft.prediction, WORKED_PACKET[1]),
      assisted: draft.predictionHelp,
    };
    update({
      tableBuilt: true,
      predictionHelp: true,
      predictionResult: attempt,
      latestPrediction: attempt,
      firstPrediction: draft.firstPrediction ?? attempt,
      predictionAttempts: draft.predictionAttempts + 1,
    });
    track(EVENTS.EXPERIMENT_SUBMITTED, {
      ...eventBase,
      phase: "prediction",
      attempt: draft.predictionAttempts + 1,
      correct: attempt.correct,
      assisted: attempt.assisted,
    });
  }
  function submitCheck(event: React.FormEvent) {
    event.preventDefault();
    if (
      !ready ||
      !draft.checkOperation ||
      !draft.checkValues.trim() ||
      draft.checkAttempts >= 20
    )
      return;
    const result = checkChannelTransfer(
      draft.checkOperation,
      draft.checkValues,
    );
    const attempt = {
      correct: result.operationCorrect && result.valuesCorrect,
      assisted: draft.checkHelp,
    };
    update({
      checkResult: attempt,
      latestCheck: attempt,
      firstCheck: draft.firstCheck ?? attempt,
      checkAttempts: draft.checkAttempts + 1,
    });
    track(EVENTS.EXPERIMENT_SUBMITTED, {
      ...eventBase,
      phase: "changed_case",
      attempt: draft.checkAttempts + 1,
      correct: attempt.correct,
      assisted: attempt.assisted,
    });
  }

  return (
    <section
      className="learning-experiment my-8 min-w-0 border border-border bg-surface/40 p-4 sm:p-6"
      aria-labelledby={`${uid}-title`}
      data-testid="channel-layout-experiment"
    >
      <p className="font-mono text-sm uppercase tracking-wider text-text-muted">
        Farah’s practice recording
      </p>
      <h3 id={`${uid}-title`}>Keep each sensor’s readings together</h3>
      <p>
        Farah starts with a small, made-up recording: four sensors at three
        moments. The recording header gives their order: A, B, C, D, then A, B,
        C, D again.
      </p>
      <p>
        A sensor’s stream of readings is called a <strong>channel</strong>. The
        ship has 64 channels. This practice example uses just four.
      </p>
      <fieldset disabled={!ready} className="min-w-0 space-y-8">
        <legend className="sr-only">Sensor layout controls</legend>
        {draft.mode === "worked" ? (
          <div className="channel-worked-grid">
            <div className="min-w-0 space-y-5">
              <h4 className="!text-2xl font-semibold">
                1. Make one row per moment
              </h4>
              <p>
                A <strong>shape</strong> lists the size of each axis. An axis is
                one direction, such as rows or columns. This flat list has one
                axis with 12 values: shape <code>[12]</code>.
              </p>
              <FlatReadings />
              <p>
                Farah needs three rows, with four sensors in each row. That
                gives shape <code>[3, 4]</code>. Read the list from left to
                right, starting a new row after every four values.
              </p>
              <form onSubmit={submitPrediction} className="space-y-3">
                <label
                  htmlFor={`${uid}-prediction`}
                  className="block font-medium"
                >
                  Which four readings go in the second row?
                </label>
                <input
                  id={`${uid}-prediction`}
                  className={input}
                  autoComplete="off"
                  maxLength={80}
                  placeholder="Four numbers, separated by commas"
                  value={draft.prediction}
                  onChange={(event) =>
                    update({
                      prediction: event.target.value,
                      predictionResult: null,
                    })
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className={button}
                    disabled={
                      !draft.prediction.trim() || draft.predictionAttempts >= 20
                    }
                  >
                    Check prediction
                  </button>
                  <button
                    type="button"
                    className={button}
                    aria-expanded={draft.tableBuilt}
                    aria-controls={`${uid}-time-grid`}
                    onClick={() =>
                      update({ tableBuilt: true, predictionHelp: true })
                    }
                  >
                    Build the table
                  </button>
                </div>
                <p role="status">
                  {draft.predictionResult
                    ? draft.predictionResult.correct
                      ? "Yes. The second row is [3, 18, 7, 8], one reading from each sensor at the second moment."
                      : "Take four readings at a time. The first four make the first row; the next four make the second. Compare your prediction with the table below."
                    : "Predict first, or build the table to explore. Looking at the table counts as help on later predictions."}
                </p>
              </form>
              {draft.tableBuilt && (
                <div
                  id={`${uid}-time-grid`}
                  className="space-y-3"
                  data-testid="time-grid"
                >
                  <PacketTable
                    packet={WORKED_PACKET}
                    caption="One row per moment. Shape [3, 4]"
                    channel={draft.channel}
                  />
                  <pre tabIndex={0} aria-label="Reshape the flat readings">
                    <code>{`const grid = flat.reshape([3, 4]);\nconst step1 = grid.arraySync()[1]; // [3, 18, 7, 8]`}</code>
                  </pre>
                  <p>
                    <code>reshape()</code> keeps the values in their original
                    order. <code>arraySync()</code> reads them into regular
                    JavaScript arrays. Index <code>1</code> selects the second
                    row because JavaScript counts from zero.
                  </p>
                </div>
              )}
            </div>
            {draft.tableBuilt && (
              <div className="min-w-0 space-y-5">
                <h4 className="!text-2xl font-semibold">
                  2. Give the chart one row per sensor
                </h4>
                <p>
                  Now Farah wants to chart one sensor over time. Her chart
                  expects a separate row for each sensor: four rows, with three
                  moments in each. The shape will be <code>[4, 3]</code>.
                </p>
                <label
                  className="flex flex-wrap items-center gap-3"
                  htmlFor={`${uid}-channel`}
                >
                  Follow a sensor
                  <select
                    id={`${uid}-channel`}
                    className={`${input} !w-auto`}
                    value={draft.channel}
                    onChange={(event) =>
                      update({ channel: Number(event.target.value) })
                    }
                  >
                    {[0, 1, 2, 3].map((channel) => (
                      <option key={channel} value={channel}>
                        Sensor {sensorName(channel)}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Try both operations. Do they keep that sensor’s three readings
                  together?
                </p>
                <div
                  className="flex flex-wrap gap-3"
                  role="group"
                  aria-label="Compare reshape and transpose"
                >
                  {(["reshape", "transpose"] as const).map((operation) => (
                    <button
                      type="button"
                      key={operation}
                      className={button}
                      aria-pressed={draft.operation === operation}
                      onClick={() => update({ operation })}
                    >
                      {operation === "reshape"
                        ? "Run reshape"
                        : "Run transpose"}
                    </button>
                  ))}
                </div>
                {output && draft.operation && (
                  <div className="space-y-5" data-testid="channel-result">
                    <PacketTable
                      packet={output}
                      caption={`After ${draft.operation}. Shape [4, 3]`}
                      channel={draft.channel}
                      operation={draft.operation}
                    />
                    <p role="status">
                      Row {draft.channel}: [{output[draft.channel].join(", ")}].{" "}
                      {draft.operation === "transpose"
                        ? `These are sensor ${sensorName(draft.channel)}’s readings, in time order. The chart can use this row.`
                        : `This row mixes sensors. Sensor ${sensorName(draft.channel)}’s readings are [${expected.join(", ")}]. The shape fits the chart, but these values tell the wrong story.`}
                    </p>
                    <Trace
                      expected={expected}
                      actual={output[draft.channel]}
                      channel={draft.channel}
                    />
                    <pre
                      tabIndex={0}
                      aria-label="Equivalent TensorFlow.js operation"
                    >
                      <code>
                        {draft.operation === "transpose"
                          ? `const bySensor = grid.transpose();\n// Read sensor ${sensorName(draft.channel)} (index ${draft.channel})\nbySensor.arraySync()[${draft.channel}]; // [${output[draft.channel].join(", ")}]`.replaceAll(
                              "\\n",
                              "\n",
                            )
                          : `const mixed = grid.reshape([4, 3]);\nmixed.arraySync()[${draft.channel}]; // [${output[draft.channel].join(", ")}]`.replaceAll(
                              "\\n",
                              "\n",
                            )}
                      </code>
                    </pre>
                  </div>
                )}
                <button
                  type="button"
                  className={button}
                  aria-expanded={draft.explanation}
                  aria-controls={`${uid}-explanation`}
                  onClick={() => update({ explanation: true })}
                >
                  Explain the difference
                </button>
                {draft.explanation && (
                  <div id={`${uid}-explanation`} className="space-y-3">
                    <p>
                      <code>reshape([4, 3])</code> takes the values in their
                      existing order and starts a new row after every three. It
                      does not group readings by sensor.
                    </p>
                    <p>
                      For this two-axis grid, <code>transpose()</code> turns
                      each column into a row. Each sensor keeps its readings in
                      time order.
                    </p>
                    <p>
                      Both results have shape <code>[4, 3]</code>. Shape gives
                      the sizes; the recording format tells us what those axes
                      mean. Check the values before passing them to a chart or
                      model.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <button
                type="button"
                className={button}
                onClick={() => update({ mode: "check" })}
              >
                Try a new example
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="!text-2xl font-semibold">
              Your turn: follow sensor B
            </h4>
            <p>
              Farah opens a different practice recording: two moments, with
              sensors A, B, and C in that order at each moment. Help her give
              the chart one row per sensor.
            </p>
            <PacketTable
              packet={CHECK_PACKET}
              caption="New input: one row per moment. Shape [2, 3]"
              channel={1}
            />
            <form onSubmit={submitCheck} className="space-y-4">
              <fieldset className="min-w-0 space-y-2">
                <legend className="mb-2 font-medium">
                  Which operation keeps each sensor’s readings together?
                </legend>
                {(["reshape", "transpose"] as const).map((operation) => (
                  <label
                    key={operation}
                    className="flex min-h-11 items-center gap-3"
                  >
                    <input
                      type="radio"
                      name={`${uid}-operation`}
                      value={operation}
                      checked={draft.checkOperation === operation}
                      onChange={() =>
                        update({ checkOperation: operation, checkResult: null })
                      }
                    />
                    <span>
                      {operation === "reshape"
                        ? "Reshape to [3, 2]"
                        : "Transpose: turn columns into rows"}
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="block font-medium" htmlFor={`${uid}-check`}>
                Sensor B’s two readings, from earliest to latest
              </label>
              <input
                id={`${uid}-check`}
                className={input}
                autoComplete="off"
                maxLength={80}
                value={draft.checkValues}
                onChange={(event) =>
                  update({ checkValues: event.target.value, checkResult: null })
                }
                placeholder="Two numbers, separated by a comma"
              />
              <button
                type="submit"
                className={button}
                disabled={
                  !draft.checkOperation ||
                  !draft.checkValues.trim() ||
                  draft.checkAttempts >= 20
                }
              >
                Check my answer
              </button>
              <p role="status">
                {draft.checkResult
                  ? draft.checkResult.correct
                    ? `Both answers are correct. You answered ${draft.checkResult.assisted ? "with help" : "without help"} on this example. Transpose keeps sensor B’s readings together, in time order.`
                    : checkChannelTransfer(
                          draft.checkOperation,
                          draft.checkValues,
                        ).operationCorrect
                      ? "The operation is right. For the readings, follow sensor B’s column from top to bottom."
                      : "Reshape also makes shape [3, 2], but mixes sensors. Which operation turns a column into a row?"
                  : "We’ll check both the operation and the readings. Getting the shape alone is not enough."}
              </p>
            </form>
            <button
              type="button"
              className={button}
              aria-expanded={draft.checkAnswer}
              aria-controls={`${uid}-help`}
              onClick={() => update({ checkHelp: true, checkAnswer: true })}
            >
              Show the answer
            </button>
            {draft.checkAnswer && (
              <p id={`${uid}-help`}>
                Transpose makes [[10, 11], [20, 21], [30, 31]]. Sensor B’s row
                is [20, 21]. Reshape makes [[10, 20], [30, 11], [21, 31]], which
                splits sensor B across rows. Later attempts will be marked as
                using help.
              </p>
            )}
            <p className="text-base text-text-muted">
              Going back to the first example also counts as help on this one.
            </p>
            <button
              type="button"
              className={button}
              onClick={() => update({ mode: "worked", checkHelp: true })}
            >
              Back to the first example
            </button>
          </>
        )}
        {(draft.firstPrediction || draft.firstCheck) && (
          <p className="text-base text-text-muted">
            Your first{" "}
            {draft.firstCheck ? "answer on the new example" : "prediction"}:{" "}
            {(draft.firstCheck ?? draft.firstPrediction)!.correct
              ? "correct"
              : "incorrect"}
            {(draft.firstCheck ?? draft.firstPrediction)!.assisted
              ? ", with help"
              : ", without help"}
            . This record stays the same when you retry.
          </p>
        )}
        {(draft.predictionAttempts >= 20 || draft.checkAttempts >= 20) && (
          <p>
            That’s 20 attempts for this task. You can still compare the layouts
            and continue to the coding challenge.
          </p>
        )}
        <button
          type="button"
          className={button}
          onClick={() =>
            update({
              channel: 0,
              operation: null,
              tableBuilt: false,
              prediction: "",
              predictionResult: null,
              checkOperation: null,
              checkValues: "",
              checkResult: null,
            })
          }
        >
          Reset the controls
        </button>
      </fieldset>
      <p className="mt-4 text-base text-text-muted">
        {ready
          ? saved
            ? "Saved in this tab. Refreshing the page will keep your work."
            : "We can’t save your work in this tab. You can still use the activity, but your work may be lost when you leave."
          : "Loading your saved work…"}{" "}
        This practice does not complete the lesson. Continue to the Challenge
        section for the coding task.
      </p>
      {notice && (
        <p role="status" className="text-base">
          {notice}
        </p>
      )}
      <ActivitySyncStatus
        activityId="deep-orbit-channel-layout"
        storageKey={storageKey}
        guestKey={CHANNEL_STORAGE_KEY}
        ready={ready}
        records={channelRecords(draft)}
        readGuest={(raw) => channelRecords(parseChannelDraft(raw))}
      />
    </section>
  );
}

function sensorName(channel: number) {
  return String.fromCharCode(65 + channel);
}
const sensorStyles = [
  "bg-interactive/15",
  "bg-interactive/10",
  "bg-surface-hover",
  "bg-surface",
];

function FlatReadings() {
  return (
    <figure className="m-0 space-y-3">
      <figcaption className="!text-left !text-base font-medium">
        The flat recording, in order. The letters identify each reading’s
        sensor.
      </figcaption>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Flat recording. Scroll sideways to follow all twelve readings."
      >
        <ol
          className="!m-0 flex w-max list-none gap-2 !p-0"
          aria-label="Twelve readings in recording order"
        >
          {WORKED_PACKET.flat().map((value, index) => (
            <li
              key={index}
              className={`!m-0 flex min-w-16 flex-col items-center border border-border px-3 py-2 ${sensorStyles[index % 4]}`}
            >
              <span className="font-mono text-sm text-text-muted">
                {sensorName(index % 4)}
              </span>
              <span className="font-mono text-xl">{value}</span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

function PacketTable({
  packet,
  caption,
  channel,
  operation,
}: {
  packet: number[][];
  caption: string;
  channel: number;
  operation?: LayoutOperation;
}) {
  const transposed = operation === "transpose";
  return (
    <div className="space-y-2">
      <p className="font-medium">{caption}.</p>
      <div
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-interactive"
        role="region"
        aria-label={`${caption}. Scroll sideways if needed.`}
        tabIndex={0}
      >
        <table className="w-full min-w-[18rem] table-fixed border-collapse text-lg sm:text-[22px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">
                {transposed ? "Sensor" : operation ? "Row" : "Moment"}
              </th>
              {packet[0].map((_, c) => (
                <th scope="col" key={c}>
                  {transposed
                    ? `Moment ${c + 1}`
                    : operation
                      ? `Col ${c}`
                      : sensorName(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {packet.map((row, r) => (
              <tr key={r}>
                <th scope="row">
                  {transposed ? sensorName(r) : operation ? r : r + 1}
                </th>
                {row.map((value, c) => {
                  // Track identity by source position, including duplicate values.
                  const origin = !operation
                    ? c
                    : transposed
                      ? r
                      : (r * packet[0].length + c) % WORKED_PACKET[0].length;
                  const selected = origin === channel;
                  return (
                    <td
                      key={c}
                      className={`border border-border px-1 py-3 text-center !text-lg sm:!text-[22px] ${sensorStyles[origin]} ${selected ? "font-semibold text-text" : "text-text-muted"}`}
                      data-sensor={sensorName(origin)}
                    >
                      <span className="font-mono">{value}</span>
                      {operation && (
                        <span
                          className="ml-1 text-sm"
                          aria-label={`sensor ${sensorName(origin)}`}
                        >
                          {sensorName(origin)}
                        </span>
                      )}
                      {selected && (
                        <span className="sr-only">, selected sensor</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Trace({
  expected,
  actual,
  channel,
}: {
  expected: number[];
  actual: number[];
  channel: number;
}) {
  // Keep the same scale while the learner switches sensors or operations.
  const minimum = Math.min(0, ...WORKED_PACKET.flat());
  const maximum = Math.max(1, ...WORKED_PACKET.flat());
  const y = (value: number) =>
    175 - ((value - minimum) / (maximum - minimum)) * 140;
  const x = (index: number) => 70 + index * 230;
  const points = (values: number[]) =>
    values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
  return (
    <figure className="m-0 space-y-2">
      <svg
        viewBox="0 0 600 225"
        className="block w-full"
        role="img"
        aria-label={`Sensor ${sensorName(channel)} over time: ${expected.join(", ")}. Output row ${channel}: ${actual.join(", ")}.`}
      >
        <path
          d="M70 25V175H550"
          fill="none"
          stroke="currentColor"
          opacity="0.4"
        />
        {[minimum, maximum].map((value) => (
          <text
            key={value}
            x="55"
            y={y(value) + 5}
            textAnchor="end"
            fill="currentColor"
            fontSize="16"
          >
            {value}
          </text>
        ))}
        <polyline
          points={points(expected)}
          fill="none"
          stroke="var(--tc-accent)"
          strokeWidth="4"
        />
        <polyline
          points={points(actual)}
          fill="none"
          stroke="currentColor"
          strokeDasharray="8 5"
          strokeWidth="2"
        />
        {actual.map((value, i) => (
          <circle key={i} cx={x(i)} cy={y(value)} r="5" fill="currentColor" />
        ))}
        {[0, 1, 2].map((t) => (
          <text
            key={t}
            x={x(t)}
            y="205"
            textAnchor="middle"
            fontSize="16"
            fill="currentColor"
          >
            Moment {t + 1}
          </text>
        ))}
      </svg>
      <figcaption className="!text-base">
        Solid line: sensor {sensorName(channel)}’s readings. Dashed with dots:
        output row {channel}.{" "}
        {expected.every((value, i) => value === actual[i])
          ? "The lines match: the readings stayed in time order."
          : "The lines differ: this row would give Farah the wrong chart."}{" "}
        These are made-up practice values.
      </figcaption>
    </figure>
  );
}

function channelRecords(draft: ChannelDraft): LocalActivityRecord[] {
  return [
    {
      phase: "prediction",
      count: draft.predictionAttempts,
      first: draft.firstPrediction,
      latest: draft.latestPrediction,
      assistance: draft.predictionHelp,
    },
    {
      phase: "changed_case",
      count: draft.checkAttempts,
      first: draft.firstCheck,
      latest: draft.latestCheck,
      assistance: draft.checkHelp,
    },
  ];
}
