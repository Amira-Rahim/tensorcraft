# Deep Orbit and promotional copy construction audit

Date: 2026-10-19

This pass follows the earlier [natural phrasing audit](natural-phrasing-2026-10-19.md) and applies the owner's stricter construction rules. It reviews how each sentence conveys its meaning, including dialogue, feedback, headings, and promotional claims.

## Rules and editorial decisions

The review asks whether a person would naturally use the wording and whether every phrase contributes meaning. It also checks punctuation, staged contrasts, passive voice, command headings, and slogan-like claims.

- Prose uses active voice and names the actor when the source establishes one.
- Headings describe their content. Buttons and exercise instructions retain useful action verbs.
- Claims name the action, result, or limitation. Empty benefits and manufactured lists of abstract qualities have no place in the copy.
- Sentences state distinctions directly. They preserve useful qualifications without the repeated “not X, but Y” construction.
- Display copy no longer uses decorative dot separators, bars, arrows, inline bullets, or prose semicolons.
- Valid JavaScript syntax stays intact, including API dots, arrow functions, and statement semicolons. Mathematical expressions retain their meaning. Diagram connections retain their functional role.

The [writing rubric](../writing-quality-rubric.md#construction-rules-binding-2026-10-19), [story style bible](../story-style-bible.md), and [CLAUDE.md](../../CLAUDE.md#writing-rules) now carry these requirements for future work. Character voice follows the same construction rules.

## Source coverage

The source review covered every briefing, concept, challenge, takeaway, and epilogue in all 56 Deep Orbit missions. It included nested references, dialogue, recall questions, hints, all 65 exercises, learner-facing feedback, result labels, and visible code comments.

Every mission file and exercise file received edits in this pass. The table counts files, not individual wording changes.

| Module | Mission files | Exercise files |
| --- | ---: | ---: |
| Foundations | 5 | 5 |
| Neural networks | 5 | 5 |
| Training loop | 5 | 5 |
| Browser runtimes | 6 | 7 |
| Signal processing | 5 | 5 |
| Recurrent networks | 5 | 5 |
| Anomaly detection | 5 | 8 |
| Advanced time-series | 5 | 5 |
| LLM integration | 5 | 6 |
| Optimization and edge | 5 | 6 |
| Capstone | 5 | 8 |
| Total | 56 | 65 |

Shared coverage includes interactive lesson components, numeric and flow investigations, handoffs, glossary entries, JavaScript-to-ML comparisons, lesson navigation, and shared MDX presentation.

Promotional coverage includes the homepage, Learn, About, Compare, Pricing, paywall, worlds listing, course introductions, course cards, FAQs, blog index, shared navigation, and relevant metadata. Descriptions of planned worlds received the same review where they appear in promotions. Full technical blog articles, legal documents, account screens, and unreleased worlds' lesson bodies remain outside this audit.

## Examples

| Previous wording | Current wording | Purpose |
| --- | --- | --- |
| “Stories That Take You From JavaScript to ML.” | “Machine learning for JavaScript engineers.” | Names the subject and audience. The supporting sentence introduces the crew's task. |
| “Buy once. Keep forever.” | “Course pricing” | Uses a descriptive heading. The paragraph explains lifetime access and updates. |
| “Discover Tensorcraft” | “About the course” | Describes the link's destination. |
| “Add ML to your toolkit.” | “The free first module” | Names the content of the section. |
| “Group the readings by time” | “One row per moment” | Describes the first activity stage. |
| “Give the chart one row per sensor” | “One row per sensor” | Describes the second activity stage. |
| “Saved in this tab.” | “This tab saves your work, including when you refresh the page.” | Names what saves the work and explains persistence. |

The homepage retains the course's story in its supporting copy: “Help the crew of the Archimedes investigate a signal. You’ll build and train the models in JavaScript, then run them in your browser.”

## Technical and story checks

The review preserved story order, visible scenes, character roles, the ongoing recording, required exercise outputs, supplied values, thresholds, and grading behavior. The shared lesson layout and interaction structure remain in place. The homepage type scale and responsive breakpoint received small adjustments to accommodate its new heading and supporting copy.

A syntax-tree comparison against this pass's starting state checked all 65 exercises and 136 executable lesson code blocks. It found no changes to exercise logic or lesson example execution. The exercise comparison separately recorded 305 changed string literals for feedback review. Those text changes retain requirements and failure conditions.

One flow activity's display and example initially disagreed after the punctuation edit. Both now use the same alert wording. Conditional probability notation and an absolute-difference formula retain their mathematical meaning. The review also kept tensor ownership requirements, model architecture, shape and value checks, training-result provenance, and distinctions between observed results and illustrative examples.

Tests that assert exact visible text now expect the new wording. Behavioral expectations and acceptance thresholds remain intact.

## Executed validation

Node version: 22.23.2.

- Content build passed.
- Typecheck passed all 10 tasks.
- All 65 exercise validators passed, with no failures or warnings. Reference solutions passed. The validator rejected untouched starters and supplied incorrect implementations.
- Syntax-tree comparison found no exercise logic changes and no executable changes in the 136 lesson code blocks.
- The final scoped punctuation scan found no remaining prose passages to change. Code syntax and functional diagram connections retain their meaning.
- Prettier formatted changed TypeScript and project guidance.

The final full Vitest run passed 311 test files and 3,637 tests. One file and 65 tests remain skipped by the existing suite configuration. `git diff --check` passed with the completed report.

## Browser verification

Browser checks covered representative surfaces independently from the source review:

- Homepage at desktop width and 390 by 844 pixels. The heading, story introduction, and calls to action fit and remain readable.
- Tensor Shapes concept. The full-width scene, recording context, descriptive activity headings, and code explanation remain visible.
- An incorrect second-row prediction, `0, 0, 0, 0`, shows corrective feedback and the table.
- The correct prediction, `3, 18, 7, 8`, shows “Correct!” and identifies those values as the four sensors' readings at Time 2.

The browser checks did not render every section manually. Source review covered all mission sections. Runtime tests establish the exercised contracts, not a universal proof of prose quality or every scientific statement. The temporary mobile viewport override was reset.

Preview: http://localhost:3000

Screenshots:

- `.superpowers/construction-home-desktop.png`
- `.superpowers/construction-home-mobile.png`
- `.superpowers/construction-concept-feedback.png`

All changes remain local. This work did not commit or deploy them.
