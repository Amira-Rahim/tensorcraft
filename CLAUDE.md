# Tensorcraft: Claude Code Instructions

## Em Dash Ban (repo-wide, no exceptions)

- **NEVER use the em dash character (U+2014), anywhere** (owner
  directive, 2026-08-15). This is broader than the prose rubric: it
  covers every file and surface in the project. Prose, code, comments,
  tests, internal docs, commit messages, config, generated output, and
  Claude's own responses. Rewrite around it with a comma, colon, period,
  or parentheses. Code that must detect or strip the character (lint
  gates, text normalization) references it via the escape `\u2014`,
  never the literal glyph. The zero-hit state is CI-enforced repo-wide by
  `packages/content/__tests__/em-dash-ban.test.ts` (swept 2026-08-15,
  3,692 removed).

## Left Accent Bar Ban (UI, repo-wide)

- **Never put a colored left accent bar on any UI element** (owner
  directive, 2026-08-16). The pattern (border-left / border-l-\* in an
  accent color on callouts, blockquotes, stat lines, hint panels, or
  active states) is a signature of AI-generated design. Banned on every
  surface: components, MDX callouts, prose CSS, emails. Mark emphasis or
  state with a background wash, text color, or weight instead. Neutral
  full-height hairline dividers between layout panes (border-border) are
  structure, not accent bars, and stay. Swept to zero 2026-08-16.

## Writing Rules

- **All prose is held to `docs/writing-quality-rubric.md`** (owner
  directive, 2026-08-12). Before writing or editing ANY user-visible text
  (lessons, exercise instructions, module descriptions, glossary, UI copy,
  emails, blog, marketing), read that rubric and follow it. No AI-slop
  vocabulary, no inflated contrast or slogan cadence, no overloaded
  sentences, no em dashes. Character dialogue additionally follows
  `docs/story-style-bible.md`. The lexicon tier is CI-enforced by
  `packages/content/__tests__/slop-lexicon.test.ts`.

## Git Rules

- **Never commit on behalf of the user.** Do not run `git add`, `git commit`, or `git push` unless explicitly asked. After writing or editing code, stop and let the user decide when to commit.
