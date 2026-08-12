"use client";

import { worlds } from "@tensorcraft/worlds";
import { AnimatedAvatar } from "@tensorcraft/ui/animated-avatar";
import { portraitSources } from "@/lib/character-art";
import { heroPlateSrc } from "@/lib/location-art";

/* ── WorldCast: the crew, on the world page ───────────────────────────
   One uniform row: every character resolves to a shipped portrait,
   including ARIA, whose art is a waveform inside a brass instrument ring
   rather than a face (docs/character-bible.md). The procedural waveform
   avatar this row first used was retired once her art shipped.

   Every URL comes from portraitSources() rather than a built string, so a
   character with no slug or no art degrades to AnimatedAvatar's monogram
   placeholder instead of a broken frame. A world with no characters
   renders nothing at all. */

const AVATAR_SIZE = 88;

export function WorldCast({ slug }: { slug: string }) {
  const characters = worlds[slug]?.characters ?? [];
  if (characters.length === 0) return null;

  return (
    <section
      data-testid="world-cast"
      // tc-on-art when the world has a location plate: this row sits inside
      // the backdrop's first viewport, so in light scheme its names would
      // otherwise render near-black on the near-black plate.
      className={`relative z-10 px-12 py-10 border-b border-border${
        heroPlateSrc(slug) ? " tc-on-art" : ""
      }`}
      // Same veil as the page header directly above, so the two read as one
      // band rather than a header floating on art. It also buys the names
      // legibility over busy passages of the plate (the chronometer), which
      // axe cannot check: it compares CSS colours and never sees the image.
      style={{
        background: "color-mix(in srgb, var(--tc-bg) 70%, transparent)",
      }}
    >
      <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mb-6">
        The crew
      </h2>
      <ul className="flex flex-wrap gap-x-10 gap-y-8 list-none p-0 m-0">
        {characters.map((c) => (
          <li key={c.name} className="flex items-center gap-3">
            <AnimatedAvatar
              name={c.name}
              src={portraitSources(slug, c).src}
              size={AVATAR_SIZE}
            />
            <div className="flex flex-col">
              <span className="font-mono text-sm text-text-primary">
                {c.name}
              </span>
              {/* Role only. `personality` is a writing-room note, and
                  Nazari's gives away her arc. */}
              {c.role && (
                <span className="font-mono text-xs text-text-muted">
                  {c.role}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
