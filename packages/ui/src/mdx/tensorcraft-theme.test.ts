import { describe, it, expect } from "vitest";
import { tensorcraftTheme } from "./tensorcraft-theme";

/**
 * Syntax-token contrast gate (audit run #6, 2026-07-15).
 *
 * The comment token shipped at #6A7A6A on the #161616 code background: 3.96:1,
 * under the 4.5:1 WCAG AA floor for body text. Every code comment in all 77
 * lessons failed, on a product whose design system claims WCAG 2.1 AA.
 *
 * The e2e axe suite should have caught it and didn't, because it only ever
 * loaded lesson step 0 - which has no code block. That hole is closed in
 * e2e/accessibility.spec.ts, but an e2e run needs a dev server and a browser;
 * this unit gate is pure arithmetic on the palette, so it runs everywhere and
 * fails in milliseconds the moment a token regresses.
 *
 * Contrast math is WCAG 2.x relative luminance (w3.org/TR/WCAG21/#dfn-relative-luminance).
 */

const AA_BODY_TEXT = 4.5;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) =>
    channel(parseInt(hex.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tensorcraft shiki theme", () => {
  const background = tensorcraftTheme.colors["editor.background"];

  it("declares an opaque 6-digit background to measure against", () => {
    expect(background).toMatch(/^#[0-9a-f]{6}$/i);
  });

  const tokens = tensorcraftTheme.tokenColors
    .filter((token) => token.settings?.foreground)
    .map((token) => ({
      scope: Array.isArray(token.scope) ? token.scope.join(", ") : token.scope,
      foreground: token.settings.foreground as string,
    }));

  it("has token colors to check", () => {
    expect(tokens.length).toBeGreaterThan(10);
  });

  it.each(tokens)(
    "$scope meets WCAG AA against the code background",
    ({ scope, foreground }) => {
      const ratio = contrast(foreground, background);
      expect(
        Number(ratio.toFixed(2)),
        `${foreground} on ${background} is ${ratio.toFixed(
          2,
        )}:1 for scope [${scope}] - below the ${AA_BODY_TEXT}:1 AA floor for ` +
          `body text. Code tokens are body text: they are the lesson.`,
      ).toBeGreaterThanOrEqual(AA_BODY_TEXT);
    },
  );
});
