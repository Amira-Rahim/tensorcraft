"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { themes, themeSlugs } from "@tensorcraft/themes";
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

/* ── Theme card data derived from manifests ──────────────── */

// Signature scene per world (Deep Orbit's lives in OrbitCanvas). Each is a
// sibling of drawOrbit: ambient-faint at rest, ignited by hover/focus.
const SCENE_BY_SLUG: Record<string, SceneDraw> = {
  "neon-protocol": drawNeonProtocol,
  "signal-ward": drawSignalWard,
  "nova-canvas": drawNovaCanvas,
  "terra-grid": drawTerraGrid,
};

const THEME_CARDS = themeSlugs.map((slug, i) => {
  const t = themes[slug];
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
    // text/badges ride the .tc-theme-card CSS pair (--card-primary /
    // --card-primary-light -> --card-active-primary).
    rgbLight: hexToRgb(t.paletteLight.primary),
    launched: isLaunched(t.slug),
    scene: SCENE_BY_SLUG[t.slug],
  };
});

const HERO_CARD = THEME_CARDS.find((c) => c.launched) ?? THEME_CARDS[0];
const COMING_SOON_CARDS = THEME_CARDS.filter((c) => !c.launched);

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

  return (
    <section className="border-b border-border">
      {/* Title lives ON the flagship surface: header and Deep Orbit share
          one full-width canvas, so they can't read as separate sections.
          The four unlaunched worlds run as a compact strip underneath. */}
      <motion.div
        className="relative overflow-hidden"
        onMouseEnter={() => setHovered(HERO_CARD.slug)}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered(HERO_CARD.slug)}
        onBlur={() => setHovered(null)}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <OrbitCanvas
          rgb={HERO_CARD.rgb}
          rgbLight={HERO_CARD.rgbLight}
          hovered={hovered === HERO_CARD.slug}
          className="absolute inset-0 z-0 pointer-events-none"
        />
        <div className="relative z-10 px-10 md:px-20 pt-16 pb-16">
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
            is live; the other four ship in waves.
          </p>

          <Link
            href={`/themes/${HERO_CARD.slug}`}
            className="block mt-12 group max-w-[640px]"
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
            className="relative overflow-hidden group tc-theme-card"
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
            onFocus={() => setHovered(t.slug)}
            onBlur={() => setHovered(null)}
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
            <Link
              href={`/themes/${t.slug}`}
              className="flex flex-col gap-1.5 relative z-10 px-8 py-8 h-full"
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
              <span
                className="font-mono text-xs tracking-wider group-hover:opacity-100 transition-opacity mt-1"
                style={{ color: "var(--card-active-primary)" }}
              >
                Notify me &rarr;
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
