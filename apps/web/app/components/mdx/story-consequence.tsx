"use client";
import { ProseText } from "@tensorcraft/ui/prose-text";

import { useEffect, useState } from "react";
import { STORY_HISTORY } from "@tensorcraft/shared";
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
  contentVersion = 1,
}: {
  beatId: string;
  outcomes: Record<BossBeatChoiceLabel, string>;
  /** Neutral continuation for readers who skipped the optional decision. */
  fallback: string;
  contentVersion?: number;
}) {
  const [state, setState] = useState<{
    beatId: string;
    status: "loading" | "ready" | "error";
    label?: BossBeatChoiceLabel;
    contentVersion?: number;
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
          setState({
            beatId,
            status: "ready",
            label: choice?.choiceLabel,
            contentVersion: choice?.contentVersion ?? 1,
          });
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
        <p>
          <ProseText>{fallback}</ProseText>
        </p>
        <button
          type="button"
          className="min-h-11 border border-border px-4 py-2"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Retry scene
        </button>
      </div>
    );
  const savedVersion = state.contentVersion ?? 1;
  const matchingOutcomes =
    savedVersion === contentVersion
      ? outcomes
      : STORY_HISTORY[beatId]?.[savedVersion]?.outcomes;
  return (
    <p
      data-testid="story-consequence"
      data-beat-id={beatId}
      data-choice-label={state.label ?? "unrecorded"}
      data-content-version={state.label ? savedVersion : undefined}
    >
      <ProseText>
        {state.label && matchingOutcomes
          ? matchingOutcomes[state.label]
          : fallback}
      </ProseText>
      {state.label && !matchingOutcomes && (
        <span className="block text-sm text-text-muted">
          Your saved call needs a different scene version. Reload to read its
          continuation.
        </span>
      )}
    </p>
  );
}
