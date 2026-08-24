"use client";

import { useState } from "react";
import { worlds } from "@tensorcraft/worlds";
import { WORLD_SLUGS, isLaunched } from "@tensorcraft/shared";
import { SceneCanvas, drawTerraGrid } from "@tensorcraft/ui/effects";
// Subpath, not the barrel (sandpack must not ship with this page).
import { SCENE_BY_SLUG, hexToRgb } from "@/lib/scene-by-slug";
import { NewsletterModal } from "@/app/worlds/newsletter-modal";

const CARDS = WORLD_SLUGS.filter((slug) => !isLaunched(slug)).map((slug) => {
  const world = worlds[slug];
  return {
    slug,
    name: world?.displayName ?? slug,
    spec: world?.specialization ?? "",
    col: world?.palette.primary ?? "#6baa8a",
    colLight: world?.paletteLight.primary ?? "#3b6550",
    rgb: hexToRgb(world?.palette.primary ?? "#6baa8a"),
    rgbLight: hexToRgb(world?.paletteLight.primary ?? "#3b6550"),
    scene: SCENE_BY_SLUG[slug] ?? drawTerraGrid,
  };
});

/**
 * The four coming-soon courses as live scene cards (five-worlds-section
 * grammar, minus framer-motion: /learn copy never rides an entrance).
 *
 * Inert on purpose: names are plain text, no link anywhere on the card
 * (worlds/world-cards-grid precedent, pinned by page.test.tsx). One notify
 * line under the strip instead of a button per card: four identical
 * buttons opening the same modal read as noise (busy-page pass,
 * 2026-08-24), and the cards themselves stay purely informational.
 */
export function ComingSoonWorlds() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);

  return (
    <>
      {/* Full-bleed strip under a border-t, edge to edge like the landing
          five-worlds coming-next row; the section's own borders frame it. */}
      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card, i) => (
          <div
            key={card.slug}
            className="relative overflow-hidden group tc-world-card"
            style={
              {
                borderRight:
                  i < CARDS.length - 1 ? "1px solid var(--tc-border)" : "none",
                "--card-primary": card.col,
                "--card-primary-light": card.colLight,
              } as React.CSSProperties
            }
            onMouseEnter={() => setHovered(card.slug)}
            onMouseLeave={() => setHovered(null)}
          >
            <SceneCanvas
              draw={card.scene}
              rgb={card.rgb}
              rgbLight={card.rgbLight}
              hovered={hovered === card.slug}
              className="absolute inset-0 z-0 pointer-events-none"
            />
            <div
              className="flex flex-col gap-1.5 relative z-10 px-8 py-8 h-full min-h-[200px] cursor-not-allowed"
              data-testid={`learn-coming-soon-${card.slug}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-[13px] font-bold tracking-tight uppercase group-hover:text-text-primary transition-colors"
                  style={{ color: "var(--tc-muted)" }}
                >
                  {card.name}
                </span>
                <span
                  className="font-mono text-[10px] font-bold tracking-wider px-2 py-0.5 shrink-0"
                  style={{
                    color: "var(--card-active-primary)",
                    background:
                      "color-mix(in srgb, var(--card-active-primary) 8%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--card-active-primary) 22%, transparent)",
                  }}
                >
                  COMING SOON
                </span>
              </div>
              <span className="font-mono text-xs text-text-muted">
                {card.spec}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-10 md:px-20 py-6 border-t border-border">
        <button
          type="button"
          onClick={() => setNotifyOpen(true)}
          className="font-mono text-xs tracking-wider text-primary hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          Notify me when a course opens &rarr;
        </button>
      </div>

      <NewsletterModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </>
  );
}
