import Link from "next/link";
import type { ThemeManifest } from "@tensorcraft/themes";
import { PRICING } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { ThemeWaitlistForm } from "./theme-waitlist-form";
import { ComingSoonMotif } from "./coming-soon-motif";

interface Props {
  theme: ThemeManifest;
}

// Irregular plurals for theme module/lesson terminology.
const PLURALS: Record<string, string> = { Gallery: "Galleries" };
const plural = (word: string) => PLURALS[word] ?? `${word}s`;

/**
 * Coming-soon stub for unlaunched themes. Server-rendered with theme palette,
 * an in-world status-board hero, curriculum teaser data from
 * `theme.preview`, and waitlist capture in the hero and the footer.
 * JSON-LD ships `availability: PreOrder` so search engines surface the
 * right rich snippet.
 */
export function ComingSoonStub({ theme }: Props) {
  const slug = theme.slug;
  const preview = theme.preview;
  const palette = theme.palette;
  const modulePlural = plural(theme.terminology.module);
  const lessonPlural = plural(theme.terminology.lesson);
  const rosterPrefix = theme.terminology.module.charAt(0).toUpperCase();
  const castLead = theme.characters.slice(0, 3);
  const castRest = theme.characters.slice(3);

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${theme.displayName}: ${theme.specialization}`,
    description: theme.description,
    provider: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    url: `https://tensorcraft.app/themes/${slug}`,
    educationalLevel: "Intermediate",
    programmingLanguage: ["JavaScript", "TypeScript"],
    teaches: theme.specialization,
    offers: {
      "@type": "Offer",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      url: `https://tensorcraft.app/themes/${slug}`,
    },
  };

  const stats: Array<{ value: string; label: string }> = [
    { value: "11", label: modulePlural },
    // 55 = fixed launch-scope constant: 11 modules x 5 lessons.
    { value: "55", label: lessonPlural },
    { value: "1", label: "Capstone Model" },
    { value: "Free", label: `${theme.terminology.module} 1 at Launch` },
  ];

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: palette.bg }}
      data-testid={`coming-soon-stub-${slug}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <AmbientBackground count={120} />

      {/* Hero: in-world status board */}
      <header
        className="relative z-10"
        style={{
          borderBottom: `1px solid ${palette.border}`,
          background: `color-mix(in srgb, ${palette.bg} 70%, transparent)`,
        }}
      >
        <div className="max-w-[900px] mx-auto px-6 md:px-12 pt-12 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <span
              className="font-mono text-xs uppercase tracking-[0.2em]"
              style={{ color: palette.accent }}
            >
              {preview?.statusBoard.org ?? theme.specialization}
              <span className="sr-only"> (coming soon)</span>
            </span>
            {preview ? (
              <span
                className="font-mono text-xs uppercase tracking-[0.15em] px-3 py-1 border-2 rounded-none"
                style={{ color: palette.accent, borderColor: palette.accent }}
              >
                {preview.statusBoard.status}
              </span>
            ) : null}
          </div>

          <h1
            className="font-mono text-5xl font-bold mb-4 leading-tight"
            style={{ color: palette.text, letterSpacing: "-0.02em" }}
          >
            {theme.displayName}
          </h1>
          <p
            className="text-xl leading-relaxed mb-2"
            style={{ color: palette.text }}
          >
            {theme.tagline}
          </p>

          <div className="my-5">
            <ComingSoonMotif slug={slug} color={palette.primary} />
          </div>

          <p
            className="text-base leading-relaxed max-w-[560px] mb-6"
            style={{ color: palette.muted }}
          >
            {theme.description}
          </p>

          <div className="max-w-[480px]">
            <ThemeWaitlistForm
              themeSlug={slug}
              themeName={theme.displayName}
              palette={palette}
              idSuffix="hero"
              source="coming-soon-hero"
              ctaLabel={preview?.ctaLabel ?? "Notify"}
            />
            <p
              className="font-mono text-xs mt-2"
              style={{ color: palette.muted }}
            >
              One email when {theme.displayName} ships. Nothing else.
            </p>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      {preview ? (
        <section
          aria-label="Curriculum at a glance"
          className="relative z-10 grid grid-cols-2 md:grid-cols-4 text-center"
          style={{ borderBottom: `1px solid ${palette.border}` }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="py-4 border-l first:border-l-0"
              style={{ borderColor: palette.border }}
            >
              <div
                className="font-mono text-xl font-bold"
                style={{ color: palette.primary }}
              >
                {stat.value}
              </div>
              <div
                className="font-mono text-xs uppercase tracking-[0.15em]"
                style={{ color: palette.muted }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Module roster */}
      {preview ? (
        <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 py-10">
          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-5"
            style={{ color: palette.primary }}
          >
            The 11 {modulePlural}
          </h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {preview.modules.map((m) => (
              <li
                key={m.order}
                className={`border-2 px-4 py-3 font-mono text-sm rounded-none${
                  m.capstone ? " md:col-span-2 text-center" : ""
                }`}
                style={{
                  background: palette.surface,
                  borderColor: m.free
                    ? palette.primary
                    : m.capstone
                      ? palette.accent
                      : palette.border,
                  color: m.free
                    ? palette.text
                    : m.capstone
                      ? palette.accent
                      : palette.muted,
                }}
              >
                {rosterPrefix}
                {String(m.order).padStart(2, "0")} &middot; {m.title}
                {m.free ? (
                  <span
                    className="ml-2 text-xs border px-1.5 py-0.5 rounded-none"
                    style={{
                      borderColor: palette.primary,
                      color: palette.primary,
                    }}
                  >
                    FREE
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p
            className="font-mono text-xs mt-3"
            style={{ color: palette.muted }}
          >
            5 {lessonPlural} per {theme.terminology.module} &middot; 55{" "}
            {lessonPlural} in the full rebuild.
          </p>
        </section>
      ) : null}

      {/* Skills, careers, and cast */}
      <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 pb-10 grid gap-10 md:grid-cols-2">
        <div>
          {preview ? (
            <>
              <h2
                className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
                style={{ color: palette.primary }}
              >
                What you&rsquo;ll master
              </h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {preview.skills.map((skill) => (
                  <span
                    key={skill}
                    className="border px-2.5 py-1 font-mono text-xs rounded-none"
                    style={{ borderColor: palette.border, color: palette.text }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </>
          ) : null}

          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: palette.primary }}
          >
            Where it leads
          </h2>
          <ul className="space-y-2">
            {/* careerPaths entries follow "Name ($low-$high)"; range is highlighted. */}
            {theme.careerPaths.map((path) => {
              const parenIndex = path.indexOf("(");
              const name =
                parenIndex === -1 ? path : path.slice(0, parenIndex).trim();
              const range =
                parenIndex === -1
                  ? null
                  : path.slice(parenIndex + 1).replace(/\)\s*$/, "");
              return (
                <li key={path} className="text-sm">
                  <span style={{ color: palette.text }}>{name}</span>
                  {range ? (
                    <span
                      className="font-mono ml-2"
                      style={{ color: palette.primary }}
                    >
                      {range}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: palette.primary }}
          >
            The cast
          </h2>
          <ul className="space-y-3 mb-3">
            {castLead.map((c) => (
              <li
                key={c.name}
                className="border-2 p-4 rounded-none"
                style={{
                  borderColor: palette.border,
                  background: palette.surface,
                }}
              >
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: palette.text }}
                >
                  {c.name}
                </div>
                <div
                  className="font-mono text-xs uppercase mt-0.5"
                  style={{ color: palette.accent }}
                >
                  {c.role}
                </div>
                <p
                  className="text-xs italic mt-1"
                  style={{ color: palette.muted }}
                >
                  {c.personality}
                </p>
              </li>
            ))}
          </ul>
          {castRest.length > 0 ? (
            <p className="font-mono text-xs" style={{ color: palette.muted }}>
              + {castRest.map((c) => c.name).join(", ")}
            </p>
          ) : null}
        </div>
      </section>

      {/* Footer: waitlist repeat + Deep Orbit cross-sell */}
      <section className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 pb-16 grid gap-4 md:grid-cols-2">
        <div
          className="border-2 p-6 rounded-none"
          style={{
            borderColor: palette.primary,
            background: palette.surface,
          }}
        >
          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: palette.primary }}
          >
            Waitlist
          </h2>
          <ThemeWaitlistForm
            themeSlug={slug}
            themeName={theme.displayName}
            palette={palette}
            idSuffix="footer"
            source="coming-soon-footer"
            ctaLabel={preview?.ctaLabel ?? "Notify"}
          />
        </div>

        <Link
          href="/themes/deep-orbit"
          className="border-2 p-6 block rounded-none brutalist-hover"
          style={{ borderColor: palette.border, background: palette.surface }}
        >
          <p
            className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: palette.accent }}
          >
            Can&rsquo;t wait?
          </p>
          <h2
            className="font-mono text-sm font-bold mb-2"
            style={{ color: palette.text }}
          >
            Deep Orbit is live now
          </h2>
          <p className="text-sm" style={{ color: palette.muted }}>
            Time-Series &amp; Signals. Same ML foundations track, different
            world. Start free &rarr;
          </p>
        </Link>
      </section>
    </main>
  );
}
