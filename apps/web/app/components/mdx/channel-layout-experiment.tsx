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
  "min-h-11 border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-interactive disabled:opacity-50";
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
      correct: matchesTrace(draft.prediction, expected),
      assisted: draft.predictionHelp,
    };
    update({
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
      <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
        Sensor layout activity
      </p>
      <h3 id={`${uid}-title`}>Put each sensor channel in its own row</h3>
      <p>
        A channel is a stream of readings from a sensor. In this table, each row
        shows one moment in time. Each column shows one channel. Read down a
        column to follow that channel over time.
      </p>
      <p>
        These example numbers label positions so you can track where they go.
        They aren&apos;t real sensor measurements. Rows and channels are
        numbered from 0, like JavaScript array indexes.
      </p>
      <fieldset disabled={!ready} className="min-w-0 space-y-5">
        <legend className="sr-only">Sensor layout controls</legend>
        {draft.mode === "worked" ? (
          <>
            <div className="channel-worked-grid">
              <div className="min-w-0 space-y-5">
                <label
                  className="flex flex-wrap items-center gap-3"
                  htmlFor={`${uid}-channel`}
                >
                  Choose a channel
                  <select
                    id={`${uid}-channel`}
                    className={`${input} !w-auto`}
                    value={draft.channel}
                    onChange={(event) =>
                      update({
                        channel: Number(event.target.value),
                        prediction: "",
                        predictionResult: null,
                      })
                    }
                  >
                    {[0, 1, 2, 3].map((channel) => (
                      <option key={channel} value={channel}>
                        Channel {channel}
                      </option>
                    ))}
                  </select>
                </label>
                <PacketTable
                  packet={WORKED_PACKET}
                  caption="Input: 3 moments and 4 channels. Shape [3, 4]"
                  channel={draft.channel}
                />
                <form onSubmit={submitPrediction} className="space-y-3">
                  <label
                    htmlFor={`${uid}-prediction`}
                    className="block font-medium"
                  >
                    Which numbers belong to channel {draft.channel}, from
                    earliest to latest?
                  </label>
                  <input
                    id={`${uid}-prediction`}
                    className={input}
                    autoComplete="off"
                    maxLength={80}
                    placeholder="Enter three numbers, separated by commas"
                    value={draft.prediction}
                    onChange={(event) =>
                      update({
                        prediction: event.target.value,
                        predictionResult: null,
                      })
                    }
                  />
                  <button
                    type="submit"
                    className={button}
                    disabled={
                      !draft.prediction.trim() || draft.predictionAttempts >= 20
                    }
                  >
                    Check prediction
                  </button>
                  <p role="status">
                    {draft.predictionResult
                      ? draft.predictionResult.correct
                        ? "Yes. Those numbers follow the selected channel from the first moment to the last. Now try both operations."
                        : "Read down the highlighted column. Each row shows all channels at one moment."
                      : "You can make a prediction or try an operation first. Viewing a result or explanation counts as using help."}
                  </p>
                </form>
              </div>
              <div className="min-w-0 space-y-5">
                <div>
                  <p>
                    Both operations make 4 rows and 3 columns, shape [4, 3].
                    Which one puts all numbers from a channel in the same row?
                  </p>
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Compare reshape and transpose"
                  >
                    {(["reshape", "transpose"] as const).map((operation) => (
                      <button
                        type="button"
                        key={operation}
                        className={button}
                        aria-pressed={draft.operation === operation}
                        onClick={() =>
                          update({ operation, predictionHelp: true })
                        }
                      >
                        {operation === "reshape"
                          ? "Run reshape"
                          : "Run transpose"}
                      </button>
                    ))}
                  </div>
                </div>
                {output && draft.operation && (
                  <div className="space-y-3" data-testid="channel-result">
                    <PacketTable
                      packet={output}
                      caption={`After ${draft.operation}: 4 rows and 3 columns. Shape [4, 3]`}
                      channel={draft.channel}
                      operation={draft.operation}
                    />
                    <p role="status">
                      Output row {draft.channel}: [
                      {output[draft.channel].join(", ")}].{" "}
                      {draft.operation === "transpose"
                        ? "This row keeps the channel's numbers in their original time order."
                        : "This row mixes numbers from different channels. It has the right length, but it doesn't keep one channel together."}
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
                      <code>{`// Input shape: [time, channel] = [3, 4]\nconst output = input.${draft.operation === "reshape" ? "reshape([4, 3])" : "transpose()"};\n// Read output row ${draft.channel}: output.arraySync()[${draft.channel}]\n// [${output[draft.channel].join(", ")}]\noutput.dispose();`}</code>
                    </pre>
                  </div>
                )}
                <button
                  type="button"
                  className={button}
                  aria-expanded={draft.explanation}
                  aria-controls={`${uid}-explanation`}
                  onClick={() =>
                    update({ explanation: true, predictionHelp: true })
                  }
                >
                  Explain the difference
                </button>
                {draft.explanation && (
                  <div id={`${uid}-explanation`} className="space-y-3">
                    <p>
                      Reshape reads the numbers in their original order, left to
                      right across each row. It starts a new row every 3
                      numbers. Transpose turns each input column into an output
                      row. Neither operation changes the numbers themselves.
                    </p>
                    <p>
                      After transpose, channel {draft.channel} has its own row:
                      [{expected.join(", ")}]. In code, that means
                      output[channel][time] equals input[time][channel].
                    </p>
                    <p>
                      Shape tells you the size of each axis. You still need to
                      know what each axis means, such as time or channel.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className={`${button} block`}
              onClick={() => update({ mode: "check" })}
            >
              Try a new example
            </button>
          </>
        ) : (
          <>
            <h4 className="font-semibold">New example: find channel 1</h4>
            <p>
              Now there are 2 moments and 3 channels. Choose the operation that
              gives each channel its own row. Then enter channel 1&apos;s two
              numbers, from earliest to latest.
            </p>
            <PacketTable
              packet={CHECK_PACKET}
              caption="New input: 2 moments and 3 channels. Shape [2, 3]"
              channel={1}
            />
            <form onSubmit={submitCheck} className="space-y-4">
              <fieldset className="min-w-0 space-y-2">
                <legend className="mb-2 font-medium">
                  How will you make 3 rows and 2 columns?
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
                Channel 1&apos;s two numbers, from earliest to latest
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
                placeholder="Two values separated by a comma"
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
                    ? `Both answers are correct. You answered ${draft.checkResult.assisted ? "with help" : "without help"} on this example. Transpose keeps each channel's numbers together, in time order.`
                    : checkChannelTransfer(
                          draft.checkOperation,
                          draft.checkValues,
                        ).operationCorrect
                      ? "The operation is right. For the numbers, read channel 1's column from top to bottom."
                      : "Reshape also makes shape [3, 2], but groups numbers in their original order. Which operation turns the selected column into one row?"
                  : "We'll check both your operation and channel 1's numbers. Getting the shape alone isn't enough."}
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
                Transpose makes [[10, 11], [20, 21], [30, 31]]. Channel 1&apos;s
                row is [20, 21]. Reshape makes [[10, 20], [30, 11], [21, 31]],
                which splits channel 1 across rows. Your next attempts will be
                marked as using help.
              </p>
            )}
            <p className="text-sm text-text-muted">
              Going back to the first example also counts as using help on this
              one.
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
          <p className="text-sm text-text-muted">
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
            That&apos;s 20 attempts for this task. You can still compare the
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
      <p className="mt-4 text-sm text-text-muted">
        {ready
          ? saved
            ? "Saved in this tab. Refreshing the page will keep your work."
            : "We can't save your work in this tab. You can still use the activity, but your work may be lost when you leave."
          : "Loading your saved work…"}{" "}
        This practice doesn&apos;t complete the lesson. Continue to the
        Challenge section for the coding task.
      </p>
      {notice && (
        <p role="status" className="text-sm">
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
  return (
    <div className="space-y-2">
      <p className="font-medium">
        {caption}. Numbers from the chosen channel have a *.
      </p>
      <div
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-interactive"
        role="region"
        aria-label={`${caption}. Scroll sideways to see the full table if needed.`}
        tabIndex={0}
      >
        <table className="w-full min-w-[14rem] table-fixed border-collapse font-mono text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{operation ? "Row" : "Moment"}</th>
              {packet[0].map((_, c) => (
                <th scope="col" key={c}>
                  {operation ? `Column ${c}` : `Channel ${c}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {packet.map((row, r) => (
              <tr key={r}>
                <th scope="row">{r}</th>
                {row.map((v, c) => {
                  const selected = !operation
                    ? c === channel
                    : operation === "transpose"
                      ? r === channel
                      : (r * packet[0].length + c) % WORKED_PACKET[0].length ===
                        channel;
                  return (
                    <td
                      key={c}
                      className={`border border-border px-1 py-2 text-center ${selected ? "bg-interactive/10 font-semibold text-text" : "text-text-muted"}`}
                    >
                      <span>
                        {v}
                        {selected ? "*" : ""}
                      </span>
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
  const points = (values: number[]) =>
    values.map((v, i) => `${40 + i * 100},${95 - v * 6}`).join(" ");
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 280 125"
        className="block w-full max-w-sm"
        role="img"
        aria-label={`Compare channel ${channel}'s original numbers, ${expected.join(", ")}, with output row ${channel}, ${actual.join(", ")}.`}
      >
        <path
          d="M40 18V95H250"
          fill="none"
          stroke="currentColor"
          opacity="0.4"
        />
        <text x="4" y="99" fill="currentColor" fontSize="11">
          0
        </text>
        <text x="4" y="32" fill="currentColor" fontSize="11">
          11
        </text>
        <polyline
          points={points(expected)}
          fill="none"
          stroke="var(--tc-accent)"
          strokeWidth="3"
        />
        <polyline
          points={points(actual)}
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 3"
          strokeWidth="2"
        />
        {actual.map((v, i) => (
          <circle
            key={i}
            cx={40 + i * 100}
            cy={95 - v * 6}
            r="3"
            fill="currentColor"
          />
        ))}
        {[0, 1, 2].map((t) => (
          <text
            key={t}
            x={40 + t * 100}
            y="113"
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
          >
            Position {t}
          </text>
        ))}
      </svg>
      <figcaption className="text-sm text-text-muted">
        Read from left to right. The solid line follows the selected channel.
        The dashed line with dots follows the output row with the same number.
        Matching lines mean the numbers are in the same order. These numbers
        label positions, not real measurements.
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
