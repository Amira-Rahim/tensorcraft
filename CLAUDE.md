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
