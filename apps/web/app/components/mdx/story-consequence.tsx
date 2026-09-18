"use client";

import { useEffect, useState } from "react";
import {
  BOSS_BEAT_CHANGED,
  getBossBeatChoice,
  type BossBeatChoiceLabel,
} from "@/lib/boss-beat-client";

/** A later scene reads the same account-scoped record as its decision. */
export function StoryConsequence({
  beatId,
  outcomes,
  fallback,
}: {
  beatId: string;
  outcomes: Record<BossBeatChoiceLabel, string>;
  /** Neutral continuation for readers who skipped the optional decision. */
  fallback: string;
}) {
  const [state, setState] = useState<{
    beatId: string;
    status: "loading" | "ready" | "error";
    label?: BossBeatChoiceLabel;
  }>({ beatId, status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let request = 0;
    async function read() {
      const current = ++request;
      setState({ beatId, status: "loading" });
      try {
        const choice = await getBossBeatChoice(beatId);
        if (active && request === current)
          setState({ beatId, status: "ready", label: choice?.choiceLabel });
      } catch {
        if (active && request === current)
          setState({ beatId, status: "error" });
      }
    }
    function changed(event: Event) {
      if ((event as CustomEvent<string>).detail === beatId) void read();
    }
    void read();
    window.addEventListener(BOSS_BEAT_CHANGED, changed);
    return () => {
      active = false;
      window.removeEventListener(BOSS_BEAT_CHANGED, changed);
    };
  }, [beatId, attempt]);

  if (state.beatId !== beatId || state.status === "loading")
    return <p role="status">Loading the decision record…</p>;
  if (state.status === "error")
    return (
      <div role="alert" className="my-4">
        <p>This scene needs your saved decision. We could not load it.</p>
        <button
          type="button"
          className="border border-border px-4 py-2"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Retry scene
        </button>
      </div>
    );
  return (
    <p
      data-testid="story-consequence"
      data-beat-id={beatId}
      data-choice-label={state.label ?? "unrecorded"}
    >
      {state.label ? outcomes[state.label] : fallback}
    </p>
  );
}
