import Link from "next/link";
import type { ThemeManifest } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
// Subpath import: the root barrel pulls in sandpack-react, which the
// coming-soon page (and its jsdom tests) has no reason to load.
import { CharacterAvatar } from "@tensorcraft/ui/character-avatar";
import { ThemeWaitlistForm } from "./theme-waitlist-form";
import { ComingSoonScene } from "./coming-soon-scene";

interface Props {
  theme: ThemeManifest;
}

// Irregular plurals for theme module/lesson terminology.
const PLURALS: Record<string, string> = { Gallery: "Galleries" };
const plural = (word: string) => PLURALS[word] ?? `${word}s`;

/**
 * Coming-soon stub for unlaunched themes. Server-rendered with theme palette,
 * a split hero (in-world status board copy + live SceneCanvas feed frame),
 * a status-board module roster from `theme.preview`, and waitlist capture in
 * the hero and the footer. JSON-LD ships `availability: PreOrder` so search
 * engines surface the right rich snippet.
 *
 * Color is structural here: section borders and row hairlines mix the theme
 * primary into the neutral border (the raw `palette.border` is near-invisible
 * on `palette.bg`), and the free/capstone roster rows carry tinted washes.
 */
export function ComingSoonStub({ theme }: Props) {
  const slug = theme.slug;
  const preview = theme.preview;
  // Brand-green-only surface (2026-07-19 design decision): coming-soon pages
  // speak in the site chrome's green + shared neutrals, so they never clash
  // with the nav (theme-provider only applies launched themes' palettes).
  // Theme identity comes from the scene renderer, typography, and copy.
  // Per-theme hues remain on /themes cards and the homepage strip.
  const palette = {
    ...theme.palette,
    primary: "#6BAA8A",
    accent: "#6BAA8A",
  };
  const modulePlural = plural(theme.terminology.module);
  const lessonPlural = plural(theme.terminology.lesson);
  const rosterPrefix = theme.terminology.module.charAt(0).toUpperCase();
  const castLead = theme.characters.slice(0, 3);
  const castRest = theme.characters.slice(3);

  // careerPaths entries follow "Name ($lowK-$highK)"; parsed for the salary
  // range bars. An entry that doesn't parse falls back to a plain text row.
  const careers = theme.careerPaths.map((path) => {
    const m = /^(.*?)\s*\(\$(\d+)K\s*[-–]\s*\$(\d+)K\)\s*$/.exec(path);
    return m
      ? { name: m[1]!, low: Number(m[2]), high: Number(m[3]) }
      : { name: path, low: null, high: null };
  });
  const axisTop =
    Math.ceil(Math.max(0, ...careers.map((c) => c.high ?? 0)) / 50) * 50;

  // Theme-mixed structural colors (see doc comment above).
  const edge = `color-mix(in srgb, ${palette.primary} 25%, ${palette.border})`;
  const hairline = `color-mix(in srgb, ${palette.primary} 15%, ${palette.border})`;
  const wash = `color-mix(in srgb, ${palette.primary} 7%, ${palette.bg})`;
  const accentWash = `color-mix(in srgb, ${palette.accent} 9%, ${palette.bg})`;

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

      {/* Hero: in-world status board over the theme's ambient scene */}
      <header
        className="relative"
        style={{ borderBottom: `1px solid ${edge}` }}
      >
        <ComingSoonScene slug={slug} palette={palette} />
        <div className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pt-12 pb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-6 font-mono text-xs uppercase tracking-[0.2em]">
            <p style={{ color: palette.muted }}>
              {preview?.statusBoard.org ?? theme.specialization}
              <span className="sr-only"> (coming soon)</span>
            </p>
            {preview ? (
              <p style={{ color: palette.primary }}>
                {preview.statusBoard.status}
              </p>
            ) : null}
          </div>

          <div className="max-w-[640px]">
            <h1
              className="font-mono text-5xl md:text-7xl font-bold mb-4 leading-[1.05]"
              style={{ color: palette.text, letterSpacing: "-0.02em" }}
            >
              {theme.displayName}
            </h1>
            <p
              className="text-xl md:text-2xl leading-relaxed mb-5"
              style={{ color: palette.text }}
            >
              {theme.tagline}
            </p>

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
        </div>
      </header>

      {/* Module roster: in-world status board. Row state carries the launch
          scope (module 1 online + free, the rest pending rebuild). */}
      {preview ? (
        <section className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pt-12 pb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-5">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: palette.text }}
            >
              The {THEME_CONTENT.modulesPerTheme} {modulePlural}
            </h2>
            <p className="font-mono text-xs" style={{ color: palette.muted }}>
              {THEME_CONTENT.lessonsPerModule} {lessonPlural} per{" "}
              {theme.terminology.module} ·{" "}
              {THEME_CONTENT.comingSoonLessonsPerTheme} in the full rebuild
            </p>
          </div>
          <ul
            className="border-t"
            style={{ borderColor: hairline }}
            data-testid={`coming-soon-roster-${slug}`}
          >
            {preview.modules.map((m) => (
              <li
                key={m.order}
                className={`flex items-baseline gap-4 border-b px-3 py-2.5 font-mono text-sm${
                  m.free ? " border-l-2" : ""
                }`}
                style={{
                  borderBottomColor: hairline,
                  ...(m.free
                    ? { background: wash, borderLeftColor: palette.primary }
                    : m.capstone
                      ? { background: accentWash }
                      : {}),
                }}
              >
                <span
                  style={{
                    color: m.free
                      ? palette.primary
                      : m.capstone
                        ? palette.accent
                        : palette.muted,
                  }}
                >
                  {rosterPrefix}
                  {String(m.order).padStart(2, "0")}
                </span>
                <span
                  className="flex-1"
                  style={{
                    color: m.free || m.capstone ? palette.text : palette.muted,
                  }}
                >
                  {m.title}
                </span>
                <span
                  className="text-[11px] uppercase tracking-[0.15em] whitespace-nowrap"
                  style={{
                    color: m.free
                      ? palette.primary
                      : m.capstone
                        ? palette.accent
                        : palette.muted,
                  }}
                >
                  {m.free ? "Online · Free" : m.capstone ? "Finale" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Skills, careers, and cast. Section-header grammar matches the
          roster: title bold left, mono-xs muted meta right. Each section
          takes the form native to its data: counted prose, salary range
          bars on a shared axis, personnel dossier rows. */}
      <section
        className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pt-10 pb-14 border-t grid gap-x-16 gap-y-10 md:grid-cols-2"
        style={{ borderColor: hairline }}
      >
        <div>
          {preview ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-4">
                <h2
                  className="font-mono text-xl md:text-2xl font-bold tracking-tight"
                  style={{ color: palette.text }}
                >
                  You&rsquo;ll master
                </h2>
                <p
                  className="font-mono text-xs"
                  style={{ color: palette.muted }}
                >
                  {preview.skills.length} capabilities
                </p>
              </div>
              <p className="font-mono text-sm leading-relaxed mb-8">
                {preview.skills.map((skill, i) => (
                  <span key={skill}>
                    {i > 0 ? (
                      <span
                        aria-hidden="true"
                        style={{ color: palette.primary }}
                      >
                        {" / "}
                      </span>
                    ) : null}
                    <span style={{ color: palette.text }}>{skill}</span>
                  </span>
                ))}
              </p>
            </>
          ) : null}

          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-5">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: palette.text }}
            >
              Where it leads
            </h2>
            {axisTop > 0 ? (
              <p className="font-mono text-xs" style={{ color: palette.muted }}>
                to ${axisTop}K / yr
              </p>
            ) : null}
          </div>
          <ul className="space-y-4" data-testid={`career-bars-${slug}`}>
            {careers.map((c) => (
              <li key={c.name} className="text-sm">
                <div className="flex items-baseline justify-between gap-4 mb-1.5">
                  <span style={{ color: palette.text }}>{c.name}</span>
                  {c.low != null && c.high != null ? (
                    <span
                      className="font-mono text-xs whitespace-nowrap"
                      style={{ color: palette.primary }}
                    >
                      ${c.low}K&ndash;${c.high}K
                    </span>
                  ) : null}
                </div>
                {c.low != null && c.high != null && axisTop > 0 ? (
                  <div
                    className="relative h-2"
                    style={{ borderBottom: `1px solid ${hairline}` }}
                    aria-hidden="true"
                  >
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: `${(c.low / axisTop) * 100}%`,
                        width: `${((c.high - c.low) / axisTop) * 100}%`,
                        background: palette.primary,
                      }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-4">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: palette.text }}
            >
              The cast
            </h2>
            <p className="font-mono text-xs" style={{ color: palette.muted }}>
              {theme.characters.length} characters
            </p>
          </div>
          <ul>
            {castLead.map((c) => (
              <li
                key={c.name}
                className="flex items-start gap-3 border-b py-3"
                style={{ borderColor: hairline }}
              >
                <CharacterAvatar
                  name={c.name}
                  isAI={c.isAI}
                  accentColor={palette.primary}
                  size={40}
                />
                <div className="min-w-0">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: palette.text }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="font-mono text-xs uppercase tracking-[0.1em] ml-2"
                    style={{ color: palette.muted }}
                  >
                    {c.role}
                  </span>
                  <p
                    className="text-xs italic mt-1"
                    style={{ color: palette.muted }}
                  >
                    {c.personality}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {castRest.length > 0 ? (
            <p
              className="font-mono text-xs mt-3"
              style={{ color: palette.muted }}
            >
              + {castRest.map((c) => c.name).join(", ")}
            </p>
          ) : null}
        </div>
      </section>

      {/* Footer: waitlist band + Deep Orbit cross-link */}
      <section className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pb-16">
        <div
          className="border-2 p-6 md:p-8 rounded-none"
          style={{ borderColor: palette.primary, background: wash }}
        >
          <h2
            className="font-mono text-lg md:text-xl font-bold tracking-tight mb-1"
            style={{ color: palette.text }}
          >
            Join the waitlist
          </h2>
          <p
            className="font-mono text-xs mb-4"
            style={{ color: palette.muted }}
          >
            One email when {theme.displayName} ships. Nothing else.
          </p>
          <div className="max-w-[480px]">
            <ThemeWaitlistForm
              themeSlug={slug}
              themeName={theme.displayName}
              palette={palette}
              idSuffix="footer"
              source="coming-soon-footer"
              ctaLabel={preview?.ctaLabel ?? "Notify"}
            />
          </div>
        </div>
        <p className="mt-4 text-sm" style={{ color: palette.muted }}>
          Can&rsquo;t wait?{" "}
          <Link
            href="/themes/deep-orbit"
            className="underline underline-offset-4"
            style={{ color: palette.text }}
          >
            Start free in Deep Orbit
          </Link>
          , the live world. Same ML foundations track.
        </p>
      </section>
    </main>
  );
}
