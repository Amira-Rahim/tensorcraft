import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { worlds } from "@tensorcraft/worlds";

/* Design tokens, same set dashboard-view.tsx uses. */
const LIME = "var(--tc-primary)";
const BG = "var(--tc-bg)";
const WHITE = "var(--tc-text)";
const MUTED = "var(--tc-muted)";
const BORDER_VAR = "var(--tc-border)";
const ON_PRIMARY = "var(--tc-on-primary)";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

/* System-voice transmission header, per world. Canon facts from
   docs/story-style-bible.md (the Archimedes, Sector 7-G, 64 channels).
   A world without an entry keeps a plain world-name kicker and no
   status line; the cast never addresses the learner here (operator-of-
   record rule), so the header is ship UI, not dialogue. */
const TRANSMISSION: Record<string, { kicker: string; status: string }> = {
  "deep-orbit": {
    kicker: "ARCHIMEDES · MONITORING STATION",
    status: "SIGNAL: SECTOR 7-G · 64 CHANNELS · LIVE",
  },
};

/** Same shape as page.tsx's currentModuleInfo (spec: "reuses the
 *  currentModule shape"), so the page can pass it through untouched. */
export interface FirstRunBriefing {
  number: number;
  name: string;
  lessonNumber: number;
  totalLessons: number;
  estimatedMinutes: number;
  topic: string;
}

export interface FirstRunProps {
  displayName: string;
  worldName: string;
  worldSlug: string;
  plateSrc?: string;
  briefing: FirstRunBriefing | null;
  resumeUrl: string | null;
  /** Module 1 lesson count, present only when module 1 resolves patch
   *  art. Absent hides the first-patch stat rather than promising an
   *  emblem that does not exist. */
  firstPatchLessonCount?: number;
  totalWorldLessons: number;
}

/**
 * The dashboard a brand-new account sees: one full-bleed mission
 * dispatch instead of a page of zeroed instruments. page.tsx branches
 * here while the user has no completed lesson and no exercise attempt
 * (spec: docs/superpowers/specs/2026-08-16-first-run-dashboard-design.md).
 */
export function FirstRunView({
  displayName,
  worldName,
  worldSlug,
  plateSrc,
  briefing,
  resumeUrl,
  firstPatchLessonCount,
  totalWorldLessons,
}: FirstRunProps) {
  const lessonTerm = worlds[worldSlug]?.terminology.lesson ?? "Lesson";
  const tx = TRANSMISSION[worldSlug];

  const stats: Array<{ label: string; value: string }> = [
    { label: "Streak", value: "starts today" },
    ...(firstPatchLessonCount
      ? [
          {
            label: "First patch",
            value: `after ${firstPatchLessonCount} lessons`,
          },
        ]
      : []),
    { label: "World", value: `0 / ${totalWorldLessons} lessons` },
  ];

  return (
    <div
      style={{
        background: BG,
        color: WHITE,
        WebkitFontSmoothing: "antialiased",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* The dispatch is a lit viewport over dark art, so the section is
          dark in both schemes (tc-on-art). If the plate fails to load,
          ArtPlate renders nothing and the dark surface + grid remain. */}
      <main
        data-testid="first-run-dispatch"
        className="tc-on-art grid-bg"
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
          display: "flex",
          overflow: "hidden",
          background: "#181818",
        }}
      >
        {plateSrc && (
          <ArtPlate
            src={plateSrc}
            bleed
            className="absolute inset-0 pointer-events-none"
          />
        )}
        {plateSrc && <div aria-hidden="true" className="tc-art-scrim" />}

        <section
          aria-labelledby="dispatch-heading"
          style={{
            position: "relative",
            zIndex: 10,
            margin: "auto",
            width: "100%",
            maxWidth: 760,
            padding: "72px 40px",
          }}
        >
          {/* Transmission header */}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 28,
            }}
          >
            <span style={{ color: LIME, fontWeight: 700 }}>
              {tx?.kicker ?? worldName.toUpperCase()}
            </span>
            {tx && <span style={{ color: MUTED }}>{tx.status}</span>}
            <span style={{ color: MUTED }}>OPERATOR: {displayName}</span>
          </div>

          {/* Briefing */}
          <h1
            id="dispatch-heading"
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {briefing
              ? `Module ${briefing.number}: ${briefing.name}`
              : worldName}
          </h1>
          {briefing && (
            <p
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: MUTED,
                marginBottom: 32,
              }}
            >
              Lesson {briefing.lessonNumber} of {briefing.totalLessons} · ~
              {briefing.estimatedMinutes} min · {briefing.topic}
            </p>
          )}

          {/* CTA. Static button on purpose: no arbitrary-value hover
              class precedent exists in apps/web and a JS hover would
              force "use client"; the offset shadow carries the
              affordance. */}
          <Link
            href={resumeUrl ?? `/worlds/${worldSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "16px 32px",
              background: LIME,
              color: ON_PRIMARY,
              fontSize: 15,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              border: `2px solid ${LIME}`,
              boxShadow:
                "3px 3px 0 color-mix(in srgb, var(--tc-primary) 20%, transparent)",
              textDecoration: "none",
              marginBottom: 40,
            }}
          >
            {resumeUrl ? `Start First ${lessonTerm} →` : "Start Learning →"}
          </Link>

          {/* Stat strip: neutral hairline dividers (structure, not
              accent bars). */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              border: `1px solid ${BORDER_VAR}`,
              marginBottom: 20,
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: "1 1 140px",
                  padding: "14px 18px",
                  borderRight:
                    i < stats.length - 1 ? `1px solid ${BORDER_VAR}` : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: MUTED,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: WHITE }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
            Activity, skill genome, bridges, and patches switch on after your
            first completed lesson.
          </p>
        </section>
      </main>
    </div>
  );
}
