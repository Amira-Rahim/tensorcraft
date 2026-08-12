# Tensorcraft — Claude Code Instructions

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
