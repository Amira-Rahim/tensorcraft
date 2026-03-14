"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { AmbientBackground } from "@/app/components/ambient-background";

const THEMES = themeSlugs.map((slug) => ({
  id: slug,
  name: themes[slug].displayName,
  domain: themes[slug].specialization,
  hook: themes[slug].tagline,
  color: themes[slug].palette.primary,
  available: themes[slug].status === "launched",
}));

const FEATURES = [
  {
    icon: "✍",
    name: "Story-Driven",
    desc: "Every lesson unfolds within a narrative",
  },
  {
    icon: "⇄",
    name: "FE → ML Bridges",
    desc: "ML concepts mapped to frontend knowledge",
  },
  {
    icon: "⌨",
    name: "Hands-On Code",
    desc: "Build real models in the browser",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState("deep-orbit");
  const [saving, setSaving] = useState(false);

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
        })
        .eq("id", user.id);
    }

    router.push(`/themes/${selectedTheme}`);
  }, [selectedTheme, router]);

  const selectedThemeData = THEMES.find((t) => t.id === selectedTheme)!;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 py-16 relative overflow-hidden">
      <AmbientBackground count={160} />
      {/* Logo */}
      <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider text-text-primary mb-12 relative z-10">
        <span className="bg-primary text-surface px-1.5 py-0.5 text-[10px] font-bold">
          T_
        </span>
        TENSORCRAFT
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-14 relative z-10">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 transition-all duration-400"
              style={{
                background:
                  s <= step ? "var(--tc-primary)" : "var(--tc-border)",
                opacity: s < step ? 0.5 : 1,
              }}
            />
            {i < 2 && (
              <div
                className="w-12 h-px transition-all duration-400"
                style={{
                  background:
                    s < step ? "var(--tc-primary)" : "var(--tc-border)",
                  opacity: s < step ? 0.4 : 1,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="w-full max-w-[740px] relative z-10">
        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-up">
            <h1 className="text-4xl md:text-[40px] font-bold font-mono leading-tight tracking-tight text-text-primary mb-4">
              You Already Think Like an ML Engineer
            </h1>
            <p className="text-lg text-text-muted max-w-[520px] mb-12">
              You&apos;re about to learn machine learning through concepts you
              already know.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
              {FEATURES.map((f) => (
                <div
                  key={f.name}
                  className="brutalist-shadow border border-border bg-surface-raised p-7 text-center hover:border-primary/15 transition-colors"
                >
                  <span className="text-[28px] mb-3.5 block">{f.icon}</span>
                  <div className="text-[15px] font-semibold text-text-primary mb-1.5">
                    {f.name}
                  </div>
                  <div className="text-[13px] text-text-muted leading-relaxed">
                    {f.desc}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-surface font-bold text-sm font-mono tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2: Theme Selection */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-fade-up">
            <h1 className="text-4xl md:text-[40px] font-bold font-mono leading-tight tracking-tight text-text-primary mb-4">
              Choose Your Theme
            </h1>
            <p className="text-lg text-text-muted max-w-[520px] mb-12">
              Each theme wraps the same ML curriculum in a unique story and
              specialization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full mb-12">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    if (theme.available) setSelectedTheme(theme.id);
                  }}
                  disabled={!theme.available}
                  className={`relative border overflow-hidden text-left transition-all duration-250 ${
                    theme.available
                      ? "cursor-pointer hover:-translate-y-0.5"
                      : "opacity-55 cursor-default"
                  } ${
                    selectedTheme === theme.id
                      ? "border-primary brutalist-shadow"
                      : "border-border"
                  }`}
                  style={{
                    background: "var(--tc-card, #313131)",
                  }}
                >
                  {/* Color accent bar */}
                  <div
                    className="h-1 w-full"
                    style={{ background: theme.color }}
                  />

                  <div className="p-4">
                    <div className="text-sm font-semibold text-text-primary mb-0.5">
                      {theme.name}
                    </div>
                    <div className="text-[11px] text-text-muted uppercase tracking-wider mb-2 font-mono">
                      {theme.domain}
                    </div>
                    <div className="text-xs text-text-muted leading-relaxed">
                      {theme.hook}
                    </div>
                  </div>

                  {/* Selected check */}
                  {selectedTheme === theme.id && (
                    <div
                      className="absolute top-3 right-2.5 w-[22px] h-[22px] flex items-center justify-center"
                      style={{ background: "var(--tc-primary)" }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--tc-surface)"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  {/* Coming soon badge */}
                  {!theme.available && (
                    <div className="absolute top-3 right-2 text-[9px] font-semibold uppercase tracking-wide border border-border text-text-muted font-mono px-2 py-0.5">
                      Coming Soon
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-surface font-bold text-sm font-mono tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
            >
              Start with {selectedThemeData.name} →
            </button>
          </div>
        )}

        {/* STEP 3: Ready */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center animate-fade-up">
            <h1 className="text-4xl md:text-[40px] font-bold font-mono leading-tight tracking-tight text-text-primary mb-6">
              You&apos;re all set!
            </h1>

            <div className="flex items-center gap-2 text-[15px] text-text-muted mb-10 font-mono">
              <span>Theme: {selectedThemeData.name}</span>
              <span className="w-1 h-1 bg-border" />
              <span>11 Modules</span>
              <span className="w-1 h-1 bg-border" />
              <span>55 Lessons</span>
            </div>

            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-surface font-bold text-sm font-mono tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow disabled:opacity-50"
            >
              {saving ? "Loading..." : "Start your first lesson →"}
            </button>

            <p className="text-[13px] text-text-muted mt-5 opacity-70 font-mono">
              You can change your theme anytime in Settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
