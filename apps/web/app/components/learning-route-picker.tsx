"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  isMLLearningRoute,
  ML_READINESS_QUESTIONS,
  readinessGaps,
  type MLLearningRoute,
} from "@tensorcraft/shared";
import { apiFetch } from "@/lib/api-fetch";
import { EVENTS, track } from "@/lib/analytics-events";

export const GUEST_ROUTE_KEY = "tc_ml_route_guest_v1";
const button =
  "min-h-11 border border-border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50";
interface Props {
  accountId: string | null;
  initialRoute: MLLearningRoute | null;
  unavailable?: boolean;
  source: "world" | "lesson" | "settings";
  showReadiness?: boolean;
}

/** Key the body by account so an auth switch cannot retain another account's choice. */
export function LearningRoutePicker(props: Props) {
  return (
    <LearningRouteBody
      key={`${props.accountId ?? "guest"}:${props.initialRoute ?? "unset"}`}
      {...props}
    />
  );
}
function LearningRouteBody({
  accountId,
  initialRoute,
  unavailable = false,
  source,
  showReadiness = false,
}: Props) {
  const uid = useId(),
    router = useRouter();
  const [route, setRoute] = useState<MLLearningRoute>(initialRoute ?? "guided");
  const [guest, setGuest] = useState<MLLearningRoute | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    try {
      const value = localStorage.getItem(GUEST_ROUTE_KEY);
      if (isMLLearningRoute(value)) {
        if (!accountId) setRoute(value);
        else if (value !== (initialRoute ?? "guided")) setGuest(value);
      }
    } catch {
      setStatus(
        "Browser preferences are unavailable. You can still choose a starting lesson.",
      );
    }
  }, [accountId, initialRoute]);
  async function choose(next: MLLearningRoute, adopt = false) {
    setSaving(true);
    setStatus("");
    try {
      if (accountId) {
        const response = await apiFetch("/api/onboarding", {
          method: "PATCH",
          body: JSON.stringify({ ml_learning_route: next }),
        });
        if (!response.ok) throw new Error("save");
        if (adopt) {
          try {
            localStorage.removeItem(GUEST_ROUTE_KEY);
          } catch {
            /* Account choice is already saved. */
          }
          setGuest(null);
        }
      } else {
        try {
          localStorage.setItem(GUEST_ROUTE_KEY, next);
        } catch {
          setRoute(next);
          setStatus(
            "Selected for this page. Browser storage is unavailable, so it will not survive a reload.",
          );
          return;
        }
      }
      setRoute(next);
      setStatus(
        accountId
          ? "Course preference saved to your account."
          : "Course preference saved in this browser.",
      );
      track(EVENTS.LEARNING_ROUTE_SELECTED, {
        worldId: "deep-orbit",
        route: next,
        source,
        persistence: accountId ? "account" : "browser",
      });
      if (accountId) router.refresh();
    } catch {
      setStatus(
        "The preference could not be saved. Your previous choice is unchanged. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="learning-route-picker my-6 space-y-4 border border-border bg-surface p-5 text-text"
    >
      <h2 id={`${uid}-title`} className="text-xl font-semibold">
        Choose your way through Deep Orbit
      </h2>
      <p className="text-sm text-text-muted">
        This describes your ML background. Your JavaScript experience is a
        separate preference. Change routes whenever you need to; your completed
        work stays recorded.
      </p>
      <div
        className="grid gap-3 md:grid-cols-2"
        role="group"
        aria-label="ML learning route"
      >
        <button
          type="button"
          className={`${button} text-left`}
          aria-pressed={route === "guided"}
          disabled={saving}
          onClick={() => void choose("guided")}
        >
          <span className="block font-semibold">
            Learn ML from the beginning
          </span>
          <span className="mt-2 block">
            Follow the lessons, examples, and practice in order.
          </span>
        </button>
        <button
          type="button"
          className={`${button} text-left`}
          aria-pressed={route === "challenge"}
          disabled={saving}
          onClick={() => void choose("challenge")}
        >
          <span className="block font-semibold">
            I know the basics; show me the engineering challenges
          </span>
          <span className="mt-2 block">
            Start with runtime and evaluation work. Keep explanations and story
            available.
          </span>
        </button>
      </div>
      {unavailable && (
        <p role="status" className="text-sm">
          Your saved account preference could not be loaded. The guided route is
          shown as a fallback. Reload to retry before replacing a prior choice.
        </p>
      )}
      {guest && (
        <div className="space-y-2">
          <p>
            This browser has a different guest preference:{" "}
            {guest === "challenge"
              ? "engineering challenges"
              : "guided learning"}
            . Your account preference has been kept.
          </p>
          <button
            className={button}
            disabled={saving}
            onClick={() => void choose(guest, true)}
          >
            Use the browser preference for my account
          </button>
        </div>
      )}
      <p role="status" className="text-sm">
        {saving ? "Saving preference…" : status}
      </p>
      {source !== "settings" && (
        <div className="flex flex-wrap gap-3">
          <Link
            className={`${button} underline underline-offset-4`}
            href={
              route === "challenge"
                ? "/worlds/deep-orbit/browser-runtimes/why-the-browser?start=challenge"
                : "/worlds/deep-orbit/foundations/introduction-to-tensors"
            }
          >
            {route === "challenge"
              ? "Open the runtime challenge"
              : "Start with the first lesson"}
          </Link>
          <Link
            className={`${button} underline underline-offset-4`}
            href="/worlds/deep-orbit/foundations/tensor-shapes?start=experiment"
          >
            Try the free channel experiment
          </Link>
        </div>
      )}
      {route === "challenge" && source !== "settings" && (
        <p className="text-sm text-text-muted">
          The first module is free. Later modules need Deep Orbit access and
          open in order, once the module before is complete.
        </p>
      )}
      {showReadiness && <ReadinessCheck />}
    </section>
  );
}

function ReadinessCheck() {
  const uid = useId();
  const [answers, setAnswers] = useState<(number | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [submitted, setSubmitted] = useState(false);
  const gaps = readinessGaps(answers);
  return (
    <details className="border-t border-border pt-4">
      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">
        Optional: check which foundations to revisit
      </summary>
      <p className="my-4 text-sm text-text-muted">
        Four questions suggest a starting point. They do not award credit or
        restrict access.
      </p>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        {ML_READINESS_QUESTIONS.map((question, index) => (
          <fieldset className="space-y-2" key={question.id}>
            <legend className="mb-2 font-medium">{question.question}</legend>
            {question.options.map((option, optionIndex) => (
              <label className="flex min-h-11 items-start gap-3" key={option}>
                <input
                  className="mt-1"
                  type="radio"
                  name={`${uid}-${question.id}`}
                  checked={answers[index] === optionIndex}
                  onChange={() => {
                    setAnswers(
                      answers.map((value, i) =>
                        i === index ? optionIndex : value,
                      ),
                    );
                    setSubmitted(false);
                  }}
                />
                {option}
              </label>
            ))}
            {submitted && (
              <p className="text-sm text-text-muted">{question.explanation}</p>
            )}
          </fieldset>
        ))}
        <button
          className={button}
          disabled={answers.some((answer) => answer === null)}
        >
          Show suggested review
        </button>
      </form>
      {submitted && (
        <div className="mt-4 space-y-3" role="status">
          <p>
            {gaps.length
              ? "Revisit these ideas before the engineering challenges:"
              : "These foundations are familiar. Browser runtimes is a reasonable place to start; revisit earlier lessons as needed."}
          </p>
          {gaps.map(({ id, review }) => (
            <Link
              key={id}
              className="block underline underline-offset-4"
              href={`/worlds/deep-orbit/${review.module}/${review.lesson}?start=concept`}
            >
              {review.label}
            </Link>
          ))}
          {!gaps.length && (
            <Link
              className="block underline underline-offset-4"
              href="/worlds/deep-orbit/browser-runtimes/why-the-browser?start=challenge"
            >
              Open browser runtimes
            </Link>
          )}
        </div>
      )}
    </details>
  );
}
