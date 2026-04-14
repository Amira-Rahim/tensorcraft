"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { BRIDGES } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { trackThemeSelected } from "@/lib/analytics";

const STEPS = [
  "Welcome",
  "Your Background",
  "Your Goal",
  "Your Framework",
  "Choose Theme",
  "Ready",
];

const BACKGROUNDS = [
  "Complete beginner",
  "Some Python",
  "Know React well",
  "Built apps in prod",
  "ML adjacent work",
];

const GOALS = [
  "Understand ML concepts",
  "Build ML-powered apps",
  "Switch to ML engineering",
  "Research & experiments",
  "Just curious",
];

const FRAMEWORKS = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "angular", label: "Angular" },
  { id: "svelte", label: "Svelte" },
  { id: "vanilla", label: "Vanilla JS" },
] as const;

const ONBOARDING_THEMES = themeSlugs.map((slug) => ({
  id: slug,
  name: themes[slug].displayName,
  domain: themes[slug].specialization,
  color: themes[slug].palette.primary,
}));

const FEATURES = [
  {
    icon: "◎",
    name: `${BRIDGES.length} FE Bridges`,
    desc: "Every concept mapped to React/JS",
  },
  { icon: "◉", name: "Story-Driven", desc: "11 modules aboard the Archimedes" },
  { icon: "⌘", name: "Build Real ML", desc: "Ship a classifier by module 3" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [bg, setBg] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [framework, setFramework] = useState<
    "react" | "vue" | "angular" | "svelte" | "vanilla" | null
  >(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedThemeData = ONBOARDING_THEMES.find(
    (t) => t.id === selectedTheme,
  );

  const completeOnboarding = useCallback(async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          preferred_theme_id: selectedTheme,
          fe_background: bg,
          learning_goal: goal,
          fe_framework: framework,
        })
        .eq("id", user.id);
    }

    // Tag onboarding complete in Kit
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (authSession) {
      const { getApiUrl } = await import("@/lib/api-url");
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ event: "onboarded" }),
      }).catch(() => {});
    }

    if (selectedTheme) {
      trackThemeSelected(selectedTheme);
      router.push(`/themes/${selectedTheme}`);
    }
  }, [selectedTheme, bg, goal, framework, router]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 py-16 relative overflow-hidden">
      <AmbientBackground count={160} />

      {/* Logo */}
      <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-text-primary mb-12 relative z-10">
        <span className="bg-primary text-surface px-1.5 py-0.5 text-xs font-bold">
          T_
        </span>
        TENSORCRAFT
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-14 relative z-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className="flex flex-col items-center relative">
              <div
                className="w-2.5 h-2.5 transition-all duration-300"
                style={{
                  background:
                    i <= step ? "var(--tc-primary)" : "var(--tc-border)",
                  opacity: i < step ? 0.5 : 1,
                }}
              />
              {i === step && (
                <span className="absolute top-5 font-mono text-xs text-primary whitespace-nowrap">
                  {s}
                </span>
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 h-0.5 transition-all duration-300"
                style={{
                  background:
                    i < step ? "var(--tc-primary)" : "var(--tc-border)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="w-full max-w-[680px] px-8 flex flex-col items-center relative z-10">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // MISSION BRIEFING
            </div>
            <h1 className="font-mono text-4xl md:text-4xl font-bold text-text-primary tracking-tight leading-tight mb-4">
              Welcome Aboard
              <br />
              the <span className="text-primary">Archimedes</span>
            </h1>
            <p className="text-base text-text-muted leading-relaxed max-w-[500px] mb-12 font-sans">
              You&apos;re a frontend engineer. You&apos;re about to learn ML —
              not by re-learning math, but by mapping it to what you already
              know.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 w-full mb-12">
              {FEATURES.map((f) => (
                <div
                  key={f.name}
                  className="border-2 border-border bg-surface-raised p-7 text-center"
                >
                  <div className="font-mono text-[22px] text-primary mb-3">
                    {f.icon}
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
        )}

        {/* Step 1: Background */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // CREW ASSESSMENT
            </div>
            <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
              What&apos;s your background?
            </h2>
            <p className="text-sm text-text-muted mb-10 font-sans">
              We&apos;ll calibrate the bridge analogies to your level.
            </p>
            <div className="flex flex-col gap-0.5 w-full text-left">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBg(b)}
                  className={`flex items-center gap-4 px-6 py-4 text-left transition-all border-2 ${bg === b ? "bg-primary/10 border-primary" : "bg-surface border-border"}`}
                >
                  <div
                    className="w-4 h-4 shrink-0"
                    style={{
                      border: `2px solid ${bg === b ? "var(--tc-primary)" : "var(--tc-muted)"}`,
                      background:
                        bg === b ? "var(--tc-primary)" : "transparent",
                    }}
                  />
                  <span
                    className="font-mono text-xs"
                    style={{
                      color: bg === b ? "var(--tc-text)" : "var(--tc-muted)",
                    }}
                  >
                    {b}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // MISSION OBJECTIVE
            </div>
            <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
              What&apos;s your goal?
            </h2>
            <p className="text-sm text-text-muted mb-10 font-sans">
              This shapes which bridges we highlight first.
            </p>
            <div className="flex flex-col gap-0.5 w-full text-left">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`flex items-center gap-4 px-6 py-4 text-left transition-all border-2 ${goal === g ? "bg-primary/10 border-primary" : "bg-surface border-border"}`}
                >
                  <div
                    className="w-4 h-4 shrink-0"
                    style={{
                      border: `2px solid ${goal === g ? "var(--tc-primary)" : "var(--tc-muted)"}`,
                      background:
                        goal === g ? "var(--tc-primary)" : "transparent",
                    }}
                  />
                  <span
                    className="font-mono text-xs"
                    style={{
                      color: goal === g ? "var(--tc-text)" : "var(--tc-muted)",
                    }}
                  >
                    {g}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Framework */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // PRIMARY TOOLKIT
            </div>
            <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
              What&apos;s your primary framework?
            </h2>
            <p className="text-sm text-text-muted mb-10 font-sans">
              Pick yours — we&apos;ll show you a bridge preview.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0.5 w-full max-w-140 text-left">
              {/* Framework list */}
              <div className="flex flex-col gap-0.5">
                {FRAMEWORKS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFramework(f.id)}
                    className={`flex items-center gap-3 px-5 py-3.5 text-left transition-all border-2 ${
                      framework === f.id
                        ? "bg-primary/10 border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <span
                      className={`font-mono text-base w-6 text-center ${framework === f.id ? "text-primary" : "text-text-muted"}`}
                    >
                      {f.id === "react"
                        ? "⚛"
                        : f.id === "vue"
                          ? "◆"
                          : f.id === "angular"
                            ? "▲"
                            : f.id === "svelte"
                              ? "◐"
                              : "{ }"}
                    </span>
                    <span
                      className={`font-mono text-xs ${framework === f.id ? "text-text-primary" : "text-text-muted"}`}
                    >
                      {f.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* Bridge preview */}
              <div className="bg-surface-raised border border-border p-4">
                {framework ? (
                  (() => {
                    const previewBridge = BRIDGES.find((b) => b.id === 1);
                    const variant =
                      previewBridge?.variants?.[
                        framework as keyof typeof previewBridge.variants
                      ];
                    return (
                      <>
                        <div className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
                          // BRIDGE PREVIEW
                        </div>
                        <div className="font-mono text-xs font-semibold text-text-primary mb-2">
                          {previewBridge?.mlConcept} ⇄{" "}
                          {variant?.feConcept || previewBridge?.feConcept}
                        </div>
                        <div className="bg-code-bg border border-border p-3 font-mono text-xs text-primary leading-relaxed whitespace-pre-wrap mb-3">
                          {variant?.feCode || previewBridge?.connection}
                        </div>
                        <div className="font-mono text-xs text-text-muted">
                          This is how bridges will look in your lessons →
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex items-center justify-center h-full min-h-40">
                    <p className="font-mono text-xs text-text-muted text-center">
                      Select a framework to preview
                      <br />
                      your bridges
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Choose Theme */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // CHOOSE YOUR WORLD
            </div>
            <h2 className="font-mono text-3xl font-bold text-text-primary tracking-tight mb-2.5">
              Choose your theme
            </h2>
            <p className="text-sm text-text-muted mb-10 font-sans">
              Each theme teaches the full ML toolkit through a unique narrative.
            </p>
            <div className="flex flex-col gap-0.5 w-full">
              {ONBOARDING_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedTheme(th.id)}
                  className={`flex items-center gap-4 px-6 py-4.5 text-left transition-all border-2 ${selectedTheme === th.id ? "bg-primary/8 border-primary" : "bg-surface border-border"}`}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0"
                    style={{
                      background: `${th.color}20`,
                      border: `2px solid ${th.color}40`,
                    }}
                  >
                    <span
                      className="font-mono text-sm"
                      style={{ color: th.color }}
                    >
                      ◎
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-mono text-xs font-bold text-text-primary">
                      {th.name}
                    </div>
                    <div className="font-mono text-xs text-text-muted mt-0.5">
                      {th.domain}
                    </div>
                  </div>
                  {selectedTheme === th.id && (
                    <span className="font-mono text-xs text-primary border border-primary px-2 py-0.5">
                      SELECTED
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Ready */}
        {step === 5 && (
          <div className="flex flex-col items-center text-center w-full animate-fade-up">
            <div className="font-mono text-xs text-primary tracking-[0.15em] mb-3.5">
              // LAUNCH SEQUENCE
            </div>
            <div className="font-mono text-5xl text-primary mb-4">◎</div>
            <h2 className="font-mono text-[30px] font-bold text-text-primary tracking-tight mb-3.5">
              All Systems Go
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[460px] mb-10 font-sans">
              Your first mission: understand what tensors are and why frontend
              engineers have already been thinking about them.
            </p>

            {/* Configuration summary */}
            <div className="border-2 border-primary bg-surface-raised px-8 py-6 mb-10 text-left w-full max-w-md">
              <div className="font-mono text-xs text-primary tracking-[0.1em] mb-3.5">
                // YOUR CONFIGURATION
              </div>
              {[
                ["Theme", selectedThemeData?.name || "Not set"],
                ["Background", bg || "Not set"],
                ["Goal", goal || "Not set"],
                [
                  "Framework",
                  FRAMEWORKS.find((f) => f.id === framework)?.label ||
                    "Not set",
                ],
                ["Start", "M01 · L01 · First Contact"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 mb-2">
                  <span className="font-mono text-xs text-text-muted min-w-[100px]">
                    {k}
                  </span>
                  <span className="font-mono text-xs text-text-primary">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 justify-center mt-10 mb-16">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-7 py-3 font-mono text-xs text-text-primary border-2 border-border bg-transparent hover:border-primary/30 transition-all brutalist-hover"
            >
              ← Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 4 && !selectedTheme}
              className="px-7 py-3 font-mono text-xs font-bold text-surface bg-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 0 ? "Continue →" : `Next: ${STEPS[step + 1]} →`}
            </button>
          ) : (
            <button
              type="button"
              onClick={completeOnboarding}
              disabled={saving || !selectedTheme}
              className="px-7 py-3 font-mono text-xs font-bold text-surface bg-primary border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow disabled:opacity-50"
            >
              {saving ? "Loading..." : "Begin First Lesson →"}
            </button>
          )}
        </div>

        {step === 5 && (
          <p className="text-[13px] text-text-muted opacity-70 font-mono">
            You can change your theme anytime in Settings
          </p>
        )}
      </div>
    </div>
  );
}
