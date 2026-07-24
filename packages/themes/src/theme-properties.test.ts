import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { themes, themeSlugs, hexToRgbTriplet, contrastRatio } from "./index";

const cssPath = path.resolve(__dirname, "css/themes.css");
const cssContent = fs.readFileSync(cssPath, "utf-8");

const REQUIRED_CSS_PROPS = [
  "--tc-bg",
  "--tc-primary",
  "--tc-accent",
  "--tc-surface",
  "--tc-surface-overlay",
  "--tc-text",
  "--tc-muted",
  "--tc-border",
  "--tc-code-bg",
];

const PALETTE_KEYS = [
  "bg",
  "primary",
  "accent",
  "surface",
  "surfaceOverlay",
  "text",
  "muted",
  "border",
  "codeBg",
] as const;

describe("Theme CSS custom properties", () => {
  it("CSS file exists and is non-empty", () => {
    expect(cssContent.length).toBeGreaterThan(0);
  });

  it("deep-orbit is the :root default", () => {
    expect(cssContent).toContain(":root");
    expect(cssContent).toContain('[data-theme="deep-orbit"]');
  });

  it('dark default block (:root, [data-theme="deep-orbit"]) defines --tc-grid-line', () => {
    // --tc-grid-line (the .grid-bg token, Task 3) is declared once, global-
    // only, on the :root default block — not per non-default theme, and not
    // part of REQUIRED_CSS_PROPS's fixed 9-key list (that list is the
    // ThemePalette shape; grid-line has no ThemePalette/manifest
    // counterpart to cross-check against). A prior gap-analysis noted this
    // structural test couldn't have caught the property's absence; this
    // closes that gap directly. `toContain` (not a hex-format check) since
    // the value is an rgba(), not a 6-digit hex like the palette keys.
    expect(extractDarkThemeBlock("deep-orbit")).toContain("--tc-grid-line");
  });

  it.each([...themeSlugs])(
    "theme '%s' has a [data-theme] selector in CSS",
    (slug) => {
      expect(cssContent).toContain(`data-theme="${slug}"`);
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' defines all 9 required --tc-* properties",
    (slug) => {
      // DRY: reuses extractDarkThemeBlock (defined below — hoisted function
      // declaration, safe to call from here) instead of re-deriving the same
      // block-extraction regex a second time in this file.
      const block = extractDarkThemeBlock(slug);
      REQUIRED_CSS_PROPS.forEach((prop) => {
        expect(block).toContain(prop);
      });
    },
  );
});

describe("Theme TypeScript manifests", () => {
  it.each([...themeSlugs])(
    "theme '%s' has all required palette keys",
    (slug) => {
      const theme = themes[slug];
      expect(theme).toBeDefined();
      PALETTE_KEYS.forEach((key) => {
        expect(theme.palette[key]).toBeDefined();
        expect(theme.palette[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' has required manifest fields",
    (slug) => {
      const theme = themes[slug];
      expect(theme.slug).toBe(slug);
      expect(theme.displayName).toBeTruthy();
      expect(theme.tagline).toBeTruthy();
      expect(theme.characters.length).toBeGreaterThan(0);
    },
  );
});

describe("Theme manifest/CSS consistency (dark, all 9 keys)", () => {
  // Extended from a 2-key (primary/accent) substring-anywhere-in-file check
  // to a block-scoped check of all 9 ThemePalette keys, per-theme. Scoping
  // to the theme's own dark CSS block (via extractDarkThemeBlock, defined
  // below) is strictly stronger than the old `cssContentLower.toContain`
  // check, which could not tell whether a value appeared in the RIGHT
  // theme's block. This is what caught the bg/surface/muted/border/codeBg
  // drift between the TS manifests and themes.css (see Task 7's self-review
  // finding, 2026-07-22): the manifests still had the pre-Task-2/3 neutral
  // values (#1C1C1C/#252525/#A0A0A0/#2A2A2A/#161616) after themes.css moved
  // to #181818/#232323/#B0B0B0/#3D3D3D/#141414.
  it.each([...themeSlugs])(
    "theme '%s' palette matches CSS for all 9 keys",
    (slug) => {
      const theme = themes[slug];
      const block = extractDarkThemeBlock(slug);
      PALETTE_KEYS.forEach((key, i) => {
        const cssProp = REQUIRED_CSS_PROPS[i]!;
        const cssHex = extractCssHexValue(block, cssProp);
        expect(cssHex.toLowerCase(), `palette.${key} vs CSS ${cssProp}`).toBe(
          theme.palette[key].toLowerCase(),
        );
      });
    },
  );
});

describe("Theme palette shape (brutalist 9-key)", () => {
  // Old palette had 11 keys including glow/neonLine. The new brutalist shape
  // has exactly 9 keys - no glow, no neonLine. This test locks the shape.
  const REMOVED_KEYS = ["glow", "neonLine"];

  it.each([...themeSlugs])(
    "theme '%s' has no removed keys (glow/neonLine)",
    (slug) => {
      const palette = themes[slug].palette as Record<string, unknown>;
      REMOVED_KEYS.forEach((key) => {
        expect(palette[key]).toBeUndefined();
      });
    },
  );

  it.each([...themeSlugs])("theme '%s' palette has exactly 9 keys", (slug) => {
    const palette = themes[slug].palette;
    expect(Object.keys(palette)).toHaveLength(9);
  });
});

describe("ThemePalette vs CSS property alignment", () => {
  it("CSS and ThemePalette both have 9 properties", () => {
    // CSS defines: bg, primary, accent, surface, surface-overlay, text, muted, border, code-bg (9)
    // ThemePalette has: bg, primary, accent, surface, surfaceOverlay, text, muted, border, codeBg (9)
    expect(REQUIRED_CSS_PROPS.length).toBe(9);
    expect(PALETTE_KEYS.length).toBe(9);
  });
});

describe("Coming-soon preview data", () => {
  const COMING_SOON = [
    "signal-ward",
    "neon-protocol",
    "nova-canvas",
    "terra-grid",
  ] as const;

  it.each([...COMING_SOON])("theme '%s' has a preview block", (slug) => {
    expect(themes[slug].preview).toBeDefined();
  });

  it.each([...COMING_SOON])(
    "theme '%s' preview has exactly 11 modules ordered 1-11",
    (slug) => {
      const mods = themes[slug].preview!.modules;
      expect(mods).toHaveLength(11);
      expect(mods.map((m) => m.order)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      ]);
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview has exactly one free module (order 1) and one capstone (order 11)",
    (slug) => {
      const mods = themes[slug].preview!.modules;
      const free = mods.filter((m) => m.free);
      const capstone = mods.filter((m) => m.capstone);
      expect(free).toHaveLength(1);
      expect(free[0]!.order).toBe(1);
      expect(capstone).toHaveLength(1);
      expect(capstone[0]!.order).toBe(11);
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview has 8 skills and non-empty status board",
    (slug) => {
      const preview = themes[slug].preview!;
      expect(preview.skills).toHaveLength(8);
      expect(preview.statusBoard.org).toBeTruthy();
      expect(preview.statusBoard.status).toBeTruthy();
      expect(preview.ctaLabel).toBeTruthy();
    },
  );

  it.each([...COMING_SOON])(
    "theme '%s' preview copy contains no em dashes",
    (slug) => {
      const json = JSON.stringify(themes[slug].preview);
      expect(json).not.toContain("—");
    },
  );

  it("deep-orbit has no preview block (launched themes do not need one)", () => {
    expect(themes["deep-orbit"]!.preview).toBeUndefined();
  });
});

describe("Deep Orbit character avatars", () => {
  const chars = themes["deep-orbit"]!.characters;
  it("every character has a kebab-case slug", () => {
    for (const c of chars) {
      expect(c.slug, `${c.name} needs a slug`).toMatch(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
      );
    }
  });
  it("slugs are unique", () => {
    const slugs = chars.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("ARIA is flagged isAI", () => {
    const aria = chars.find((c) => c.name === "ARIA");
    expect(aria?.isAI).toBe(true);
  });
});

// ============================================================
// Light scheme (data-scheme="light") — orthogonal to narrative theme
// ============================================================

// 8 shared neutrals (bg/surface/surface-overlay/surface-raised/text/muted/
// border/code-bg) + 4 semantic colors (success/warning/error/streak) live in
// the single bare [data-scheme="light"] block.
const REQUIRED_LIGHT_SHARED_PROPS = [
  "--tc-bg",
  "--tc-surface",
  "--tc-surface-overlay",
  "--tc-surface-raised",
  "--tc-text",
  "--tc-muted",
  "--tc-border",
  "--tc-code-bg",
  "--tc-success",
  "--tc-warning",
  "--tc-error",
  "--tc-streak",
];

// Per-theme light overrides: primary/accent + the derived rgb triplet +
// tier colors + the 3 literal (non-var()) axis colors. axis-data-prep/
// model-arch/training are var() indirections in the dark blocks and
// inherit the light primary/tier values automatically, so they are not
// re-declared per theme.
const REQUIRED_LIGHT_PER_THEME_PROPS = [
  "--tc-primary",
  "--tc-accent",
  "--tc-primary-rgb",
  "--tc-tier-identity",
  "--tc-tier-structural",
  "--tc-tier-intuition",
  "--tc-axis-evaluation",
  "--tc-axis-deployment",
  "--tc-axis-fe-integration",
];

describe("Light scheme CSS custom properties", () => {
  it('CSS contains a bare [data-scheme="light"] block defining all 8 shared neutrals + 4 semantic colors', () => {
    // Matches only the standalone neutrals block (selector immediately
    // followed by "{"), not the deep-orbit selector list where
    // [data-scheme="light"] is immediately followed by a comma.
    const match = cssContent.match(/\[data-scheme="light"\]\s*\{([^}]+)\}/s);
    expect(match).not.toBeNull();
    const block = match![1];
    REQUIRED_LIGHT_SHARED_PROPS.forEach((prop) => {
      expect(block).toContain(prop);
    });
  });

  it.each([...themeSlugs])(
    'theme \'%s\' has a [data-theme="<slug>"][data-scheme="light"] block defining primary/accent/rgb/tier/axis',
    (slug) => {
      const selectorPattern = new RegExp(
        `\\[data-theme="${slug}"\\]\\[data-scheme="light"\\]\\s*\\{([^}]+)\\}`,
        "s",
      );
      const match = cssContent.match(selectorPattern);
      expect(match).not.toBeNull();
      const block = match![1];
      REQUIRED_LIGHT_PER_THEME_PROPS.forEach((prop) => {
        expect(block).toContain(prop);
      });
    },
  );

  it('light shared block ([data-scheme="light"]) defines --tc-grid-line', () => {
    // Light counterpart of the dark --tc-grid-line check above (Task 3's
    // light .grid-bg re-tint). Same reasoning: `toContain`, not hex-format,
    // since the value is rgba(0, 0, 0, 0.03), not a 6-digit hex.
    expect(extractLightSharedBlock()).toContain("--tc-grid-line");
  });

  it('deep-orbit\'s light block is also reachable via the bare [data-scheme="light"] selector (root default)', () => {
    // Per the dark section's `:root, [data-theme="deep-orbit"]` pattern,
    // the light override for the default theme must be selectable via a
    // selector list: [data-scheme="light"], [data-theme="deep-orbit"][data-scheme="light"]
    expect(cssContent).toMatch(
      /\[data-scheme="light"\],\s*\n?\s*\[data-theme="deep-orbit"\]\[data-scheme="light"\]\s*\{/,
    );
  });
});

describe("Theme TypeScript manifests — paletteLight", () => {
  it.each([...themeSlugs])(
    "theme '%s' has paletteLight with all 9 required keys, hex-formatted",
    (slug) => {
      const theme = themes[slug];
      expect(theme.paletteLight).toBeDefined();
      PALETTE_KEYS.forEach((key) => {
        expect(theme.paletteLight[key]).toBeDefined();
        expect(theme.paletteLight[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' paletteLight has exactly 9 keys (same shape as palette)",
    (slug) => {
      expect(Object.keys(themes[slug].paletteLight)).toHaveLength(9);
    },
  );
});

describe("Theme manifest paletteLight/CSS light consistency (all 9 keys)", () => {
  // Extended from a 2-key (primary/accent) check to all 9 ThemePalette keys.
  // Unlike the dark side, the 7 shared neutrals (bg/surface/surfaceOverlay/
  // text/muted/border/codeBg) are NOT redeclared per-theme in the light CSS
  // — they live once in the bare [data-scheme="light"] block (see themes.css
  // Task 2 comment) — so those keys are read from extractLightSharedBlock()
  // while primary/accent are read from this theme's own
  // [data-theme="<slug>"][data-scheme="light"] block.
  it.each([...themeSlugs])(
    "theme '%s' paletteLight matches CSS for all 9 keys",
    (slug) => {
      const theme = themes[slug];
      const perThemeBlock = extractLightThemeBlock(slug);
      const sharedBlock = extractLightSharedBlock();
      PALETTE_KEYS.forEach((key, i) => {
        const cssProp = REQUIRED_CSS_PROPS[i]!;
        const block =
          key === "primary" || key === "accent" ? perThemeBlock : sharedBlock;
        const cssHex = extractCssHexValue(block, cssProp);
        expect(
          cssHex.toLowerCase(),
          `paletteLight.${key} vs CSS ${cssProp}`,
        ).toBe(theme.paletteLight[key].toLowerCase());
      });
    },
  );
});

// ============================================================
// CSS block/value extraction helpers
//
// hexToRgb/hexToRgbTriplet/relativeLuminance/contrastRatio live in
// ./wcag.ts (shared with packages/ui); these helpers stay local since
// they're only about parsing this package's themes.css text.
// ============================================================

/** Extracts the raw declaration block for a dark theme's [data-theme] rule. */
function extractDarkThemeBlock(slug: string): string {
  const pattern =
    slug === "deep-orbit"
      ? /(:root,\s*\[data-theme="deep-orbit"\])\s*\{([^}]+)\}/s
      : new RegExp(`\\[data-theme="${slug}"\\]\\s*\\{([^}]+)\\}`, "s");
  const match = cssContent.match(pattern);
  if (!match) throw new Error(`Could not find dark CSS block for '${slug}'`);
  return match[match.length - 1]!;
}

/** Extracts the raw declaration block for a theme's [data-scheme="light"] rule. */
function extractLightThemeBlock(slug: string): string {
  const pattern = new RegExp(
    `\\[data-theme="${slug}"\\]\\[data-scheme="light"\\]\\s*\\{([^}]+)\\}`,
    "s",
  );
  const match = cssContent.match(pattern);
  if (!match) throw new Error(`Could not find light CSS block for '${slug}'`);
  return match[1]!;
}

/**
 * Extracts the shared (theme-agnostic) declaration block for the bare
 * [data-scheme="light"] rule — the 7 neutral keys other than primary/accent
 * live here once, not per-theme (see the "Light scheme CSS custom
 * properties" describe block above, which pins this same shape).
 */
function extractLightSharedBlock(): string {
  const match = cssContent.match(/\[data-scheme="light"\]\s*\{([^}]+)\}/s);
  if (!match)
    throw new Error('Could not find bare [data-scheme="light"] block');
  return match[1]!;
}

/** Extracts a single `--tc-prop: #hex;` value out of a CSS block's text. */
function extractCssHexValue(block: string, prop: string): string {
  const match = block.match(new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Could not find ${prop} in CSS block`);
  return match[1]!;
}

/**
 * Extracts a `--tc-prop-rgb: r, g, b;` triplet out of a CSS block's text,
 * normalized to the same "r, g, b" spacing hexToRgbTriplet() produces.
 */
function extractCssRgbTripletText(block: string, prop: string): string {
  const match = block.match(
    new RegExp(`${prop}:\\s*([0-9]+\\s*,\\s*[0-9]+\\s*,\\s*[0-9]+)`),
  );
  if (!match) throw new Error(`Could not find ${prop} triplet in CSS block`);
  return match[1]!
    .split(",")
    .map((n) => n.trim())
    .join(", ");
}

describe("--tc-primary-rgb stays numerically in sync with --tc-primary", () => {
  // This is the exact stale-triplet bug class the light-scheme task fixed
  // (neon-protocol/nova-canvas dark triplets had drifted from their hex).
  // Assert it numerically, per theme, per scheme, from the real CSS text.
  it.each([...themeSlugs])(
    "theme '%s' dark --tc-primary-rgb matches hexToRgbTriplet(--tc-primary)",
    (slug) => {
      const block = extractDarkThemeBlock(slug);
      const primaryHex = extractCssHexValue(block, "--tc-primary");
      const rgbText = extractCssRgbTripletText(block, "--tc-primary-rgb");
      expect(rgbText).toBe(hexToRgbTriplet(primaryHex));
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' light --tc-primary-rgb matches hexToRgbTriplet(--tc-primary)",
    (slug) => {
      const block = extractLightThemeBlock(slug);
      const primaryHex = extractCssHexValue(block, "--tc-primary");
      const rgbText = extractCssRgbTripletText(block, "--tc-primary-rgb");
      expect(rgbText).toBe(hexToRgbTriplet(primaryHex));
    },
  );
});

describe("WCAG contrast gate", () => {
  // Shared light neutrals, extracted from the real [data-scheme="light"]
  // CSS block (same regex the "shared neutrals presence" test above uses)
  // rather than hand-typed literals, so an edit to themes.css can't drift
  // silently out of sync with what this gate actually checks.
  const lightNeutralBlockMatch = cssContent.match(
    /\[data-scheme="light"\]\s*\{([^}]+)\}/s,
  );
  if (!lightNeutralBlockMatch) {
    throw new Error('Could not find bare [data-scheme="light"] block');
  }
  const lightNeutralBlock = lightNeutralBlockMatch[1]!;

  const LIGHT_BG = extractCssHexValue(lightNeutralBlock, "--tc-bg");
  const LIGHT_SURFACE = extractCssHexValue(lightNeutralBlock, "--tc-surface");
  const LIGHT_TEXT = extractCssHexValue(lightNeutralBlock, "--tc-text");
  const LIGHT_MUTED = extractCssHexValue(lightNeutralBlock, "--tc-muted");

  it("light text vs light bg contrast is >= 7 (AAA body text)", () => {
    expect(contrastRatio(LIGHT_TEXT, LIGHT_BG)).toBeGreaterThanOrEqual(7);
  });

  it("light muted vs light surface contrast is >= 4.5 (AA body text)", () => {
    expect(contrastRatio(LIGHT_MUTED, LIGHT_SURFACE)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  // Tested against the LIGHT PAGE BG (#f5f5f2), not white: the first light
  // palette was minted at >=4.6:1 vs #ffffff and every light axe audit
  // failed at 4.21:1 on the real page bg (2026-07-23). #f5f5f2 is the
  // darker of the two body surfaces, so clearing it implies clearing white.
  it.each([...themeSlugs])(
    "theme '%s' light primary and accent contrast >= 4.5 against the light page bg",
    (slug) => {
      const theme = themes[slug];
      expect(
        contrastRatio(theme.paletteLight.primary, LIGHT_BG),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.paletteLight.accent, LIGHT_BG),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  // Self-tint gate: `text-primary` sits on `bg-primary/N` tints (chips,
  // toggles, error-page CTAs) up to N=20 at rest. A tint of the primary
  // OVER WHITE darkens the substrate while the text stays fixed - the
  // second light palette cleared the page bg but failed axe at 4.1:1 on a
  // 10% self-tint (2026-07-23). Rest-state tints are capped at 20%;
  // stronger hover tints were converted to solid inverted hovers
  // (bg-primary + text-on-primary) instead of darkening further.
  const srgbBlend = (fg: string, bg: string, alpha: number): string => {
    const c = (h: string) =>
      [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [fr, fg_, fb] = c(fg);
    const [br, bg_, bb] = c(bg);
    const mix = (a: number, b: number) =>
      Math.round(alpha * a + (1 - alpha) * b);
    return `#${[mix(fr!, br!), mix(fg_!, bg_!), mix(fb!, bb!)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
  };
  it.each([...themeSlugs])(
    "theme '%s' light primary stays >= 4.5 on its own 10-20% tints over white and page bg",
    (slug) => {
      const theme = themes[slug];
      for (const alpha of [0.1, 0.12, 0.15, 0.2]) {
        for (const substrate of ["#FFFFFF", LIGHT_BG]) {
          expect(
            contrastRatio(
              theme.paletteLight.primary,
              srgbBlend(theme.paletteLight.primary, substrate, alpha),
            ),
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  // Existing dark values: verified (via scratch computation) that every
  // dark primary/accent already clears 4.5:1 against its dark bg — the
  // lowest margin is neon-protocol's accent at ~5.2:1. Locking that bar
  // here rather than raising it further, since the task requires the dark
  // palette values to stay untouched.
  it.each([...themeSlugs])(
    "theme '%s' dark primary and accent contrast >= 4.5 against dark bg (existing values, locked)",
    (slug) => {
      const theme = themes[slug];
      expect(
        contrastRatio(theme.palette.primary, theme.palette.bg),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(theme.palette.accent, theme.palette.bg),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  // --tc-on-primary: the ink for primary/accent-FILLED elements (buttons,
  // chips, ::selection). Found by the light axe matrix (2026-07-23): the
  // light page bg #f5f5f2 was reused as this ink and sat at 4.21:1 on the
  // light primaries — every light page failed. Light ink is pure white
  // (the light primaries/accents were minted >= 4.6:1 against #ffffff);
  // dark keeps the page bg (near-black on the bright dark hues).
  const darkRootBlockMatch = cssContent.match(
    /:root,\s*\[data-theme="deep-orbit"\]\s*\{([^}]+)\}/s,
  );
  if (!darkRootBlockMatch) {
    throw new Error("Could not find :root dark block");
  }
  const ON_PRIMARY_DARK = extractCssHexValue(
    darkRootBlockMatch[1]!,
    "--tc-on-primary",
  );
  const ON_PRIMARY_LIGHT = extractCssHexValue(
    lightNeutralBlock,
    "--tc-on-primary",
  );

  it.each([...themeSlugs])(
    "theme '%s': on-primary ink >= 4.5 on primary and accent fills, both schemes",
    (slug) => {
      const theme = themes[slug];
      for (const fill of [theme.palette.primary, theme.palette.accent]) {
        expect(contrastRatio(ON_PRIMARY_DARK, fill)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
      for (const fill of [
        theme.paletteLight.primary,
        theme.paletteLight.accent,
      ]) {
        expect(contrastRatio(ON_PRIMARY_LIGHT, fill)).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  // Semantic tokens ON ELEVATED SURFACES AND SELF-TINTS, both schemes.
  // Found in the 2026-07-23 deep-verification pass: the error-token sweep
  // (red-400 -> --tc-error) silently regressed DARK - the mid-tone
  // #ef4444 failed 4.5:1 on surface-raised/overlay and on its own chip
  // tints (exercise result panels, session toast), which is exactly why
  // the bright red-400 pastel existed in the first place. Dark semantic
  // values are now the pastels (#fca5a5 / #4ade80); this gate encodes the
  // REAL usage floors so neither scheme can drift:
  //   - semantic text sits directly on all four surfaces
  //   - error/success text sits on its own tints up to 15% (score chips),
  //     warning up to 10% (hint chrome), streak up to 8% (color-mix chips),
  //     each over the page bg AND surface-raised.
  const SEMANTIC_TINT_CAP: Record<string, number> = {
    "--tc-error": 0.15,
    "--tc-success": 0.15,
    "--tc-warning": 0.1,
    "--tc-streak": 0.08,
  };
  const semanticSurfaces = (block: string) => ({
    bg: extractCssHexValue(block, "--tc-bg"),
    surface: extractCssHexValue(block, "--tc-surface"),
    raised: extractCssHexValue(block, "--tc-surface-raised"),
    overlay: extractCssHexValue(block, "--tc-surface-overlay"),
  });
  const schemes: Array<[string, string]> = [
    ["dark", darkRootBlockMatch[1]!],
    ["light", lightNeutralBlock],
  ];
  // Light shares neutrals with the dark :root block only for props the light
  // block does not override; resolve each prop from the light block first,
  // falling back to the dark root (the cascade the browser applies).
  const resolveLight = (prop: string): string => {
    try {
      return extractCssHexValue(lightNeutralBlock, prop);
    } catch {
      return extractCssHexValue(darkRootBlockMatch[1]!, prop);
    }
  };
  it.each(schemes.map(([name]) => name))(
    "%s semantic tokens clear 4.5:1 on every surface and their own usage-tier tints",
    (schemeName) => {
      const get =
        schemeName === "dark"
          ? (prop: string) => extractCssHexValue(darkRootBlockMatch[1]!, prop)
          : resolveLight;
      const surfaces = {
        bg: get("--tc-bg"),
        surface: get("--tc-surface"),
        raised: get("--tc-surface-raised"),
        overlay: get("--tc-surface-overlay"),
      };
      for (const [prop, cap] of Object.entries(SEMANTIC_TINT_CAP)) {
        const color = get(prop);
        for (const [surfName, surf] of Object.entries(surfaces)) {
          expect(
            contrastRatio(color, surf),
            `${schemeName} ${prop} on ${surfName}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        for (const alpha of [0.08, 0.1, 0.15].filter((a) => a <= cap)) {
          for (const surf of [surfaces.bg, surfaces.raised]) {
            expect(
              contrastRatio(color, srgbBlend(color, surf, alpha)),
              `${schemeName} ${prop} on ${Math.round(alpha * 100)}% self-tint`,
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    },
  );

  // --tc-border-interactive: the resting boundary of interactive controls
  // (form fields, radio/checkbox options, toggle tracks, outline buttons).
  // WCAG 1.4.11 requires a UI-component boundary to clear 3:1 against its
  // ADJACENT colors — both the page bg behind it AND the (lighter) surface a
  // control sits on. The decorative --tc-border (#3d3d3d, 1.63:1) is fine for
  // dividers but fails here, which is why controls use this louder token.
  // Extracted from real CSS so a palette edit can't drift past the gate.
  const DARK_ROOT = darkRootBlockMatch[1]!;
  const DARK_BORDER_INTERACTIVE = extractCssHexValue(
    DARK_ROOT,
    "--tc-border-interactive",
  );
  const DARK_BG = extractCssHexValue(DARK_ROOT, "--tc-bg");
  // surface-overlay #313131 is the lightest dark surface a control lands on;
  // clearing it is the binding constraint (clearing it implies clearing the
  // darker page bg is easier, but we assert both explicitly).
  const DARK_SURFACE_OVERLAY = extractCssHexValue(
    DARK_ROOT,
    "--tc-surface-overlay",
  );
  const LIGHT_BORDER_INTERACTIVE = extractCssHexValue(
    lightNeutralBlock,
    "--tc-border-interactive",
  );

  it("all five dark theme blocks declare --tc-border-interactive", () => {
    for (const slug of themeSlugs) {
      expect(
        extractDarkThemeBlock(slug),
        `${slug} dark block missing --tc-border-interactive`,
      ).toContain("--tc-border-interactive");
    }
  });

  it("light shared block declares --tc-border-interactive", () => {
    expect(lightNeutralBlock).toContain("--tc-border-interactive");
  });

  it("dark interactive border clears 3:1 against page bg AND surface-overlay", () => {
    expect(
      contrastRatio(DARK_BORDER_INTERACTIVE, DARK_BG),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(DARK_BORDER_INTERACTIVE, DARK_SURFACE_OVERLAY),
    ).toBeGreaterThanOrEqual(3);
  });

  it("light interactive border clears 3:1 against white surface AND page bg", () => {
    expect(
      contrastRatio(LIGHT_BORDER_INTERACTIVE, LIGHT_SURFACE),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(LIGHT_BORDER_INTERACTIVE, LIGHT_BG),
    ).toBeGreaterThanOrEqual(3);
  });
});
