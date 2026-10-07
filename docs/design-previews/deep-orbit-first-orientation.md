# Make the opening understandable before the first ML concept

October 7, 2026. The owner's first-learner review found that the opening
establishes a mystery without explaining the course, the learner's role or
the purpose of the first task.

## Design before implementation

Keep the existing visual identity: hull #181818, console #232323, text
#e0e0e0, sage #6baa8a, brass #c1a678. Use the existing light-theme tokens.
Inter remains the reading face; the mission title, scene art and character
portraits retain their hierarchy. The orientation uses ordinary body text,
left aligned, with a readable line length.

```text
Existing mission title
Course outcome in plain language, visible immediately

Original scene artwork          Crew problem in plain language
Who the crew and ARIA are       Your role and one first task

Existing Continue action -> inspect five readings -> write code
```

The course teaches machine learning in JavaScript. The learner will train
models on examples, evaluate them on new data and run them in the browser.
The first task prepares numeric inputs; it does not train a model yet.

Replace the jargon-heavy briefing paragraph. Explain tensor and TensorFlow.js
on first use, anchor the task in a familiar JavaScript array, and say what
Continue opens. Keep disposal, shape and rank teaching in Concept. Clarify
the rule-based system's limitation through the existing three dialogue beats.
Introduce Demir's role through narrator copy, preserving the canon that the
cast does not address the learner directly before the finale.

## Review against the brief

A new onboarding screen or a second progress diagram would add navigation
before the learner understands the task. The existing scene remains the main
visual; its text now explains the learning purpose. Only the first Deep Orbit
Briefing receives course orientation. Later scenes keep their own pacing.

Writing categories addressed: unexplained jargon, vague purpose and repeated
setup without a concrete next action. Preserve plot facts, original art,
exercise contracts and the larger headers requested by the owner.

## Verification

Check immediate orientation visibility, playback and skip behavior, the
transition into the same five-reading Concept, phone wrapping and access to
Continue. The first lesson must remain readable without JavaScript. Record
browser captures and executed checks after implementation.

## Implemented and reviewed

The first Briefing now states the ML course outcome beneath the existing
title, defines a model in plain language, and connects training to evaluation
and browser use. This orientation is visible during playback and without
JavaScript. The scene identifies ARIA's preset rules and the crew's need to
learn from examples. Its handoff introduces Demir's role, defines tensor and
TensorFlow.js, and names the five-reading task and what Continue opens.

The visual review retained the large title, original art and three dialogue
beats. A phone line-break problem around the first glossary term was corrected
by rewriting the definition as a complete sentence.

- [Desktop Briefing](deep-orbit-first-orientation/briefing-1440-dark.png)
- [Phone Briefing](deep-orbit-first-orientation/briefing-390-dark.png)
- [320px light Briefing](deep-orbit-first-orientation/briefing-320-light.png)

Content build, web TypeScript checks, 102 unit/content checks and ten browser
cases pass. Browser coverage includes the three viewport/theme combinations,
axe scans, playback, skip, no-JavaScript reading, the transition into the same
five-reading Concept and the existing challenge gate. After the final copy
refinement, the seven affected continuity/snapshot cases pass again.

This implements the opening clarification locally. It does not represent an
all-lesson editorial audit or a video rollout.

## Format direction after the owner's review

Clarity applies to every lesson regardless of format. Each opening should
establish the crew's problem, the learner's action, the ML capability being
developed and the evidence that will show progress. Essential orientation
must remain understandable without watching a video.

Use a short clip when it can establish the world, demonstrate a relevant
change over time or make a story consequence visible. Use interactive visuals
when manipulating values is how the learner understands the mechanism.
An illustrated scene remains appropriate when the problem is clear without
motion. Video duration follows the task; a short production target is not a
research-established optimum. A clip should replace equivalent scene delivery,
with an accessible text alternative, rather than add a second required pass.

The evidence supports concise, goal-focused videos connected to active work;
it does not establish that cinematic introductions outperform the current
format for this audience. [Brame, 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5132380/).
