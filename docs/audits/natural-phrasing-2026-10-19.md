# Deep Orbit and promotional copy audit

Date: 2026-10-19

The review used both questions requested by the owner:

1. **Would a person naturally phrase it this way?**
2. **Does it have words that don’t convey anything meaningful?**

Both questions are now binding in [the writing rubric](../writing-quality-rubric.md#two-questions-for-every-copy-review-binding-2026-10-19), which CLAUDE.md already requires for all user-visible prose.

## Editorial decisions

Each passage was assessed in context. Clear, useful wording stayed. Awkward sentences were rewritten; empty framing was removed or replaced with the action, result, or limitation it obscured. Character detail and useful scientific qualifications were retained. This is an editorial assessment, not an automated naturalness score.

The main problems were compressed engineering language in teaching prose, elaborate metaphors in exercise feedback, vague promotional benefits, and repeated explanations that added no new information. Some feedback also described what a test was designed to catch instead of telling the learner what to fix.

Examples:

| Before | After | Reason |
| --- | --- | --- |
| “The first twenty survivors travel, in database order.” | “Return the first 20 matching records in database order.” | Names the data and action directly. |
| “The first layer is priced by the eight features Farah specced.” | “Check all layer widths and use eight input features for the first layer.” | Explains what affects the parameter count. |
| “The blend of a window nobody published.” | “These predictions change between runs.” | Replaces a cryptic warning with relevant context. |
| “Averaging a perfect member with two weak ones spoils it. An ensemble is not free.” | “One model is exactly right here. Averaging it with two incorrect predictions increases the error.” | States the consequence instead of adding a slogan. |
| “The bridges aren’t marketing. They’re the curriculum.” | “Each comparison explains how far it holds.” | Explains what the learner receives. |
| “What you take to interviews is the ability to explain every layer of what you built.” | “Your saved work gives you code to revisit, explain, and share.” | Replaces an implied outcome with a concrete benefit. |

## Source coverage

Reviewed all 56 missions across all 11 modules: briefing, concept, challenge, takeaways, epilogue, nested references, hints, recall questions, and secondary exercise text. Reviewed all 65 exercises, including learner-facing assertion messages, visible result summaries, and starter and solution comments.

| Module | Missions reviewed | Mission files edited | Exercises reviewed | Exercise files edited |
| --- | ---: | ---: | ---: | ---: |
| Foundations | 5 | 4 | 5 | 2 |
| Neural networks | 5 | 5 | 5 | 3 |
| Training loop | 5 | 5 | 5 | 3 |
| Browser runtimes | 6 | 6 | 7 | 4 |
| Signal processing | 5 | 5 | 5 | 3 |
| Recurrent networks | 5 | 5 | 5 | 4 |
| Anomaly detection | 5 | 5 | 8 | 4 |
| Advanced time-series | 5 | 5 | 5 | 5 |
| LLM integration | 5 | 4 | 6 | 3 |
| Optimization and edge | 5 | 4 | 6 | 6 |
| Capstone | 5 | 5 | 8 | 7 |
| **Total** | **56** | **53** | **65** | **44** |

Shared teaching surfaces reviewed include visual activity descriptions, numeric and flow investigations, prediction feedback, lesson handoffs, learning goals, project instructions, glossary definitions, module entry context, warmups, recaps, lesson terms, navigation, and Deep Orbit bridge explanations.

Promotional coverage includes the homepage and its shared sections, FAQ, Learn, About, Compare, Pricing, paywall, worlds listing, world and module introductions, course previews, world cards, waitlist copy, page descriptions, and structured metadata. World descriptions for the four planned worlds were included where displayed as promotions. The blog index was included; full technical blog articles, legal documents, account screens, and unreleased worlds’ lesson bodies were outside this copy audit.

## Technical and story preservation

Exercise data, required return fields, formulas, assertion values, thresholds, and execution paths were preserved. Syntax-tree comparisons of changed exercise code found only comments, visible labels, and feedback changes. Remaining comparison differences were inspected individually: concatenated error messages and local feedback strings, including two shortened string concatenations.

The existing story sequence, character voices, visible scenes, shared layouts, and interactions remain in place. Technical language was simplified without removing distinctions such as prediction versus observation, score versus calibrated probability, validation versus deployment, and illustrative data versus ship measurements.

Two feedback explanations were made more precise while keeping their calculations unchanged: a normalized zero input produces `sigmoid(bias)` in the supplied sigmoid neuron, and uint8 quantization requires rounding scaled values to integer codes.

Exact-text tests were updated only where expected copy changed. Functional expectations, exercise checks, and acceptance thresholds were retained.

## Executed checks

Run using the project’s Node 22.23.2 installation:

- Content build: passed.
- Typecheck: all 10 tasks passed.
- Full Vitest suite: 311 test files passed, 1 skipped; 3,637 tests passed, 65 skipped.
- Exercise validation: all 65 passed, 0 failed, 0 warnings. Reference solutions passed, untouched starters failed, and the supplied incorrect implementations were rejected.
- Starter dictation report: no exercises flagged.
- Prettier applied to changed TypeScript and Markdown files.
- `git diff --check`: passed before the final report was added; checked again with the completed report.

These checks confirm the exercised contracts. They are not a claim that automated tests can establish natural language quality or every scientific claim in the course.

## Browser checks

Checked the local site separately from source review:

- Homepage at desktop width and 390 × 844: revised introduction and calls to action remain readable.
- About at desktop width: revised explanation and analogy limits render correctly.
- Introduction to Tensors briefing at mobile width: story, dialogue, task, and recording context remain visible.
- Basic Tensor Operations concept at mobile width: revised prose and activity labels render. Entering `999` as a prediction produces “Incorrect prediction” and the actual result `8`, with the calculation `(4 + 4) ÷ 2 × 2 = 8`.
- Ensemble Methods challenge at desktop width: story context, exercise instructions, weighting rule, and limitations render together.
- WebGPU Acceleration epilogue at desktop width: the rehearsal, recorded costs, and next mission handoff remain intact.

Browser coverage was representative, not a manual rendering of every section. All mission sections received source review. Temporary viewport overrides were reset.

Local screenshots are saved under `.superpowers/` as `natural-copy-home.png`, `natural-copy-about.png`, and `natural-copy-mobile-activity.png`. The local preview remains available at `http://localhost:3000`. These edits have not been committed or deployed.
