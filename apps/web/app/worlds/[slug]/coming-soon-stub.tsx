import Link from "next/link";
import type { WorldManifest } from "@tensorcraft/worlds";
import {
  PRICING,
  WORLD_CONTENT,
  getWorldTotalLessons,
} from "@tensorcraft/shared";
// Subpath import: the root barrel pulls in sandpack-react, which the
// coming-soon page (and its jsdom tests) has no reason to load.
import { CharacterAvatar } from "@tensorcraft/ui/character-avatar";
import { WorldWaitlistForm } from "./world-waitlist-form";
import { ComingSoonScene } from "./coming-soon-scene";
import { WorldLearningPreview } from "@/app/components/world-learning-preview";
import type { WorldSlug } from "@tensorcraft/shared";

interface Props {
  world: WorldManifest;
}

// Irregular plurals for world module/lesson terminology.
const PLURALS: Record<string, string> = { Gallery: "Galleries" };
const plural = (word: string) => PLURALS[word] ?? `${word}s`;

/**
 * Coming-soon stub for unlaunched worlds. Server-rendered with world palette,
 * a split hero (in-world status board copy + live SceneCanvas feed frame),
 * a status-board module roster from `world.preview`, and waitlist capture in
 * the hero and the footer. JSON-LD ships `availability: OutOfStock` (changed
 * from PreOrder 2026-07-21: PreOrder implies the item can be ordered now for
 * later delivery, but checkout hard-rejects unlaunched worlds and only a
 * waitlist exists - OutOfStock is the truthful term) so search
 * engines surface the right rich snippet.
 *
 * Color is structural here: section borders and row hairlines mix the world
 * primary into the neutral border (`var(--tc-border)` is near-invisible on
 * `var(--tc-bg)`), and the free/capstone roster rows carry tinted washes.
 * bg/border/muted/text below read `var(--tc-*)` directly (they're identical
 * across every world's manifest in both schemes, so this stub never getting
 * its own `data-world` doesn't matter for them - see the paletteLight
 * comment below for why primary/accent are handled differently).
 */
export function ComingSoonStub({ world }: Props) {
  const slug = world.slug;
  const preview = world.preview;
  // Brand-green-only surface (2026-07-19 design decision): coming-soon pages
  // speak in the site chrome's green + shared neutrals, so they never clash
  // with the nav (world-provider only applies launched worlds' palettes).
  // World identity comes from the scene renderer, typography, and copy.
  // Per-world hues remain on /worlds cards and the homepage strip.
  const palette = {
    ...world.palette,
    primary: "#6BAA8A",
    accent: "#6BAA8A",
  };
  // Light-scheme counterpart, forced to deep-orbit's light primary (the
  // light equivalent of the brand green above, for the same reason: this
  // stub never gets its own `data-world` - only LAUNCHED worlds make
  // WorldSync/world-provider.tsx's setWorld() succeed, so a per-world light
  // hue here would read the wrong world's value once a second world
  // launches). Feeds ComingSoonScene's rgbLight.
  const paletteLight = {
    ...world.paletteLight,
    primary: "#3B6550",
    accent: "#3B6550",
  };
  const primary = "var(--tc-primary)";
  const modulePlural = plural(world.terminology.module);
  const lessonPlural = plural(world.terminology.lesson);
  const rosterPrefix = world.terminology.module.charAt(0).toUpperCase();
  const castLead = world.characters.slice(0, 3);
  const castRest = world.characters.slice(3);

  // Describe relevant roles without presenting unsupported salary outcomes.
  const careers = world.careerPaths.map((role) => ({
    name: role.replace(/\s*\(\$[^)]*\)\s*$/, ""),
  }));

  // World-mixed structural colors (see doc comment above).
  const edge = `color-mix(in srgb, ${primary} 25%, var(--tc-border))`;
  const hairline = `color-mix(in srgb, ${primary} 15%, var(--tc-border))`;
  const wash = `color-mix(in srgb, ${primary} 7%, var(--tc-bg))`;
  const accentWash = `color-mix(in srgb, ${primary} 9%, var(--tc-bg))`;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${world.displayName}: ${world.specialization}`,
    // Plain-language description for structured data. The page itself keeps
    // the story hook (rendered below), but a search snippet reaches a
    // stranger with no framing around it, so it states what the course is
    // (pre-lesson copy audit 2026-08-19).
    description: `${world.displayName} is a planned machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Not released yet. Join the waitlist.`,
    provider: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    url: `https://tensorcraft.app/worlds/${slug}`,
    educationalLevel: "Intermediate",
    programmingLanguage: ["JavaScript", "TypeScript"],
    teaches: world.specialization,
    offers: {
      "@type": "Offer",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/OutOfStock",
      url: `https://tensorcraft.app/worlds/${slug}`,
    },
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: "var(--tc-bg)" }}
      data-testid={`coming-soon-stub-${slug}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      {/* Hero: in-world status board over the world's ambient scene */}
      <header
        className="relative"
        style={{ borderBottom: `1px solid ${edge}` }}
      >
        <ComingSoonScene
          slug={slug}
          palette={palette}
          paletteLight={paletteLight}
        />
        <div className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pt-12 pb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-6 font-mono text-xs uppercase tracking-[0.2em]">
            <p style={{ color: "var(--tc-muted)" }}>
              {preview?.statusBoard.org ?? world.specialization}
              <span className="sr-only"> (coming soon)</span>
            </p>
            {preview ? (
              <p style={{ color: primary }}>{preview.statusBoard.status}</p>
            ) : null}
          </div>

          <div className="max-w-[640px]">
            <h1
              className="font-mono text-5xl md:text-7xl font-bold mb-4 leading-[1.05]"
              style={{ color: "var(--tc-text)", letterSpacing: "-0.02em" }}
            >
              {world.displayName}
            </h1>
            <p
              className="text-xl md:text-2xl leading-relaxed mb-5"
              style={{ color: "var(--tc-text)" }}
            >
              {world.tagline}
            </p>

            <p
              className="text-base leading-relaxed max-w-[560px] mb-6"
              style={{ color: "var(--tc-muted)" }}
            >
              {world.description}
            </p>

            <div className="max-w-[480px]">
              <WorldWaitlistForm
                worldSlug={slug}
                worldName={world.displayName}
                palette={palette}
                idSuffix="hero"
                source="coming-soon-hero"
                ctaLabel={preview?.ctaLabel ?? "Notify"}
              />
              <p
                className="font-mono text-xs mt-2"
                style={{ color: "var(--tc-muted)" }}
              >
                One email when {world.displayName} ships. Nothing else.
              </p>
            </div>
          </div>
        </div>
      </header>

      <WorldLearningPreview worldSlug={slug as WorldSlug} />

      {/* Module roster: in-world status board. Row state carries the launch
          scope (module 1 online + free, the rest pending rebuild). */}
      {preview ? (
        <section className="relative z-10 max-w-[1120px] mx-auto px-6 md:px-12 pt-12 pb-14">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-5">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: "var(--tc-text)" }}
            >
              The {WORLD_CONTENT.modulesPerWorld} {modulePlural}
            </h2>
            <p
              className="font-mono text-xs"
              style={{ color: "var(--tc-muted)" }}
            >
              {/* Per-world count from WORLD_SHAPE: neon-protocol authors 54,
                  not the flat 55 this line promised until 2026-07-25. */}
              {getWorldTotalLessons(slug)} planned {lessonPlural.toLowerCase()}
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
                className="flex items-baseline gap-4 border-b px-3 py-2.5 font-mono text-sm"
                style={{
                  borderBottomColor: hairline,
                  ...(m.free
                    ? { background: wash }
                    : m.capstone
                      ? { background: accentWash }
                      : {}),
                }}
              >
                <span
                  style={{
                    color: m.free
                      ? primary
                      : m.capstone
                        ? primary
                        : "var(--tc-muted)",
                  }}
                >
                  {rosterPrefix}
                  {String(m.order).padStart(2, "0")}
                </span>
                <span
                  className="flex-1"
                  style={{
                    color:
                      m.free || m.capstone
                        ? "var(--tc-text)"
                        : "var(--tc-muted)",
                  }}
                >
                  {m.title}
                </span>
                <span
                  className="text-[11px] uppercase tracking-[0.15em] whitespace-nowrap"
                  style={{
                    color: m.free
                      ? primary
                      : m.capstone
                        ? primary
                        : "var(--tc-muted)",
                  }}
                >
                  {m.free
                    ? "Free at launch"
                    : m.capstone
                      ? "Planned finale"
                      : "Planned"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Planned skills, relevant roles and cast. */}
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
                  style={{ color: "var(--tc-text)" }}
                >
                  Planned skills
                </h2>
                <p
                  className="font-mono text-xs"
                  style={{ color: "var(--tc-muted)" }}
                >
                  {preview.skills.length} capabilities
                </p>
              </div>
              <p className="font-mono text-sm leading-relaxed mb-8">
                {preview.skills.map((skill, i) => (
                  <span key={skill}>
                    {i > 0 ? (
                      <span aria-hidden="true" style={{ color: primary }}>
                        {" / "}
                      </span>
                    ) : null}
                    <span style={{ color: "var(--tc-text)" }}>{skill}</span>
                  </span>
                ))}
              </p>
            </>
          ) : null}

          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-5">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: "var(--tc-text)" }}
            >
              Roles that use these skills
            </h2>
          </div>
          <ul className="space-y-4" data-testid={`career-bars-${slug}`}>
            {careers.map((c) => (
              <li key={c.name} className="text-sm">
                <div className="flex items-baseline justify-between gap-4 mb-1.5">
                  <span style={{ color: "var(--tc-text)" }}>{c.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 mb-4">
            <h2
              className="font-mono text-xl md:text-2xl font-bold tracking-tight"
              style={{ color: "var(--tc-text)" }}
            >
              The cast
            </h2>
            <p
              className="font-mono text-xs"
              style={{ color: "var(--tc-muted)" }}
            >
              {world.characters.length} characters
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
                  accentColor={primary}
                  size={40}
                />
                <div className="min-w-0">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--tc-text)" }}
                  >
                    {c.name}
                  </span>
                  <span
                    className="font-mono text-xs uppercase tracking-[0.1em] ml-2"
                    style={{ color: "var(--tc-muted)" }}
                  >
                    {c.role}
                  </span>
                  <p
                    className="text-xs italic mt-1"
                    style={{ color: "var(--tc-muted)" }}
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
              style={{ color: "var(--tc-muted)" }}
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
          style={{ borderColor: primary, background: wash }}
        >
          <h2
            className="font-mono text-lg md:text-xl font-bold tracking-tight mb-1"
            style={{ color: "var(--tc-text)" }}
          >
            Join the waitlist
          </h2>
          <p
            className="font-mono text-xs mb-4"
            style={{ color: "var(--tc-muted)" }}
          >
            One email when {world.displayName} ships. Nothing else.
          </p>
          <div className="max-w-[480px]">
            <WorldWaitlistForm
              worldSlug={slug}
              worldName={world.displayName}
              palette={palette}
              idSuffix="footer"
              source="coming-soon-footer"
              ctaLabel={preview?.ctaLabel ?? "Notify"}
            />
          </div>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--tc-muted)" }}>
          Can&rsquo;t wait?{" "}
          <Link
            href="/worlds/deep-orbit"
            className="underline underline-offset-4"
            style={{ color: "var(--tc-text)" }}
          >
            Start free in Deep Orbit
          </Link>
          , the available course on tensors, training and browser inference.
        </p>
      </section>
    </main>
  );
}
