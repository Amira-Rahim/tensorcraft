# Writing Quality Rubric (binding, 2026-08-12)

Owner directive: ALL prose added to this repo, now and in the future, is held
to this rubric. That covers lesson MDX (body, frontmatter narratives, hints,
takeaway/objective arrays, quiz text, code-block comments learners can see),
exercise `title`/`instructions`, module.yaml descriptions, glossary
definitions, world/character metadata, web UI copy, emails, blog posts, and
launch/marketing copy. A reader must never feel they are reading AI output:
no AI vocabulary, no manufactured rhythm, no overloaded sentences. The
language is easy to read and easy to relate to.

The four failure modes below follow the professional-writing screener the
owner supplied (2026-08-12). When editing, name the category you are fixing;
if you cannot name one, do not edit.

## 1. Formulaic, slogan-like, or figurative language

Flag when a claim is packaged as a stock formula, slogan, staged cadence,
canned emotional phrase, or strained metaphor instead of clear analysis.

- Inflated contrast: "The checklist is not just a tracker, it is the gateway
  to a more reliable release." Say what the thing does: "The checklist shows
  which requirements are complete."
- Stock formulas and rhetorical triads: "faster, smarter, and more
  intuitive"; "This tool not only saves time but also transforms how teams
  collaborate."
- Slogan fragments: "One team. One vision. Limitless possibilities.";
  "It's not X, it's Y."; repeated negative parallelism ("Not X, but Y";
  "no X, no Y, just Z").
- Manufactured rhythm and punctuation: semicolon parallelism for cadence
  ("Owners are set; risks are checked; approval is granted"), colon-heavy
  staccato, overlong parallel enumerations of abstract nouns, em dashes
  (banned repo-wide, style bible rule 6).
- Artificial tone: canned empathy ("I completely understand how frustrating
  this must feel"), synthetic balance without a real tradeoff, promotional
  or travel-guide adjectives (vibrant, rich, renowned, groundbreaking,
  nestled), canned endings (generic challenges/legacy/future-outlook
  closers that do not arise from the content).
- Vague authorities and synthetic consensus: "Experts note", "observers
  say", "research consistently shows" with no named source. Name the source
  or state what you can actually observe.
- AI-associated vocabulary. Words a working JavaScript dev would not say out
  loud, in their non-literal senses: delve, tapestry, testament, pivotal,
  foster, underscore (verb), showcase, intricate, vibrant, realm, beacon,
  embark, elevate, empower, harness, unleash, paradigm, synergy, holistic,
  seamless, leverage (verb), journey (non-literal), landscape (non-literal),
  essence, cutting-edge, game-changer, revolutionize, and filler intensifiers
  (powerful, rich, comprehensive, robust, crucial, invaluable) used without
  concrete meaning. Technical senses stay: adversarial robustness, a literal
  loss landscape, a literal journey.
- Mechanical bold-label bullet lists ("**Label:** explanation" repeated)
  when the structure is not needed.

## 2. Vague, inflated, or unsupported substance

Flag when the reader cannot tell what changed, why the benefit follows,
what evidence supports the claim, or what reason drove the decision.

- Empty abstraction: "unlocks value, fosters alignment, and drives
  meaningful impact". Name the concrete result or delete.
- Tacked-on benefit tails: "...ensuring a seamless user experience". Keep
  the fact, cut the tail.
- Inflated significance: "This represents a profound shift."
- Meaning obscured by shorthand: "resets the bar higher", "doing the heavy
  lifting" where the literal statement exists.
- Reasoning lost or replaced by process narration: "After extensive review,
  we aligned on delaying" instead of "We delayed until Legal approved the
  exception."

Do not flag claims backed by a concrete result, source, constraint, or
requirement.

## 3. Wordy, jargon-filled, or indirect language

Flag when the sentence can be shorter and clearer without losing meaning or
a real qualification.

- Overloaded sentences: anything a reader must read twice. Signals: 30+
  words with three or more stacked clauses, the main point buried in a
  subordinate clause, "which/that" chains gluing two ideas. Fix: split,
  main point first.
- Bureaucratic, hedged, verbose: "At this point in time, it may be
  advisable for the team to commence the process of reviewing the draft"
  is "The team should review the draft."
- Compressed or indirect meaning: "Events remain anchored to dual capacity
  constraints" is "Events are limited by both a headcount cap and a
  room-capacity percentage."
- Unexplained jargon: every term of art is explained at first use in the
  lesson, lives in the glossary (`packages/content/src/glossary.ts`), or is
  replaced. Core JavaScript the audience knows needs no gloss; a
  browser-only or Node-only API used as an analogy gets a one-clause gloss,
  since the audience spans both runtimes; ML terms being taught are defined
  by the lesson.

Accurate technical terms, legal conditions, and explained uncertainty are
not flagged.

## 4. Unnecessary framing, repetition, or structure

Flag when setup, repetition, or formatting delays the point.

- Generic scene-setting: "In today's fast-paced digital landscape...",
  "Before getting started, it is important to understand..."
- Restating the request or meta-announcing ("Below is a comprehensive
  overview...").
- Redundant conclusions ("In conclusion, ..."); lesson bodies never end by
  restating takeaways (style bible rule 7).
- Excessive structure: a two-sentence answer split across headings and
  bullets.

Framing that narrows scope, corrects an error, or helps readers navigate
reference material is fine.

## Construction rules (binding, 2026-10-19)

Review the construction itself, wherever it appears. These owner directives
supersede older exemptions for factual contrasts and character dialogue.

- Flag every prose semicolon, em dash, decorative vertical bar, textual arrow,
  inline bullet, and decorative dot separator. Use sentences, descriptive
  labels, or an ordinary list. Keep valid code syntax, including statement
  semicolons, arrow functions, and API dot notation such as `model.fit()`.
  The owner explicitly clarified that the dot ban concerns decorative
  separators. Preserve required mathematical meaning when spelling out a
  formula. Do not alter operators or remove a condition to satisfy a prose rule.
- Rewrite every "It's not X, it's Y", "Do Y, not X", and equivalent staged
  contrast. Preserve both facts when the distinction matters. Explain each
  directly, including the limitation or reason.
- Use active voice. Name the character, learner, model, runtime, or process
  that performs the action. Avoid inventing an actor when the source does not
  establish one. Describe the observed result directly in that case.
- Use descriptive titles and section headings. Command headings fail this
  rule even when the command sounds useful. Buttons and instructions may use
  action verbs to describe the action the learner can take.
- Remove slogan-like phrasing, buzzword-led claims, manufactured triads, and
  polished abstractions that say little. State what happens and explain why a
  claimed benefit follows. A concrete list of three necessary items is fine.

Apply these rules to prose, titles, metadata, captions, dialogue, activity
feedback, exercise instructions, and learner-visible code comments. Preserve
technical accuracy, exercise contracts, meaningful warnings, and story
continuity. Character registers still apply within these constraints.

The following examples show the required direction:

- "The proposal was approved by the team" becomes "The team approved the proposal."
- "The launch was delayed" becomes "The team delayed the launch" when the
  source establishes that the team made the decision.
- A command heading such as "Define the integration perimeter" becomes
  "Integration scope."
- "Usage-based models turn customer activity into a direct revenue expansion
  path" becomes "Customers pay more when they use more of the service" if that
  accurately describes the pricing model.

Code, data identifiers, source quotations, and functional diagram connections
need contextual review. Never run punctuation replacement across executable
code or silently change a quotation. The repo-wide literal em dash ban still
applies everywhere.

## Two questions for every copy review (binding, 2026-10-19)

Ask both questions of each passage, label, hint, and feedback message:

1. **Would a person naturally phrase it this way?** Rewrite awkward phrasing
   in context, using the voice of the speaker and the reader’s knowledge.
2. **Does it have words that don’t convey anything meaningful?** Remove filler,
   empty slogans, redundant framing, and vague benefits. Name the action,
   result, or limitation instead.

Apply these checks to all mission sections and promotional pages, including
shared components and metadata. Preserve technical meaning, exercise
requirements, story continuity, and useful character detail. Concision must
not remove an explanation the learner needs.

## The relatability bar

House voice: a peer explaining something at a whiteboard. Second person,
active voice, concrete JS anchors, one idea per sentence. If a senior
JavaScript dev would not say the sentence out loud, rewrite it. Do not fake
chattiness ("Let's dive in!", "Great question!"); that is its own slop.

## Enforcement

- `packages/content/__tests__/slop-lexicon.test.ts` mechanically gates the
  high-precision tier (banned lexicon, em dashes, vague-authority and
  canned-framing patterns) across lesson MDX, module.yaml descriptions, and
  exercise prose. Judgment-tier violations (contrast formulas, overloaded
  sentences) are caught in review against this document.
- `CLAUDE.md` binds agent sessions to this rubric for all future content.
- Audit precedent and worked examples: `docs/audits/ai-slop-audit-2026-08-12.md`.

## House vocabulary (2026-08 rebrand, binding)

The learning audience is frontend developers learning ML through JavaScript
(owner directive, 2026-10-16). Keep explanations simple, casual, practical, and
connected to familiar frontend work. Preserve technical meaning and exercise
requirements. The established brand and search terms below still apply to
published copy; the audience instruction does not request a marketing rebrand.

Treat readers as capable JavaScript engineers who are new to ML, not new to
programming. Captions should identify the crew's data, the comparison, or the
decision at hand instead of describing an obvious visual format. Introduce new
ML concepts clearly, but avoid repeated explanations of ordinary arrays,
indexes, variables, and controls. Keep reminders when they prevent a specific
mistake. Simple wording must not become patronizing wording.

- Brand register (all human-read prose, legal, emails, lessons, story,
  certificates): "JavaScript engineer(s)". Second person: "You're a
  JavaScript engineer."
- Query register (title tags, meta descriptions, keywords, schema.org
  audience fields): "JavaScript developers". This is the search-side noun;
  the GSC winning cluster is "javascript machine learning".
- Tight UI labels and code comments: "JS" ("JS devs", "55 JS Bridges",
  "// JS:", "// Browser:", "// Node:").
- Never "web developers", "full-stack", or "coders". Never mix "engineer"
  and "developer" in one sentence.
- Bridge feature name: "JS-to-ML bridges" in tight copy,
  "JavaScript-to-ML bridges" in formal copy. The bridge callout column
  label is "JavaScript" (opposite "Machine Learning").
- Skill-genome axis display label: "JS Integration".
- Maker identity (owner decision 2026-08-18): "a group of JavaScript
  engineers". Collective voice, no personal names, unchanged otherwise.
- "Frontend" may describe the learning audience in project guidance and the
  client layer in technical explanations. Keep the established brand register
  above for published identity copy.
- Analogy anchors may be browser or Node, whichever carries the mechanism
  better; a browser-only or Node-only API used as an anchor gets a
  one-clause gloss (see rule 3).
