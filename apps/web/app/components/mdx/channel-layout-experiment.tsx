"use client";

import { useEffect, useId, useState } from "react";
import { AnswerFeedback } from "@tensorcraft/ui/answer-feedback";
import "./channel-layout-experiment.css";
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
  RECORDING_SOURCE,
  WORKED_EXCERPT,
  CHECK_EXCERPT,
  channelDraft,
  parseChannelDraft,
  channelValues,
  transformPacket,
  matchesTrace,
  checkChannelTransfer,
  type ChannelDraft,
  type LayoutOperation,
  type RecordingExcerpt,
} from "./channel-layout-data";

const button =
  "channel-button min-h-11 border border-border px-3 py-2 text-base font-medium text-text hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive disabled:opacity-50";
const input =
  "channel-input min-h-11 w-full min-w-0 border border-border bg-background px-3 py-2 font-mono text-base text-text focus-visible:outline-2 focus-visible:outline-interactive";
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
  const checkedTransfer = draft.checkResult
    ? checkChannelTransfer(draft.checkOperation, draft.checkValues)
    : null;
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
      className="learning-experiment channel-activity"
      aria-labelledby={`${uid}-title`}
      data-testid="channel-layout-experiment"
    >
      <header className="channel-activity-opening">
        <h3 id={`${uid}-title`} className="channel-activity-title">
          Keep each sensor’s readings together
        </h3>
        <p data-story-passage="">
          Farah opens the recording Demir sent her. She wants to see how each
          sensor changes over time. Help her put the readings into the layout
          her chart needs.
        </p>
        <RecordingNotes
          excerpt={draft.mode === "worked" ? WORKED_EXCERPT : CHECK_EXCERPT}
        />
        <aside className="channel-definition" aria-label="What is a channel?">
          <p>
            Each sensor sends a series of readings called a{" "}
            <strong>channel</strong>. Demir’s recording contains all{" "}
            {RECORDING_SOURCE.sensorCount} channels. Farah has already pulled
            out the readings shown here.
          </p>
        </aside>
      </header>
      <fieldset disabled={!ready} className="channel-activity-controls">
        <legend className="sr-only">Sensor layout controls</legend>
        {draft.mode === "worked" ? (
          <div className="channel-stages">
            <section
              className="channel-stage"
              aria-labelledby={`${uid}-group-title`}
            >
              <h4 className="channel-stage-title" id={`${uid}-group-title`}>
                <span className="channel-step-number">1</span> Group the
                readings by time
              </h4>
              <p>
                This list holds 12 readings, so its <strong>shape</strong> is{" "}
                <code>[12]</code>. Shape tells us the size of each axis. A list
                has one axis. A grid has two: one for rows and one for columns.
              </p>
              <FlatReadings />
              <p>
                This selection lists the sensors in order: A, B, C, D. Each
                group of four readings belongs to one moment. Put each group in
                its own row. You’ll get three rows and four columns: shape{" "}
                <code>[3, 4]</code>.
              </p>
              <form onSubmit={submitPrediction} className="channel-prediction">
                <label
                  htmlFor={`${uid}-prediction`}
                  className="channel-question"
                >
                  Which four readings go in the second row?
                </label>
                <input
                  id={`${uid}-prediction`}
                  className={`${input} aria-invalid:border-error`}
                  aria-invalid={
                    draft.predictionResult
                      ? !draft.predictionResult.correct
                      : undefined
                  }
                  aria-describedby={`${uid}-prediction-feedback`}
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
                    className={`${button} channel-button-primary`}
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
                <AnswerFeedback
                  id={`${uid}-prediction-feedback`}
                  status={
                    draft.predictionResult
                      ? draft.predictionResult.correct
                        ? "correct"
                        : "incorrect"
                      : null
                  }
                  title={
                    draft.predictionResult?.correct
                      ? "Correct!"
                      : "Not quite. That’s not the second row."
                  }
                >
                  {draft.predictionResult ? (
                    <p>
                      {draft.predictionResult.correct
                        ? "The second row is [3, 18, 7, 8]. These are the four sensors’ readings at Time 2."
                        : "The first four readings make the first row. The next four make the second. Compare your answer with the table below, then try again."}
                    </p>
                  ) : (
                    <p>
                      Have a guess, then check it. You can also build the table
                      first. If you look at the table before answering, we’ll
                      record that you used help.
                    </p>
                  )}
                </AnswerFeedback>
              </form>
              {draft.tableBuilt && (
                <div
                  id={`${uid}-time-grid`}
                  className="channel-reveal"
                  data-testid="time-grid"
                >
                  <PacketTable
                    packet={WORKED_PACKET}
                    caption="Readings taken at the same time share a row. Shape [3, 4]"
                    channel={draft.channel}
                  />
                  <pre tabIndex={0} aria-label="Reshape the flat readings">
                    <code>{`const grid = flat.reshape([3, 4]);\nconst step1 = grid.arraySync()[1]; // [3, 18, 7, 8]`}</code>
                  </pre>
                  <p>
                    <code>reshape()</code> makes the rows without changing the
                    readings’ order. <code>arraySync()</code> gives us regular
                    JavaScript arrays so we can read the values. Index{" "}
                    <code>1</code> picks the second row because array indexes
                    start at zero.
                  </p>
                </div>
              )}
            </section>
            {draft.tableBuilt && (
              <section
                className="channel-stage"
                aria-labelledby={`${uid}-sensor-title`}
              >
                <h4 className="channel-stage-title" id={`${uid}-sensor-title`}>
                  <span className="channel-step-number">2</span> Give the chart
                  one row per sensor
                </h4>
                <p>
                  Farah is ready to chart how each sensor’s readings change over
                  time. Her chart needs one row per sensor, with all three of
                  its readings together. That means four rows and three columns:
                  shape <code>[4, 3]</code>.
                </p>
                <div className="channel-comparison-controls">
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
                    Pick a sensor, then try both buttons. Watch where its three
                    readings end up.
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
                </div>
                {output && draft.operation && (
                  <div className="channel-reveal" data-testid="channel-result">
                    <PacketTable
                      packet={output}
                      caption={`After ${draft.operation}. Shape [4, 3]`}
                      channel={draft.channel}
                      operation={draft.operation}
                    />
                    <p role="status" className="channel-result-note">
                      Row at index {draft.channel}: [
                      {output[draft.channel].join(", ")}].{" "}
                      {draft.operation === "transpose"
                        ? `These are sensor ${sensorName(draft.channel)}’s readings, in time order. The chart can use this row.`
                        : `This row mixes readings from different sensors. Sensor ${sensorName(draft.channel)}’s readings are [${expected.join(", ")}]. Farah’s chart would show the wrong readings.`}
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
                  <div
                    id={`${uid}-explanation`}
                    className="channel-explanation"
                  >
                    <h5 className="channel-subheading">
                      Why the readings differ
                    </h5>
                    <p>
                      <code>reshape([4, 3])</code> reads the same list again,
                      three values per row. It keeps their original order, so
                      readings from different sensors end up together.
                    </p>
                    <p>
                      <code>transpose()</code> turns each column into a row.
                      Sensor A’s column becomes sensor A’s row, and the same
                      happens for B, C, and D. Their readings stay in time
                      order.
                    </p>
                    <p>
                      Both results have shape <code>[4, 3]</code>: four rows,
                      three columns. Those numbers cannot tell Farah what each
                      row means. The recording notes give her the sensor order.
                      She still needs to check the readings before using them.
                    </p>
                  </div>
                )}
              </section>
            )}
            <div className="channel-next-example">
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
          <section
            className="channel-stage"
            aria-labelledby={`${uid}-check-title`}
          >
            <h4 className="channel-stage-title" id={`${uid}-check-title`}>
              Your turn: follow sensor B
            </h4>
            <p data-story-passage="">
              Farah moves to another part of Demir’s recording. She selects
              sensors A, B, and C at two other moments. Help her get their
              readings ready for the same chart.
            </p>
            <PacketTable
              packet={CHECK_PACKET}
              caption="Another selection from Demir’s recording, with one row for each time. Shape [2, 3]"
              channel={1}
            />
            <form onSubmit={submitCheck} className="channel-prediction">
              <fieldset
                className="channel-operation-options"
                aria-invalid={
                  checkedTransfer
                    ? !checkedTransfer.operationCorrect
                    : undefined
                }
                aria-describedby={`${uid}-check-feedback`}
              >
                <legend className="channel-question">
                  Which operation keeps each sensor’s readings together?
                </legend>
                {(["reshape", "transpose"] as const).map((operation) => (
                  <label key={operation} className="channel-operation-option">
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
              <label className="channel-question" htmlFor={`${uid}-check`}>
                Sensor B’s two readings, from earliest to latest
              </label>
              <input
                id={`${uid}-check`}
                className={`${input} aria-invalid:border-error`}
                aria-invalid={
                  checkedTransfer ? !checkedTransfer.valuesCorrect : undefined
                }
                aria-describedby={`${uid}-check-feedback`}
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
                className={`${button} channel-button-primary`}
                disabled={
                  !draft.checkOperation ||
                  !draft.checkValues.trim() ||
                  draft.checkAttempts >= 20
                }
              >
                Check my answer
              </button>
              <AnswerFeedback
                id={`${uid}-check-feedback`}
                status={
                  draft.checkResult
                    ? draft.checkResult.correct
                      ? "correct"
                      : "incorrect"
                    : null
                }
                title={
                  draft.checkResult?.correct
                    ? "Both answers are correct!"
                    : checkedTransfer?.operationCorrect
                      ? "Not quite. Your sensor readings are incorrect."
                      : checkedTransfer?.valuesCorrect
                        ? "Not quite. The operation is incorrect."
                        : "Not quite. Both answers are incorrect."
                }
              >
                <p>
                  {draft.checkResult
                    ? draft.checkResult.correct
                      ? `Both answers are correct. You answered ${draft.checkResult.assisted ? "with help" : "without help"} on this example. Sensor B’s readings stay together and in time order, ready for Farah’s chart.`
                      : checkedTransfer?.operationCorrect
                        ? "The operation is right. For the readings, follow sensor B’s column from top to bottom, then try again."
                        : `${checkedTransfer?.valuesCorrect ? "Your sensor readings are correct. " : "For the readings, follow sensor B’s column from top to bottom. "}Reshape gives you three rows of two, but mixes the sensors’ readings. Which operation turns a column into a row?`
                    : "Choose an operation and enter sensor B’s readings. We’ll check both so Farah gets the right readings in her chart."}
                </p>
              </AnswerFeedback>
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
              <p id={`${uid}-help`} className="channel-explanation">
                Transpose makes [[10, 11], [20, 21], [30, 31]]. Sensor B’s row
                is [20, 21]. Reshape makes [[10, 20], [30, 11], [21, 31]], which
                puts sensor B’s readings in separate rows. If you try again,
                we’ll record that you used this help.
              </p>
            )}
            <p className="channel-detail">
              Going back to the first example also counts as help on this one.
            </p>
            <button
              type="button"
              className={button}
              onClick={() => update({ mode: "worked", checkHelp: true })}
            >
              Back to the first example
            </button>
          </section>
        )}
        <footer className="channel-activity-footer">
          {(draft.firstPrediction || draft.firstCheck) && (
            <p className="channel-detail">
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
              That’s 20 attempts for this task. You can still compare the
              layouts and continue to the coding challenge.
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
        </footer>
      </fieldset>
      <p className="channel-detail">
        {ready
          ? saved
            ? "Saved in this tab. Refreshing the page will keep your work."
            : "We can’t save your work in this tab. You can still use the activity, but your work may be lost when you leave."
          : "Loading your saved work…"}{" "}
        This activity does not complete the lesson. Continue to the Challenge
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

function RecordingNotes({ excerpt }: { excerpt: RecordingExcerpt }) {
  return (
    <aside
      className="channel-recording-notes"
      aria-label="Recording notes for this excerpt"
    >
      <h4 className="channel-subheading">Selected from Demir’s recording</h4>
      <dl>
        <div>
          <dt>Sensor order at each moment</dt>
          <dd>
            {excerpt.sensorIds.map((sensor) => (
              <code key={sensor}>{sensor}</code>
            ))}
            <span>
              {excerpt.sensorIds.length} of {RECORDING_SOURCE.sensorCount}{" "}
              sensors
            </span>
          </dd>
        </div>
        <div>
          <dt>Moments in this selection</dt>
          <dd>{excerpt.momentCount}, from earliest to latest</dd>
        </div>
      </dl>
      <p>
        The other {RECORDING_SOURCE.sensorCount - excerpt.sensorIds.length}{" "}
        sensors are left out. Time 1 is the first moment in this selection.
      </p>
    </aside>
  );
}
const sensorStyles = [
  "bg-interactive/15",
  "bg-interactive/10",
  "bg-surface-hover",
  "bg-surface",
];

function FlatReadings() {
  return (
    <figure className="channel-recording">
      <figcaption>
        Read from left to right. Each letter shows which sensor the reading came
        from.
      </figcaption>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="The list of twelve readings. Scroll sideways to see them all."
      >
        <ol
          className="channel-reading-values"
          aria-label="Twelve readings in recording order"
        >
          {WORKED_PACKET.flat().map((value, index) => (
            <li
              key={index}
              className={`channel-reading border border-border ${sensorStyles[index % 4]}`}
            >
              <span className="channel-sensor-name">
                {sensorName(index % 4)}
              </span>
              <span>{value}</span>
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
    <div className="channel-table">
      <p className="channel-table-title">{caption}.</p>
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
                {transposed ? "Sensor" : operation ? "Row index" : "Time"}
              </th>
              {packet[0].map((_, c) => (
                <th scope="col" key={c}>
                  {transposed
                    ? `Time ${c + 1}`
                    : operation
                      ? `Column ${c}`
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
    <figure className="channel-trace">
      <svg
        viewBox="0 0 600 225"
        className="block w-full"
        role="img"
        aria-label={`Sensor ${sensorName(channel)} over time: ${expected.join(", ")}. Row at index ${channel} after your operation: ${actual.join(", ")}.`}
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
            Time {t + 1}
          </text>
        ))}
      </svg>
      <figcaption>
        The solid line shows sensor {sensorName(channel)}’s readings. The dashed
        line with dots shows the row at index {channel} after your operation.{" "}
        {expected.every((value, i) => value === actual[i])
          ? "The lines match. The sensor’s readings stayed in time order."
          : "The lines differ. This row would give Farah the wrong chart."}{" "}
        These are the selected readings from Demir’s recording.
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
