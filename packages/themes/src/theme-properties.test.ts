import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { themes, themeSlugs } from "./index";

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

  it.each([...themeSlugs])(
    "theme '%s' has a [data-theme] selector in CSS",
    (slug) => {
      expect(cssContent).toContain(`data-theme="${slug}"`);
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' defines all 9 required --tc-* properties",
    (slug) => {
      // Extract the CSS block for this theme
      const selectorPattern =
        slug === "deep-orbit"
          ? /(:root,\s*\[data-theme="deep-orbit"\])\s*\{([^}]+)\}/s
          : new RegExp(`\\[data-theme="${slug}"\\]\\s*\\{([^}]+)\\}`, "s");

      const match = cssContent.match(selectorPattern);
      expect(match).not.toBeNull();

      // The CSS block content is in the last capture group
      const block = match![match!.length - 1];
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

describe("Theme manifest/CSS consistency", () => {
  // Hex values are compared case-insensitively, manifests use uppercase
  // (#6BAA8A) while CSS uses lowercase (#6baa8a). Both are valid CSS.
  const cssContentLower = cssContent.toLowerCase();

  it.each([...themeSlugs])(
    "theme '%s' palette.primary matches CSS --tc-primary",
    (slug) => {
      const theme = themes[slug];
      expect(cssContentLower).toContain(
        `--tc-primary: ${theme.palette.primary.toLowerCase()}`,
      );
    },
  );

  it.each([...themeSlugs])(
    "theme '%s' palette.accent matches CSS --tc-accent",
    (slug) => {
      const theme = themes[slug];
      expect(cssContentLower).toContain(
        `--tc-accent: ${theme.palette.accent.toLowerCase()}`,
      );
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
