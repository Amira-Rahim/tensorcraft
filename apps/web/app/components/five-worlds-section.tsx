"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { worlds, worldSlugs } from "@tensorcraft/worlds";
import { isLaunched } from "@tensorcraft/shared";
import {
  OrbitCanvas,
  SceneCanvas,
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
  type SceneDraw,
} from "@tensorcraft/ui/effects";
// Subpath, not the barrel: @tensorcraft/ui's index pulls in the MDX lesson
// components and with them sandpack, which the landing page must not ship.
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { heroPlateSrc } from "@/lib/location-art";
// Notify path for the inert coming-soon cards. Cheap for this bundle: the
// modal renders null until opened, and its one heavy dependency (the
// Supabase browser client, via lib/waitlist) already ships with the nav.
import { NewsletterModal } from "@/app/worlds/newsletter-modal";

/* ── World card data derived from manifests ──────────────── */

// Signature scene per world (Deep Orbit's lives in OrbitCanvas). Each is a
// sibling of drawOrbit: ambient-faint at rest, ignited by hover/focus.
const SCENE_BY_SLUG: Record<string, SceneDraw> = {
  "neon-protocol": drawNeonProtocol,
  "signal-ward": drawSignalWard,
  "nova-canvas": drawNovaCanvas,
  "terra-grid": drawTerraGrid,
};

const WORLD_CARDS = worldSlugs.map((slug, i) => {
  const t = worlds[slug];
  return {
    code: String(i + 1).padStart(2, "0"),
    name: t.displayName,
    slug: t.slug,
    spec: t.specialization,
    tagline: t.tagline,
    col: t.palette.primary,
    colLight: t.paletteLight.primary,
    rgb: hexToRgb(t.palette.primary),
    // Light-scheme hue pair: canvases pick rgb/rgbLight per frame; DOM
    // text/badges ride the .tc-world-card CSS pair (--card-primary /
    // --card-primary-light -> --card-active-primary).
    rgbLight: hexToRgb(t.paletteLight.primary),
    launched: isLaunched(t.slug),
    scene: SCENE_BY_SLUG[t.slug],
  };
});

const HERO_CARD = WORLD_CARDS.find((c) => c.launched) ?? WORLD_CARDS[0];

// The flagship band is a viewport onto the Archimedes: the location master
// plate is the ground, and OrbitCanvas keeps running above it as the
// reflection on the glass. Undefined for a flagship with no shipped art, in
// which case the band is exactly the canvas-only band it was before.
const HERO_PLATE_SRC = heroPlateSrc(HERO_CARD.slug);
const COMING_SOON_CARDS = WORLD_CARDS.filter((c) => !c.launched);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/* ── Main section ──────────────────────────────────────── */

export function FiveWorldsSection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);

  return (
    <section className="border-b border-border">
      {/* Header rides the page surface, NOT the plate (owner ruling
          2026-08-23): prose over the busy art read as a defect no scrim
          could fully fix. Only the world block goes onto the glass below. */}
      <motion.div
        className="px-10 md:px-20 pt-16 pb-12"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between gap-6 mb-3">
          <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase">
            CHOOSE YOUR WORLD
          </div>
          <span
            className="font-mono text-xs font-bold tracking-wider px-3 py-1 shrink-0"
            style={{
              color: "var(--tc-primary)",
              background:
                "color-mix(in srgb, var(--tc-primary) 12%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--tc-primary) 35%, transparent)",
            }}
          >
            LIVE NOW
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
          Five Worlds
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[520px]">
          Same ML foundations track. Five story universes.{" "}
          <span style={{ color: "var(--tc-primary)" }}>{HERO_CARD.name}</span>{" "}
          is live. The other four have no release dates yet.
        </p>
      </motion.div>

      {/* The flagship band is the viewport onto the ship: plate ground,
          canvas reflection on the glass, world block over both. */}
      <motion.div
        className="relative overflow-hidden border-t border-border"
        onMouseEnter={() => setHovered(HERO_CARD.slug)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(HERO_CARD.slug)}
        onBlur={() => setHovered(null)}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        {HERO_PLATE_SRC && (
          <ArtPlate
            src={HERO_PLATE_SRC}
            bleed
            className="absolute inset-0 z-0"
          />
        )}
        <OrbitCanvas
          rgb={HERO_CARD.rgb}
          // Over a plate the band is a dark viewport in both schemes, so the
          // canvas keeps its dark hue: the light hue (#3b6550) was minted for
          // a paper background and all but vanishes on the near-black art.
          rgbLight={HERO_PLATE_SRC ? HERO_CARD.rgb : HERO_CARD.rgbLight}
          hovered={hovered === HERO_CARD.slug}
          // z-1, not z-0: over a plate the canvas is the reflection on the
          // glass, so it has to paint above the art rather than under it.
          // OrbitCanvasProps exposes className but not style, so the dimming
          // rides a utility class.
          className={`absolute inset-0 z-1 pointer-events-none${
            HERO_PLATE_SRC ? " opacity-50" : ""
          }`}
        />
        {HERO_PLATE_SRC && (
          // Reading-column scrim: banked behind the text on the left, open
          // on the right where the art is the point. See .tc-art-scrim-read.
          <div
            aria-hidden="true"
            className="tc-art-scrim tc-art-scrim-read z-2"
          />
        )}
        {/* tc-on-art: the band is a lit viewport onto the ship, so its type
            stays on the dark palette even when the page around it is paper. */}
        <div
          className={`relative z-10 px-10 md:px-20 pt-16 pb-16${
            HERO_PLATE_SRC ? " tc-on-art" : ""
          }`}
        >
          <Link
            href={`/worlds/${HERO_CARD.slug}`}
            className="block group max-w-[640px]"
          >
            <div
              className="text-4xl md:text-6xl font-mono font-black tracking-tight mb-3"
              style={{ color: "var(--tc-primary)" }}
            >
              {HERO_CARD.name}
            </div>
            <div className="font-mono text-sm text-text-primary mb-4">
              {HERO_CARD.spec}
            </div>
            <p className="text-base md:text-lg text-text-muted leading-relaxed mb-6">
              {HERO_CARD.tagline}
            </p>
            <span
              className="font-mono text-sm tracking-wider group-hover:opacity-80 transition-opacity"
              style={{ color: "var(--tc-primary)" }}
            >
              Start Module 1 &rarr;
            </span>
          </Link>
        </div>
      </motion.div>

      {/* Coming-next strip: compact 4-up row under the flagship */}
      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {COMING_SOON_CARDS.map((t, i) => (
          <motion.div
            key={t.code}
            className="relative overflow-hidden group tc-world-card"
            style={
              {
                borderRight:
                  i < COMING_SOON_CARDS.length - 1
                    ? "1px solid var(--tc-border)"
                    : "none",
                "--card-primary": t.col,
                "--card-primary-light": t.colLight,
              } as React.CSSProperties
            }
            onMouseEnter={() => setHovered(t.slug)}
            onMouseLeave={() => setHovered(null)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <SceneCanvas
              draw={t.scene ?? drawTerraGrid}
              rgb={t.rgb}
              rgbLight={t.rgbLight}
              hovered={hovered === t.slug}
              className="absolute inset-0 z-0 pointer-events-none"
            />
            {/* Inert until launch: no link, not-allowed cursor (matches
                worlds/world-cards-grid.tsx). The hover handlers on the
                wrapping motion.div keep the scene ignition and hover
                treatment completing unchanged; the card's one tab stop
                is the Notify me CTA button below. */}
            <div
              className="flex flex-col gap-1.5 relative z-10 px-8 py-8 h-full cursor-not-allowed"
              data-testid={`coming-soon-card-${t.slug}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="text-[13px] font-bold tracking-tight uppercase group-hover:text-text-primary transition-colors"
                  style={{ color: "var(--tc-muted)" }}
                >
                  {t.name}
                </div>
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
              <div className="font-mono text-xs text-text-muted">{t.spec}</div>
              {/* The one interactive element on the inert card: opens the
                  newsletter modal. Focus mirrors hover so keyboard users
                  get the same scene ignition. */}
              <button
                type="button"
                onClick={() => setNotifyOpen(true)}
                onFocus={() => setHovered(t.slug)}
                onBlur={() => setHovered(null)}
                className="font-mono text-xs tracking-wider group-hover:opacity-100 transition-opacity mt-1 self-start text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                style={{ color: "var(--card-active-primary)" }}
              >
                Notify me &rarr;
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <NewsletterModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </section>
  );
}
