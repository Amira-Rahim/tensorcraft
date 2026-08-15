"use client";

/**
 * Onboarding page brutalist redesign.
 *
 * 4-step wizard: Welcome → Background → Goal → Ready.
 *
 * World selection was removed when the launch was scoped down to Deep Orbit
 * only. Every learner is auto-routed to /worlds/deep-orbit on submit. When a
 * second world launches, restore a World step (filtered to LAUNCHED_WORLDS).
 *
 * State is local-first; all selections are held in React state and committed
 * together on the final "Start Deep Orbit" CTA. The final submit:
 *   1. PATCH `/api/onboarding` with the canonical enum payload (experience_level,
 *      learning_goal, fe_background, fe_framework, fe_experience_years) so the
 *      server-side validator in `apps/api/src/routes/onboarding.ts` enforces the
 *      same CHECK constraints as the DB.
 *   2. Marks `profiles.onboarding_completed = true` via the browser Supabase
 *      client (the column is not part of the onboarding PATCH contract).
 *   3. Tags the user as onboarded in Kit via `/api/email`.
 *   4. Routes the learner to /worlds/deep-orbit.
 *
 * Keyboard navigation:
 *   - Enter (outside textareas) → advance to next step when allowed.
 *   - Shift+Tab on the first focusable element falls back to the browser's
 *     native focus behavior; a dedicated "Back" button is always present from
 *     step 2 onward.
 *   - Arrow keys within radio groups cycle options (handled via role="radiogroup").
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { WORLD_CONTENT, DEFAULT_WORLD } from "@tensorcraft/shared";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { surfacePlateSrc } from "@/lib/location-art";
import { AmbientBackground } from "@/app/components/ambient-background";
import { trackWorldSelected } from "@/lib/analytics";
import { EVENTS, track } from "@/lib/analytics-events";
import { getApiUrl } from "@/lib/api-url";
import { ERROR_MESSAGES } from "@/lib/error-messages";

const LAUNCH_WORLD_SLUG = "deep-orbit";
const LAUNCH_WORLD_NAME = "Deep Orbit";

// ---------------------------------------------------------------------------
// Canonical enum values, MUST match migration 018 CHECK constraints.
// ---------------------------------------------------------------------------

const EXPERIENCE_LEVELS = [
  {
    id: "beginner" as const,
    label: "Beginner",
    desc: "New to frontend or still learning the basics",
  },
  {
    id: "intermediate" as const,
    label: "Intermediate",
    desc: "Comfortable shipping features in a framework",
  },
  {
    id: "advanced" as const,
    label: "Advanced",
    desc: "Leading features, mentoring, tuning perf",
  },
  {
    id: "expert" as const,
    label: "Expert",
    desc: "Architecting systems, writing libraries, setting direction",
  },
];

type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]["id"];

const LEARNING_GOALS = [
  { id: "hobby" as const, label: "Exploring for fun" },
  { id: "career" as const, label: "Switching to ML engineering" },
  { id: "research" as const, label: "Academic research" },
  { id: "team" as const, label: "Team training" },
  { id: "curiosity" as const, label: "Just curious" },
];

type LearningGoal = (typeof LEARNING_GOALS)[number]["id"];

const STEPS = ["Welcome", "Background", "Goal", "Ready"] as const;

// The Ready step's establishing shot (lib/location-art.ts). Onboarding is
// world-agnostic today: it hands every learner to the default world.
const READY_PLATE_SRC = surfacePlateSrc(DEFAULT_WORLD, "onboarding");
type StepIndex = 0 | 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);

  // Background step
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [feBackground, setFeBackground] = useState<string>("");
  const [years, setYears] = useState<string>("");

  // Goal step
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);

  // Submit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Funnel instrumentation: one event per wizard step so per-step drop-off
  // is measurable (step is 1-based to match the "STEP N OF 4" label).
  useEffect(() => {
    track(EVENTS.ONBOARDING_STEP_VIEWED, {
      step: step + 1,
      stepName: STEPS[step],
    });
  }, [step]);

  const yearsAsNumber = years === "" ? null : Number(years);
  const yearsValid =
    yearsAsNumber === null ||
    (Number.isInteger(yearsAsNumber) &&
      yearsAsNumber >= 0 &&
      yearsAsNumber <= 50);

  // Per-step validation. Only Background/Goal have required fields.
  const canAdvance = useCallback((): boolean => {
    if (step === 1) return experienceLevel !== null && yearsValid;
    if (step === 2) return learningGoal !== null;
    return true;
  }, [step, experienceLevel, yearsValid, learningGoal]);

  const goNext = useCallback(() => {
    setStepError(null);
    if (!canAdvance()) {
      if (step === 1 && experienceLevel === null) {
        setStepError("Pick an experience level to continue.");
      } else if (step === 1 && !yearsValid) {
        setStepError("Experience years must be a whole number 0-50.");
      } else if (step === 2) {
        setStepError("Pick a goal to continue.");
      }
      return;
    }
    setStep((s) => Math.min(3, (s + 1) as StepIndex) as StepIndex);
  }, [canAdvance, step, experienceLevel, yearsValid]);

  const goBack = useCallback(() => {
    setStepError(null);
    setStep((s) => Math.max(0, (s - 1) as StepIndex) as StepIndex);
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!experienceLevel || !learningGoal) {
      setError("Missing required fields.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession) {
        setError("You must be signed in to complete onboarding.");
        setSaving(false);
        return;
      }

      // 1. PATCH /api/onboarding, writes experience_level, learning_goal,
      //    fe_background, fe_framework, fe_experience_years via the
      //    service-role endpoint.
      // V1 is React-only. fe_framework is always submitted as "react" so the
      // profile column is populated (no framework-selection step exists).
      const payload: Record<string, unknown> = {
        experience_level: experienceLevel,
        learning_goal: learningGoal,
        fe_framework: "react",
      };
      if (feBackground.trim().length > 0) {
        payload.fe_background = feBackground.trim().slice(0, 200);
      }
      if (yearsAsNumber !== null) payload.fe_experience_years = yearsAsNumber;

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/onboarding`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Failed to save onboarding.");
        setSaving(false);
        return;
      }

      // 2. Mark onboarding complete. preferred_world_id is no longer set -
      //    the active world is route-derived now. (Column kept as tombstone.)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // The result of this write MUST be checked. Middleware forces any
        // profile with `onboarding_completed = false` back to /onboarding
        // (lib/supabase/middleware.ts), so a silently failed update meant the
        // learner finished the wizard, got routed onward, and was immediately
        // bounced back into it - an infinite loop on first run, with no error
        // and no way out.
        const { error: completeError } = await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);

        if (completeError) {
          setError(ERROR_MESSAGES.unknown);
          setSaving(false);
          return;
        }

        // Mint a fresh JWT so it carries the updated onboarding_completed claim
        // (custom access token hook, migration 046) immediately - otherwise the
        // learner's current token still reads false and middleware would bounce
        // the very next protected navigation back into onboarding until the
        // token refreshed on its own (middleware treats a PRESENT false claim
        // as authoritative; the profiles fallback only covers an ABSENT one).
        // A failed refresh is therefore worth one retry - but never worth
        // blocking completion over: the DB row is already true, so the worst
        // case is a bounce that resolves at the next natural token refresh.
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          const { error: retryError } = await supabase.auth.refreshSession();
          if (retryError) {
            console.warn(
              "[onboarding] token refresh failed; stale onboarding_completed claim until next refresh",
              retryError,
            );
          }
        }
      }

      // 3. Tag onboarded in Kit (best-effort).
      fetch(`${apiUrl}/api/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ event: "onboarded" }),
      }).catch(() => {});

      // 4. Route to the launched world.
      track(EVENTS.ONBOARDING_COMPLETED, {
        experienceLevel,
        learningGoal,
        framework: "react",
        ...(yearsAsNumber !== null ? { yearsExperience: yearsAsNumber } : {}),
      });
      trackWorldSelected(LAUNCH_WORLD_SLUG);
      // Return the learner to wherever they were headed when the wizard
      // intercepted them (middleware passes it through); same-origin
      // relative paths only, everything else falls back to the world.
      const requested = new URLSearchParams(window.location.search).get(
        "redirectTo",
      );
      // Open-redirect guard: accept only a real same-origin path. Must
      // start with a single "/" AND the next char must not be another
      // "/" or a backslash - browsers normalize "/\evil.com" to
      // "//evil.com" (protocol-relative → offsite). Reject control chars
      // too, in case a crafted param slipped past URL decoding.
      const isSafePath =
        !!requested &&
        requested.length > 1 &&
        requested[0] === "/" &&
        requested[1] !== "/" &&
        requested[1] !== "\\" &&
        // eslint-disable-next-line no-control-regex
        !/[\u0000-\u001f]/.test(requested);
      const safeTarget = isSafePath
        ? (requested as string)
        : `/worlds/${LAUNCH_WORLD_SLUG}`;
      router.push(safeTarget);
    } catch (e) {
      setError(e instanceof Error ? e.message : ERROR_MESSAGES.unknown);
      setSaving(false);
    }
  }, [experienceLevel, learningGoal, feBackground, yearsAsNumber, router]);

  // Global Enter-to-advance (outside textarea / button / select).
  const wizardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wizardRef.current;
    if (!el) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "TEXTAREA") return;
      if (tag === "BUTTON") return;
      e.preventDefault();
      if (step === 3) {
        void completeOnboarding();
      } else {
        goNext();
      }
    }
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [step, goNext, completeOnboarding]);

  return (
    <div
      className="min-h-screen bg-page flex flex-col items-center px-6 py-16 relative overflow-hidden"
      ref={wizardRef}
      data-testid="onboarding-wizard"
    >
      <AmbientBackground count={160} />

      {/* Logo */}
      <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-text-primary mb-12 relative z-10">
        <span className="bg-primary text-on-primary px-1.5 py-0.5 text-xs font-bold rounded-none">
          T_
        </span>
        TENSORCRAFT
      </div>

      {/* Progress indicator, segmented mono pips + "Step N of 5" text. */}
      <div
        className="flex flex-col items-center gap-3 mb-12 relative z-10"
        role="group"
        aria-label="Onboarding progress"
        data-testid="onboarding-progress"
      >
        <div
          className="font-mono text-xs text-text-muted tracking-[0.15em]"
          data-testid="onboarding-step-text"
        >
          STEP {step + 1} OF {STEPS.length} · {STEPS[step].toUpperCase()}
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              data-testid={`step-pip-${i}`}
              className="h-1.5 w-10 rounded-none transition-colors"
              style={{
                background:
                  i <= step ? "var(--tc-primary)" : "var(--tc-border)",
                opacity: i < step ? 0.55 : 1,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full max-w-[720px] px-4 md:px-8 flex flex-col items-center relative z-10">
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <BackgroundStep
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            feBackground={feBackground}
            setFeBackground={setFeBackground}
            years={years}
            setYears={setYears}
            yearsValid={yearsValid}
          />
        )}
        {step === 2 && (
          <GoalStep goal={learningGoal} setGoal={setLearningGoal} />
        )}
        {step === 3 && (
          <ReadyStep
            experienceLevel={experienceLevel}
            learningGoal={learningGoal}
            feBackground={feBackground}
            years={yearsAsNumber}
          />
        )}

        {/* Inline error slot */}
        {stepError && (
          <div
            role="alert"
            data-testid="onboarding-step-error"
            className="mt-6 font-mono text-xs text-primary border-2 border-primary bg-surface px-4 py-2 rounded-none"
          >
            {stepError}
          </div>
        )}
        {error && (
          <div
            role="alert"
            data-testid="onboarding-submit-error"
            className="mt-6 font-mono text-xs text-primary border-2 border-primary bg-surface px-4 py-2 rounded-none"
          >
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 justify-center mt-10 mb-16">
          {step > 0 && (
            <button
              type="button"
              data-testid="onboarding-back"
              onClick={goBack}
              disabled={saving}
              className="px-7 py-3 font-mono text-xs uppercase tracking-[0.1em] text-text-primary border-2 border-interactive bg-transparent rounded-none hover:border-primary/60 transition-all brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50"
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              data-testid="onboarding-next"
              onClick={goNext}
              className="px-7 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-on-primary bg-primary border-2 border-primary rounded-none hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 0 ? "Begin Briefing →" : "Continue →"}
            </button>
          ) : (
            <button
              type="button"
              data-testid="onboarding-submit"
              onClick={completeOnboarding}
              disabled={saving}
              className="px-7 py-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-on-primary bg-primary border-2 border-primary rounded-none hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Launching..." : `Start ${LAUNCH_WORLD_NAME} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Step components
// ===========================================================================

function WelcomeStep() {
  const features = [
    {
      icon: "◎",
      // Lesson-embedded bridge count, single-sourced with /learn and the FAQ.
      name: `${WORLD_CONTENT.lessonBridges} FE Bridges`,
      desc: "Every concept mapped to React/JS",
    },
    {
      icon: "◉",
      name: "Story-Driven",
      desc: "11 modules aboard the Archimedes",
    },
    { icon: "⌘", name: "Build Real ML", desc: "Ship a classifier by module 3" },
  ];
  return (
    <div
      className="flex flex-col items-center text-center w-full animate-fade-up"
      data-testid="step-welcome"
    >
      <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
        MISSION BRIEFING
      </div>
      <h1 className="font-mono text-4xl md:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-4">
        Welcome Aboard
        <br />
        the <span className="text-primary">Archimedes</span>
      </h1>
      <p className="text-base text-text-muted leading-relaxed max-w-[500px] mb-10 font-sans">
        You&apos;re a frontend engineer. You&apos;re about to learn ML, not by
        re-learning math, but by mapping it to what you already know.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 w-full mb-4">
        {features.map((f) => (
          <div
            key={f.name}
            className="border-2 border-border bg-surface-raised p-7 text-center rounded-none"
          >
            <div className="font-mono text-[22px] text-primary mb-3">
              <span aria-hidden="true">{f.icon}</span>
            </div>
            <div className="font-mono text-xs font-bold text-text-primary mb-1.5">
              {f.name}
            </div>
            <div className="text-xs text-text-muted leading-relaxed">
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackgroundStep(props: {
  experienceLevel: ExperienceLevel | null;
  setExperienceLevel: (v: ExperienceLevel) => void;
  feBackground: string;
  setFeBackground: (v: string) => void;
  years: string;
  setYears: (v: string) => void;
  yearsValid: boolean;
}) {
  const {
    experienceLevel,
    setExperienceLevel,
    feBackground,
    setFeBackground,
    years,
    setYears,
    yearsValid,
  } = props;
  return (
    <div
      className="flex flex-col items-center text-center w-full animate-fade-up"
      data-testid="step-background"
    >
      <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
        CREW ASSESSMENT
      </div>
      <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
        Tell us about your FE background
      </h2>
      <p className="text-sm text-text-muted mb-8 font-sans max-w-[480px]">
        Advanced and expert crew get the math derivations opened by default
        inside lessons; everyone else keeps them one click away. Only experience
        level is required.
      </p>

      {/* experience_level, required radio group */}
      <fieldset
        className="w-full text-left mb-8"
        data-testid="experience-fieldset"
      >
        <legend className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted mb-3">
          Experience level<span className="text-primary"> *</span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Experience level"
          data-testid="experience-radiogroup"
          className="flex flex-col gap-0.5"
          onKeyDown={makeArrowHandler(
            EXPERIENCE_LEVELS,
            experienceLevel,
            (id) => setExperienceLevel(id),
          )}
        >
          {EXPERIENCE_LEVELS.map((lvl) => {
            const selected = experienceLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-testid={`experience-${lvl.id}`}
                onClick={() => setExperienceLevel(lvl.id)}
                className={`flex items-start gap-4 px-6 py-4 text-left transition-all border-2 rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                  selected
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-interactive hover:border-primary/40"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 mt-0.5 rounded-none"
                  style={{
                    border: `2px solid ${selected ? "var(--tc-primary)" : "var(--tc-muted)"}`,
                    background: selected ? "var(--tc-primary)" : "transparent",
                  }}
                />
                <span className="flex flex-col gap-0.5">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{
                      color: selected ? "var(--tc-text)" : "var(--tc-muted)",
                    }}
                  >
                    {lvl.label}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {lvl.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* fe_experience_years, optional number */}
      <div className="w-full text-left mb-8">
        <label
          htmlFor="fe-experience-years"
          className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted mb-3 block"
        >
          Years of FE experience
        </label>
        <input
          id="fe-experience-years"
          data-testid="fe-experience-years"
          type="number"
          min={0}
          max={50}
          step={1}
          inputMode="numeric"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          placeholder="0-50"
          className="w-full md:w-40 font-mono text-sm bg-surface border-2 border-interactive rounded-none px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus:border-primary"
        />
        {!yearsValid && (
          <p
            role="alert"
            data-testid="fe-years-error"
            className="mt-2 font-mono text-xs text-primary"
          >
            Experience years must be a whole number 0-50.
          </p>
        )}
      </div>

      {/* fe_background, optional free-text */}
      <div className="w-full text-left">
        <label
          htmlFor="fe-background"
          className="font-mono text-xs uppercase tracking-[0.12em] text-text-muted mb-3 block"
        >
          Anything else about your background?
        </label>
        <textarea
          id="fe-background"
          data-testid="fe-background"
          value={feBackground}
          onChange={(e) => setFeBackground(e.target.value.slice(0, 200))}
          rows={3}
          maxLength={200}
          placeholder="Shipped a Next.js dashboard, tinkered with WebGL, etc."
          className="w-full font-mono text-xs bg-surface border-2 border-interactive rounded-none px-4 py-3 text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus:border-primary resize-none"
        />
        <div className="font-mono text-[11px] text-text-muted mt-1">
          {feBackground.length}/200
        </div>
      </div>
    </div>
  );
}

function GoalStep(props: {
  goal: LearningGoal | null;
  setGoal: (v: LearningGoal) => void;
}) {
  const { goal, setGoal } = props;
  return (
    <div
      className="flex flex-col items-center text-center w-full animate-fade-up"
      data-testid="step-goal"
    >
      <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
        MISSION OBJECTIVE
      </div>
      <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
        What&apos;s your goal?
      </h2>
      <p className="text-sm text-text-muted mb-10 font-sans">
        This tells us which bridges and future worlds to build next.
      </p>
      <fieldset className="w-full text-left">
        <legend className="sr-only">Learning goal</legend>
        <div
          role="radiogroup"
          aria-label="Learning goal"
          data-testid="goal-radiogroup"
          className="flex flex-col gap-0.5 w-full"
          onKeyDown={makeArrowHandler(LEARNING_GOALS, goal, (id) =>
            setGoal(id),
          )}
        >
          {LEARNING_GOALS.map((g) => {
            const selected = goal === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-testid={`goal-${g.id}`}
                data-value={g.id}
                onClick={() => setGoal(g.id)}
                className={`flex items-center gap-4 px-6 py-4 text-left transition-all border-2 rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                  selected
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-interactive hover:border-primary/40"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 rounded-none"
                  style={{
                    border: `2px solid ${selected ? "var(--tc-primary)" : "var(--tc-muted)"}`,
                    background: selected ? "var(--tc-primary)" : "transparent",
                  }}
                />
                <span
                  className="font-mono text-xs"
                  style={{
                    color: selected ? "var(--tc-text)" : "var(--tc-muted)",
                  }}
                >
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function ReadyStep(props: {
  experienceLevel: ExperienceLevel | null;
  learningGoal: LearningGoal | null;
  feBackground: string;
  years: number | null;
}) {
  const { experienceLevel, learningGoal, feBackground, years } = props;

  const rows: Array<[string, string]> = [
    ["World", `${LAUNCH_WORLD_NAME} (live now)`],
    [
      "Experience",
      experienceLevel
        ? (EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label ??
          experienceLevel)
        : "Not set",
    ],
    [
      "Goal",
      learningGoal
        ? (LEARNING_GOALS.find((g) => g.id === learningGoal)?.label ??
          learningGoal)
        : "Not set",
    ],
    ["Framework", "React"],
    ["Years", years === null ? "Skipped" : `${years}`],
    ["Notes", feBackground.trim().length > 0 ? feBackground.trim() : "Skipped"],
  ];

  return (
    <div
      className="flex flex-col items-center text-center w-full animate-fade-up"
      data-testid="step-ready"
    >
      <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
        LAUNCH SEQUENCE
      </div>
      {/* The launch moment lands on the Bridge, the room the learner is
          being handed to. The ◎ glyph is both the art-less render and the
          failure fallback (ArtPlate contract): never a hole. */}
      {READY_PLATE_SRC ? (
        <div className="w-full max-w-md mb-4" aria-hidden="true">
          <ArtPlate
            src={READY_PLATE_SRC}
            fallback={<div className="font-mono text-5xl text-primary">◎</div>}
          />
        </div>
      ) : (
        <div className="font-mono text-5xl text-primary mb-4">◎</div>
      )}
      <h2 className="font-mono text-[30px] font-bold text-text-primary tracking-tight mb-3.5">
        All Systems Go
      </h2>
      <p className="text-[15px] text-text-muted leading-relaxed max-w-[460px] mb-10 font-sans">
        Your first mission: understand what tensors are and why frontend
        engineers have already been thinking about them.
      </p>
      <div
        className="border-2 border-primary bg-surface-raised px-8 py-6 mb-2 text-left w-full max-w-md rounded-none"
        data-testid="ready-summary"
      >
        <div className="font-mono text-xs text-primary tracking-[0.1em] mb-3.5 uppercase">
          Your Configuration
        </div>
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 mb-2">
            <span className="font-mono text-xs text-text-muted min-w-[96px]">
              {k}
            </span>
            <span className="font-mono text-xs text-text-primary break-words">
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

/**
 * Arrow-key navigation within a radio group. Cycles the current selection
 * on ArrowUp/Down/Left/Right. Works with any object list that exposes `id`.
 */
function makeArrowHandler<T extends { id: string }>(
  items: readonly T[],
  current: string | null,
  set: (id: T["id"]) => void,
) {
  return function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (
      e.key !== "ArrowDown" &&
      e.key !== "ArrowUp" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight"
    ) {
      return;
    }
    e.preventDefault();
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const idx = current ? items.findIndex((it) => it.id === current) : -1;
    const nextIdx = (idx + dir + items.length) % items.length;
    const nextId = items[nextIdx < 0 ? 0 : nextIdx].id;
    set(nextId as T["id"]);
  };
}
