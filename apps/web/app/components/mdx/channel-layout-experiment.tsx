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
        "The previous experiment draft could not be read. This packet starts fresh; your lesson and editor progress are unchanged.",
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
        Channel experiment
      </p>
      <h3 id={`${uid}-title`}>Give the plotter one row per sensor</h3>
      <p>
        Rows arrive in time order. Each column belongs to one channel. These
        numbers mark positions in a small teaching packet; they are not signal
        measurements.
      </p>
      <fieldset disabled={!ready} className="min-w-0 space-y-5">
        <legend className="sr-only">Channel layout controls</legend>
        {draft.mode === "worked" ? (
          <>
            <label
              className="flex flex-wrap items-center gap-3"
              htmlFor={`${uid}-channel`}
            >
              Inspect channel
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
                    {channel}
                  </option>
                ))}
              </select>
            </label>
            <PacketTable
              packet={WORKED_PACKET}
              caption="Input: [3 times, 4 channels]"
              channel={draft.channel}
            />
            <form onSubmit={submitPrediction} className="space-y-3">
              <label
                htmlFor={`${uid}-prediction`}
                className="block font-medium"
              >
                Predict channel {draft.channel}&apos;s values in time order
              </label>
              <input
                id={`${uid}-prediction`}
                className={input}
                autoComplete="off"
                maxLength={80}
                placeholder="Values separated by commas"
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
                    ? "Those are the channel's readings, in time order. Now compare how each operation arranges them."
                    : "Follow the selected column from top to bottom. A row contains different channels at one time."
                  : "A prediction is optional. You can try either operation or open the explanation."}
              </p>
            </form>
            <div>
              <p>
                Both operations produce shape [4, 3]. Which keeps a channel
                together?
              </p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Compare layout operations"
              >
                {(["reshape", "transpose"] as const).map((operation) => (
                  <button
                    type="button"
                    key={operation}
                    className={button}
                    aria-pressed={draft.operation === operation}
                    onClick={() => update({ operation, predictionHelp: true })}
                  >
                    {operation === "reshape" ? "Run reshape" : "Run transpose"}
                  </button>
                ))}
              </div>
            </div>
            {output && draft.operation && (
              <div className="space-y-3" data-testid="channel-result">
                <PacketTable
                  packet={output}
                  caption={`Output: [4, 3] after ${draft.operation}`}
                  channel={draft.channel}
                  operation={draft.operation}
                />
                <p role="status">
                  Plotter row {draft.channel}: [
                  {output[draft.channel].join(", ")}].{" "}
                  {draft.operation === "transpose"
                    ? "It contains this channel's readings in time order."
                    : "It mixes channels. The shape fits, but the values do not."}
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
                  <code>{`// input shape: [time, channel] = [3, 4]\nconst output = input.${draft.operation === "reshape" ? "reshape([4, 3])" : "transpose()"};\n// plotter reads output.arraySync()[${draft.channel}]\n// [${output[draft.channel].join(", ")}]\noutput.dispose();`}</code>
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
              <p id={`${uid}-explanation`}>
                Reshape reads the flat sequence 0 through 11 in the same order
                and changes where rows end. Transpose swaps the two axes:
                output[channel][time] equals input[time][channel]. For channel{" "}
                {draft.channel}, that gives [{expected.join(", ")}]. Shape
                describes axis sizes; you must also know what the axes mean.
              </p>
            )}
            <button
              type="button"
              className={`${button} block`}
              onClick={() => update({ mode: "check" })}
            >
              Try a different packet
            </button>
          </>
        ) : (
          <>
            <h4 className="font-semibold">New packet: collect channel 1</h4>
            <p>
              The input now has two times and three channels. Choose the
              operation and give channel 1&apos;s two values in time order. The
              plotter still needs one row per channel.
            </p>
            <PacketTable
              packet={CHECK_PACKET}
              caption="New input: [2 times, 3 channels]"
              channel={1}
            />
            <form onSubmit={submitCheck} className="space-y-4">
              <fieldset className="min-w-0 space-y-2">
                <legend className="mb-2 font-medium">
                  Operation for shape [3, 2]
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
                        : "Transpose the axes"}
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="block font-medium" htmlFor={`${uid}-check`}>
                Channel 1 values, in time order
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
                Check new packet
              </button>
              <p role="status">
                {draft.checkResult
                  ? draft.checkResult.correct
                    ? `Changed case passed${draft.checkResult.assisted ? " with help" : " without opening this check's answer"}. Transpose puts each channel's times in one row.`
                    : checkChannelTransfer(
                          draft.checkOperation,
                          draft.checkValues,
                        ).operationCorrect
                      ? "The axes are in the right order. Check the values by following channel 1 down the input column."
                      : "Reshape also produces [3, 2], but keeps the flat order. Follow channel 1's values and check whether they land together."
                  : "This checks the operation and the values. Dimensions alone cannot pass."}
              </p>
            </form>
            <button
              type="button"
              className={button}
              aria-expanded={draft.checkAnswer}
              aria-controls={`${uid}-help`}
              onClick={() => update({ checkHelp: true, checkAnswer: true })}
            >
              Show this check&apos;s answer
            </button>
            {draft.checkAnswer && (
              <p id={`${uid}-help`}>
                Transpose gives [[10, 11], [20, 21], [30, 31]]. Channel 1 is
                [20, 21]. Reshape gives [[10, 20], [30, 11], [21, 31]]. Using
                this answer is recorded as help for later attempts.
              </p>
            )}
            <p className="text-sm text-text-muted">
              Returning to the worked packet also records reference use for this
              check.
            </p>
            <button
              type="button"
              className={button}
              onClick={() => update({ mode: "worked", checkHelp: true })}
            >
              Return to worked packet
            </button>
          </>
        )}
        {(draft.firstPrediction || draft.firstCheck) && (
          <p className="text-sm text-text-muted">
            First {draft.firstCheck ? "changed-case" : "prediction"} attempt:{" "}
            {(draft.firstCheck ?? draft.firstPrediction)!.correct
              ? "correct"
              : "needs another look"}
            {(draft.firstCheck ?? draft.firstPrediction)!.assisted
              ? ", with help"
              : ", before answer help"}
            . Retries keep this record.
          </p>
        )}
        {(draft.predictionAttempts >= 20 || draft.checkAttempts >= 20) && (
          <p>
            Twenty attempts are recorded for this task. You can keep comparing
            the packets and use the existing coding challenge.
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
          Reset controls
        </button>
      </fieldset>
      <p className="mt-4 text-sm text-text-muted">
        {ready
          ? saved
            ? "Saved in this browser tab, including on refresh."
            : "Tab storage is unavailable; this experiment stays usable until you leave."
          : "Loading experiment draft…"}{" "}
        This activity does not mark the lesson complete. Continue through the
        lesson to its coding challenge.
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
        {caption}. Selected channel values are marked *.
      </p>
      <div
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-interactive"
        role="region"
        aria-label={`${caption}. Scroll horizontally if the table is enlarged.`}
        tabIndex={0}
      >
        <table className="w-full min-w-[14rem] table-fixed border-collapse font-mono text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{operation ? "Row" : "Time"}</th>
              {packet[0].map((_, c) => (
                <th scope="col" key={c}>
                  {operation ? `Col ${c}` : `Ch ${c}`}
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
        aria-label={`Position markers by time. Channel ${channel}: ${expected.join(", ")}. Plotter row ${channel}: ${actual.join(", ")}.`}
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
            t{t}
          </text>
        ))}
      </svg>
      <figcaption className="text-sm text-text-muted">
        Position markers over time. Solid: selected input channel. Dashed with
        dots: plotter row. The tables contain the same values.
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
