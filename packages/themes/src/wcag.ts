/**
 * WCAG 2.x color-contrast helpers.
 *
 * Formulas per the W3C WCAG 2.1 spec:
 * - Relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * - Contrast ratio:     https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * Pure and dependency-free so both packages/themes (theme CSS/manifest
 * consistency tests) and packages/ui (runtime light/dark contrast checks)
 * can share one implementation instead of forking a copy.
 */

/**
 * Parses a 6-digit hex color (with or without a leading "#") into an
 * [r, g, b] triplet, each channel 0-255.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Formats a hex color as the "r, g, b" decimal triplet text used by the
 * --tc-*-rgb CSS custom properties (e.g. "107, 170, 138"). Used to verify
 * those hand-maintained triplets stay numerically in sync with the hex
 * color they're derived from.
 */
export function hexToRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Converts one 8-bit sRGB channel (0-255) to its linear-light value, per
 * the WCAG relative luminance formula.
 */
export function srgbChannelToLinear(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a hex color, in the range [0, 1]. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (
    0.2126 * srgbChannelToLinear(r) +
    0.7152 * srgbChannelToLinear(g) +
    0.0722 * srgbChannelToLinear(b)
  );
}

/** WCAG contrast ratio between two colors, in the range [1, 21]. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}
