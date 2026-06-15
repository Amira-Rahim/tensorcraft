import type { GlossaryEntry } from "./glossary";

export interface GlossaryMatch {
  term: string; // canonical term
  start: number; // index in text
  end: number; // exclusive
  entry: GlossaryEntry;
}

interface Surface {
  surface: string;
  entry: GlossaryEntry;
}

function surfaces(dict: GlossaryEntry[]): Surface[] {
  const out: Surface[] = [];
  for (const entry of dict) {
    out.push({ surface: entry.term, entry });
    for (const a of entry.aliases ?? []) out.push({ surface: a, entry });
  }
  // Longest surface first so "gradient descent" wins over "gradient".
  return out.sort((a, b) => b.surface.length - a.surface.length);
}

const WORD = /[A-Za-z0-9]/;
function isBoundary(text: string, i: number): boolean {
  return i < 0 || i >= text.length || !WORD.test(text[i]!);
}

/** All non-overlapping whole-word matches, left to right. */
export function matchGlossaryTerms(
  text: string,
  dict: GlossaryEntry[],
): GlossaryMatch[] {
  const surf = surfaces(dict);
  const lower = text.toLowerCase();
  const matches: GlossaryMatch[] = [];
  const taken: boolean[] = new Array(text.length).fill(false);
  for (const { surface, entry } of surf) {
    const needle = surface.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      const end = idx + needle.length;
      const boundaryOk = isBoundary(text, idx - 1) && isBoundary(text, end);
      let overlaps = false;
      for (let i = idx; i < end; i++)
        if (taken[i]) {
          overlaps = true;
          break;
        }
      if (boundaryOk && !overlaps) {
        for (let i = idx; i < end; i++) taken[i] = true;
        matches.push({ term: entry.term, start: idx, end, entry });
      }
      from = idx + 1;
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

/** Unique canonical entries that appear at least once in text. */
export function findGlossaryTermsInText(
  text: string,
  dict: GlossaryEntry[],
): GlossaryEntry[] {
  const seen = new Map<string, GlossaryEntry>();
  for (const m of matchGlossaryTerms(text, dict)) {
    if (!seen.has(m.term)) seen.set(m.term, m.entry);
  }
  return [...seen.values()];
}
