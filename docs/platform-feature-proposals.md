# Tensorcraft platform feature proposals

Prepared November 3, 2026. Exploratory product strategy and feature inventory.

These are suggestions for extending the [product roadmap](../ROADMAP.md).
They are not implementation commitments, approved story changes, or a growth
forecast. Existing learner purchases, release decisions, and story canon remain
in force. Feature examples below describe proposed experiences.

## Product direction

Tensorcraft could become a place where JavaScript engineers join recurring
adventures, build working ML systems, form small crews, and see their work used
in later missions. Finishing a course would open new ways to participate:
investigator, builder, reviewer, mentor, competitor, and eventually author.

The strongest distinctive experience combines four things:

1. An authored story with characters whose decisions and relationships develop.
2. Actual executable work with results the learner can inspect and explain.
3. A small group of recognizable people with complementary contributions.
4. A persistent project that encounters new problems after its first success.

The proposed recurring experience is simple: encounter a problem, try something,
inspect the result, discuss it, make a decision, see its consequence, and return
when the next situation needs a new capability.

A learner should have several honest reasons to return: curiosity about the
story, interest in a character, a useful reply from another person, pride in an
artifact, and a problem they now feel ready to tackle. No single reason will
fit everyone. Solo learners should still receive a complete experience.

### What 200,000 means

The current growth strategy targets 200,000 cumulative unique paying customers.
The new ambition of 200,000 immersed learners describes a different outcome.
Keep account count, cumulative buyers, monthly learners, concurrent sessions,
and active community contributors separate.

A proposed learning-activity measure is the number of people who complete a
substantive build, explanation, evaluation, or reproducible review in a rolling
28-day period. Report it alongside independent learning evidence, voluntary
return, story interest, and belonging. Opening the app or maintaining a streak
alone does not establish immersion.

The practical first objective is a small experience that people choose to
repeat and that the team can afford to produce. Scaling that experience needs
distribution, content production, technical reliability, and community care.

## Evidence informing the ideas

The proposals are product hypotheses. Research and precedents help choose what
to test, but they do not establish Tensorcraft's future retention or scale.

- A motivational model of games uses autonomy, competence, and relatedness to
  explain engagement. It is a useful lens for meaningful choices, visible
  capability, and relationships. It does not establish that a particular
  Tensorcraft mechanic will improve learning. [Przybylski, Rigby, and Ryan](https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf)
- In a randomized interactive-fiction study with 228 participants, interactivity
  predicted character identification. The brief experience and self-report
  measures do not establish long-term attachment or course retention.
  [Felnhofer and colleagues](https://link.springer.com/article/10.1007/s12144-022-03048-4)
- Narrative-game experiments found learning benefits from instructional
  reflection integrated with play. This supports keeping explanation and
  transfer tasks inside the proposed missions. Story completion needs its own
  measure. [Pilegard and Mayer](https://escholarship.org/uc/item/64s5j71f)
- Exercism separates immediate automated feedback, queued human mentoring, and
  private feedback. Its documentation makes human response delays explicit.
  That is a useful operating precedent for layered review.
  [Exercism feedback documentation](https://exercism.org/docs/using/feedback)
- CodeCombat's AI League demonstrates code-driven competition as a product
  format. Tensorcraft would still need to test whether its audience prefers
  competition, cooperation, or private practice.
  [CodeCombat AI League guide](https://codecombat.zendesk.com/hc/en-us/articles/38487615890071-AI-League-Getting-Started-Guide)

## Eight features to test first

### 1. Recurring story seasons with complete endings

Publish short operations that continue beyond the foundational course. Each
operation has a concrete incident, several connected missions, a character
conflict, a useful artifact, and an ending. A later operation can build on the
same capabilities and relationships while introducing a fresh problem.

An initial experiment could contain three or four episodes. That is a proposed
scope for learning about production and demand, not a publishing promise.
Episodes should remain available after their premiere. Offer a clear way to
join late and understand the situation.

For example, a new relay station reports contradictory readings. One mission
establishes the data contract, another exposes misleading evaluation, and a
third tests a deployment constraint. The finale uses the learner's evidence to
explain an operational decision. A simple baseline can win when the evidence
supports it. A mission does not need neural networks merely because the course
teaches them.

The return reason is unfinished understanding and a developing story. A season
also needs satisfying local resolutions so the product earns trust rather than
ending every session with another withheld answer.

First test: one operation using existing runtime and art conventions. Observe
who chooses the next episode, what they remember, what they can do on a new
case, and the production effort required for each episode.

### 2. Small crews with rotating engineering responsibilities

Offer optional crews of roughly four to six people as an initial design
hypothesis. Match around readiness, preferred pace, language, and availability.
Give the crew a shared task with bounded individual contributions.

Possible roles include data investigator, builder, evaluator, and release
reviewer. Everyone first attempts a small independent problem. They then bring
their evidence into the shared workspace, discuss it, and complete a new
individual case. Rotate responsibilities across operations.

The connection comes from a specific exchange: someone uses your test case,
another person catches a faulty assumption, and a third explains why the team
changed its decision. This creates recognizable relationships around work.

Every mission must still progress when a teammate is absent. Offer reassignment,
solo continuation, or clearly labeled supplied artifacts. Let people pause or
leave without damaging their crew's progress. Avoid making the strongest coder
the only person who can produce a useful result.

First test: manually assemble a few asynchronous crews. Measure useful
exchanges, role participation, waiting time, independent understanding, and
whether people choose to work together again. Voluntary crew members and solo
learners are self-selected groups, so their raw retention difference would not
establish a causal effect.

### 3. Projects that survive the episode

Give a learner or crew a versioned project that remains useful after a mission.
It might be a diagnostic tool, preprocessing pipeline, evaluation harness, or
small deployed demonstration. Record what it does, where it fails, who helped,
and which evidence supports its current version.

A later incident introduces changed inputs, a tighter memory budget, a new
failure case, or a different cost of mistakes. Learners return to an artifact
they understand and discover why an earlier solution needs revision.

The emotional connection is partly ownership. The learner can point to a
working system and explain its history. A crew can remember the bug it found
and the person whose test exposed it.

This needs explicit compatibility between stages, versioned data contracts,
reproducible evaluation, and export/recovery. The current lesson pilot uses
different fixtures and models. A new persistent project must be designed as
such, without implying those existing lessons already share one trained model.

First test: one two-stage project with a genuinely new second-stage condition.
Observe whether learners reuse their earlier reasoning and can explain what
changed without starting from a supplied solution.

### 4. Character arcs built around shared work

Write relationships that develop through consequential events. Characters need
their own concerns, mistakes, loyalties, and interests beyond praising the
learner. Relevant reactions should reference something the learner actually did.

For a future Deep Orbit season, possible directions include:

- Nazari begins by supplying strict operating limits. Later she uses a
  learner's verified failure analysis in a decision. Her trust appears in
  changed responsibility and a specific acknowledgment.
- Farah has to revise a favored explanation after an experiment contradicts
  it. The learner sees intellectual honesty as part of competence.
- Demir becomes capable enough to explain a difficult step to someone else.
  His progress includes recognizable mistakes and earned improvement.
- Mirza presents competing operational priorities and asks for an evidence-based
  recommendation. A technically correct answer may still require discussing
  uncertainty and cost.
- ARIA's future role could explore the useful boundary between explicit rules
  and learned systems, through a separately approved arc.

The strongest moments can be small: an earlier test still running on a console,
a character revisiting an assumption, or a piece of work appearing in a later
decision. Repeated generic praise would make those moments less believable.

First test: one authored callback to a verified contribution in a new side
mission or season. Ask what the learner thinks changed between the characters
and why. Measure later voluntary return separately from immediate enjoyment.

### 5. Discussions attached to evidence

Attach conversation to a chart, code revision, failed case, prediction, or
evaluation run. Give a reviewer the context needed to reproduce the issue.
Useful prompts include: what did you expect, what changed your mind, and what
would you test next?

Keep separate spaces for hints, completed-solution discussion, and story
theories. Learners should make an initial attempt before entering a solution
debrief, with explicit choices about spoilers and assistance. Never count
reading a shared solution as an independent assessment pass.

This produces a valuable return event: someone has responded thoughtfully to
something you made. The response can also improve an artifact used by the crew.

First test: one moderated debrief beside a difficult exercise. Record whether
feedback changes the explanation or code, whether a fresh case is solved, and
how long a person waits for a useful reply. Provide an authored fallback if no
human response arrives.

### 6. An arena for practice, cooperation, and competition

Build three experiences with a shared challenge format:

| Mode                  | Core activity                                        | Reason to return                             |
| --------------------- | ---------------------------------------------------- | -------------------------------------------- |
| Private practice      | Explore a case, inspect failures, improve a solution | A new problem and visible improvement        |
| Cooperative operation | Combine complementary tested contributions           | A useful role in a crew                      |
| Ranked competition    | Submit code for reproducible server evaluation       | A fair contest and a result worth explaining |

Challenges can test robustness, calibration, data efficiency, memory,
latency, or interpretability. Publish the objective and constraints for each
challenge. Avoid collapsing every skill into one global accuracy score.

Distinctive formats include a defender building a robust solution and a
challenger constructing valid failure cases, a repair round after conditions
change, and a post-contest explanation festival. Beginners can have bounded
practice tasks while experienced members tackle deeper constraints.

The existing arena contract governs competitive scoring. Use new server-verified
submissions, hidden holdouts, isolated execution, reproducibility checks, and
auditable results. Existing client-reported course scores cannot seed rankings.
Public solution timing, moderation, appeals, and compute limits need explicit
operating rules.

First test: one cooperative challenge with two or three compatible components.
Prototype private practice before promising a continuous public competition.
Use the same learning measures alongside different participation modes.

### 7. Shared investigations with a published outcome

Give many crews parts of a bounded investigation. Some inspect data quality,
others compare baselines, and others test the proposed deployment. Publish a
board of open questions, verified findings, disproved claims, and remaining
uncertainty.

The next authored episode can acknowledge which valid evidence the community
produced and which operational path it chose. Define the possible decisions
and technical rules before the event. Community votes can select among valid
priorities. They cannot make a false result true or change an established
canonical fact.

Credit several forms of useful participation, including reproducing a failure,
checking an explanation, and finding an edge case. Cap repetitive contributions
so volume does not let a few participants dominate the event.

Use an honest fallback when participation is low. An editor can release a
clearly labeled supplied investigation. Never simulate community activity.
Keep the completed investigation playable for people who arrive later.

Crew-local decisions may differ. Publish a separate policy for the shared
seasonal outcome so personal branches do not create contradictory global
history. Show when a learner is replaying an earlier version of the event.

First test: a single event with two possible investigation priorities and a
small set of reviewed technical outcomes. Observe evidence quality, return for
the debrief, contribution distribution, and moderation effort.

### 8. A thoughtful return after an absence

When someone returns, show their last meaningful result, the relevant character
situation, and one clear next action. Offer a short optional recall activity
and a concise catch-up path for any new season.

Base the recap on actual progress and authored story state. State when work is
saved only in a particular browser. Missing records should produce a neutral
recap, not an invented history.

A crew can welcome a returning member into a bounded task immediately. There
should be no backlog of social obligations to clear and no relationship loss
for taking a break. Optional notifications should describe a real new event
or response, with learner-controlled frequency.

First test: observe people resuming after a genuine gap. Measure how quickly
they understand their situation and complete useful work, whether the recap
is accurate, and whether the return feels inviting.

## Ten community and character extensions

### 9. Character-led studios and apprenticeships

Offer optional studios centered on a character's approach to a problem:
hypothesis testing, reliability, evaluation, or operational decisions. Learners
can move between studios. Each studio supplies a short mission, a review
rubric, and an authored character debrief.

Over several missions, responsibilities become more demanding. An apprenticeship
could progress from checking an example to challenging an assumption and then
briefing a new crew. Progress records a demonstrated capability. It should not
become an affection score or permanent personality label.

Start with one approved future-season character and one shared technical case.
Test whether the framing improves explanations and motivates another mission.

A later variant asks the learner to teach a new apprentice character. They
diagnose a specific misconception, supply an example, and check a fresh case.
In a subsequent authored scene, the apprentice applies that explanation
correctly. Existing characters retain what they have already learned. The
platform should not make Demir repeatedly forget a mastered concept to create
another teaching exercise.

### 10. Evidence boards and story theory groups

Let learners collect published clues, attach reproducible analyses, and debate
interpretations. Every claim can link evidence, an alternative explanation,
and a test that could disprove it. Mark conjecture clearly.

Use episode-based spoiler boundaries and separate public fan theories from
official canon. A character's ambiguity can motivate discussion without the
platform inventing an answer. Test whether discussions produce clearer
reasoning as well as story interest.

### 11. Crew councils and difficult decisions

At a mission's turning point, ask crew members to state a recommendation before
seeing the group response. Let them inspect the same evidence through different
operational concerns, then reach a decision or record a disagreement.

The resulting scene should acknowledge the cost of the choice. A popular option
does not automatically become the correct one. Record why a learner changed
their mind, then use a new case to test understanding. This can support memorable
character conflict without requiring unlimited narrative branches.

### 12. Earned recognition in later scenes

Carry a bounded contribution into a later episode: a validated test remains in
the release checklist, a repair appears on the equipment, or a crew receives
credit for a finding. Use a small set of authored variants tied to verified
events and clear fallback behavior.

An optional end-of-operation record can combine the learner's actual project,
decisions, revisions, and credited collaborators. Public sharing requires the
appropriate participants' choices. This becomes both a personal memory and a
professional account of work, with assistance and simulation labels intact.

### 13. Playable invitations

Let a member invite a friend into a short, free, spoiler-safe task. The friend
can inspect a chart, run a small experiment, or contribute a valid counterexample
before creating an account. Their result can become a useful input to the crew.

The invitation introduces an actual experience and a relationship. Completion
must remain possible if the friend declines. Measure the guests who perform
meaningful work and voluntarily continue, not just link clicks.

### 14. Helper progression and repair clinics

Recognize people for reproducible help: a useful bug report, a good test case,
an explanation that survives review, or a bounded mentoring session. Novices
can contribute without pretending to be experts.

Use calibrated example reviews before granting broader reviewer responsibilities.
Keep feedback quality, recipient usefulness, and technical correctness separate
from popularity. Provide staff escalation and honest response expectations.
Test one review format with a small trained group before opening a large queue.

### 15. A commons of reusable learner work

Publish opt-in tools, visual explanations, tests, and mission solutions with
version, purpose, limitations, attribution, and compatible runtime information.
Show the lineage from original artifact to reviewed correction to later remix.

A learner can return because someone used their work or proposed a worthwhile
improvement. Begin with a narrow artifact type and reviewed publication. Apply
the actual material licenses and preserve required notices. Public source
availability does not automatically authorize publishing a learner's private
progress, identity, or discussion.

### 16. Archived crew replays

With participants' permission, edit a completed investigation into a replay:
initial theory, contradictory observation, changed approach, and final result.
Pause at selected points for a new learner to predict the next step.

Label archived people and events explicitly. This lets later arrivals benefit
from community reasoning without needing everyone online together. It can also
make arena matches useful to spectators. Measure prediction and transfer,
alongside whether viewers choose a related challenge.

### 17. Mission premieres and fandom activities

Experiment with occasional premieres, writer discussions, character-art
showcases, and failed-experiment evenings. Give each live activity an accessible
asynchronous version and a useful output.

Fandom participation can be valuable on its own. Fan art, theories, music,
and character discussion should not be falsely counted as technical mastery.
Separate official releases, commissioned work, and community interpretations.
Choose a cadence the team can sustain before promising weekly events.

### 18. Generations of crews

Let experienced learners return for a bounded handoff to a newer crew. A veteran
could supply a reviewed tool, explain a past failure, or inspect one release
decision. The new crew must still investigate and make its own decisions.

Across seasons, a small number of reviewed community contributions could appear
in later missions with credit. Selection should follow published editorial
criteria and permissions, with no implication that every submission becomes
canon. This gives the platform a history that people helped create.

## Six ambitious platform experiments

### 19. Cross-world expeditions

Design a shared operation with explicit interfaces between specialties. A
vision group might produce detections, a language group organize reports, and
a deployment group verify performance constraints. An evaluation group checks
the combined system.

Use a clearly framed crossover simulation until the stories support an approved
canonical connection. Each role needs an accessible entry task, useful output,
and independent learning check. The combined result should show why the next
world teaches a capability the learner now wants.

This depends on ready curricula, compatible artifacts, and reliable cooperative
missions. The first prototype can connect two components without connecting
all five fictional universes.

### 20. A persistent engineering simulation

Create a bounded simulated environment whose behavior changes according to the
actual systems learners build. Inputs drift, budgets tighten, equipment fails,
and monitoring detects problems. Teams investigate the same system across
multiple operations.

Separate computed outcomes from authored narrative reactions. Document the
simulation's assumptions and limitations. A convincing failure trace and a
useful repair may create more immersion than a large 3D map.

Prototype one controlled incident over an existing artifact. Measure whether
the persistent environment improves debugging and transfer before adding
continuous simulation or real-time multiplayer infrastructure.

### 21. Bounded character conversations

An AI-assisted conversation could let a learner question a published scene,
discuss an actual evaluation, or rehearse a recommendation to a character.
Use a limited scene, known evidence, authored character constraints, and a
clear boundary on what the character knows.

Major story decisions, assessment results, and canonical revelations remain
under authored control. Generated dialogue must not invent remembered learner
actions, claim scientific results, or reveal unpublished material. Make the
generated nature and fallback to authored explanations clear.

First compare a small authored conversation tree with a bounded generated
version. Evaluate technical accuracy, character consistency, spoiler behavior,
learning, cost, and preference. Keep the simpler version if generation adds
little value. Voice can be tested later with captions and playback controls.

### 22. Mission creation studios and a curated publishing ecosystem

Let educators and experienced community members author mission packs with a
learning objective, licensed data, story beats, starter code, a reference
solution, plausible wrong answers, and an explanation rubric.

Begin with an internal editor and invited authors. Preview story branches,
validate exercises, check accessibility, and publish community work in a
clearly identified anthology. Promotion into official canon needs editorial
review. A paid creator program or marketplace would require a later decision
about demand, maintenance, publishing rights, and revenue sharing.

The key experiment is whether a new author can create a good mission with
manageable review effort. A full custom-world SDK comes after that repeated
success. Ink provides a concrete precedent for tooling that supports authored
branching narrative, without deciding Tensorcraft's implementation stack.
[Ink's official overview](https://www.inklestudios.com/ink/)

### 23. A learner observatory with real partner projects

Eventually, a suitable research, nonprofit, or engineering partner could offer
a bounded real problem. Learners might reproduce an analysis, improve a test
harness, audit a public dataset, or document a failure.

Keep teaching simulations and real contributions visibly distinct. A partner
must review outputs before relying on them. Define data access, attribution,
maintenance, and the practical follow-through before recruiting participants.
For Signal Ward, early community work should stay within teaching or appropriate
research boundaries, with no clinical deployment claims.

Zooniverse's project builder illustrates a platform where organizers publish
structured contribution workflows. It is a precedent for participation design,
not evidence that Tensorcraft already has research partnerships.
[Zooniverse project builder](https://help.zooniverse.org/getting-started/)

### 24. Spatial and physical mission experiences

Much later, selected missions could extend into a shared browser room, an
optional AR tabletop, or a low-cost sensor kit. Participants could observe a
physical signal, collect data, and compare it with a clearly identified
simulation.

Start with an ordinary browser version of the same task. Hardware, headsets,
shipping, and synchronized meetings would add substantial access and support
requirements. Choose a spatial format only when it helps a specific concept
or collaboration pattern. A visually impressive room alone is weak evidence
of learning or return.

## How character attachment should develop

### Shared history

Store a small set of meaningful, factual events: which experiment the learner
ran, which valid decision they selected, and which contribution a later scene
used. Write callbacks around those events. Avoid storing an unbounded simulated
relationship or inferring a learner's emotional state.

### A change in responsibility

Let characters gradually rely on more demanding work. Early missions supply
examples. Later missions ask for a challenge to an assumption, an independent
evaluation, or a briefing for another crew. The emotional progression follows
growing capability and shared experience.

### Disagreement and repair

Characters should have understandable competing priorities and sometimes be
wrong. Show an evidence-based change of mind. A learner can disagree respectfully
and still belong. Agreement with a favorite character should never be the
hidden correct answer.

### Quiet continuity

Reserve recognition for specific moments. A familiar tool, a changed work
habit, or an earlier contribution still in use can carry a relationship across
episodes. These details need writing and art continuity more than constant
notifications or expensive generation.

### Room for life outside the platform

Characters do not become upset because a person was away. A returning learner
gets context and a useful next step. Relationship development follows completed
events, not daily attendance or purchases. Human crew participation remains
optional and manageable.

### Existing Deep Orbit boundaries

The current story bible protects ARIA's single direct acknowledgment, the final
`operator_note: none` beat, and the unresolved 73.4 relationship. It also limits
existing cross-world intercept expansion. These proposals do not add character
messages or scenes to the current season. A new season, apprenticeship, or
crossover needs an explicit canon scope and editorial review.

Sources: [story style bible](story-style-bible.md),
[character bible](character-bible.md), and [current learning contract](../CLAUDE.md).
Where older scripts conflict with later canon, use the current binding sources.

## A concrete prototype season

Working title: **The Relay That Stopped Answering**. This is a noncanonical
prototype premise about a new station. It does not resolve Deep Orbit's
existing mystery.

| Episode                    | Learning and contribution                                                                     | Character and community development                                             |
| -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Conflicting readings       | Inspect documented channels and units, compare traces, produce a valid preprocessing artifact | The crew disagrees about what the station's records establish                   |
| A suspiciously good result | Reproduce a strong baseline score, uncover a flawed evaluation split, test a fresh case       | A favored interpretation has to change after another member's evidence          |
| The deployment limit       | Compare failure costs and runtime constraints using fixed cases and measured results          | Different character priorities make more than one operational choice defensible |
| The handoff                | Integrate the reviewed components, explain the release decision, export the project           | Specific contributions appear in the final decision and the crew's record       |

After an interval, an optional new incident changes one condition. Learners
revisit the project and investigate its failure. That provides a real reason
for another operation and a test of retained understanding.

The first implementation can use existing scene components, a small set of
authored reactions, one shared artifact format, and asynchronous discussion.
New art, voice, a free-form character model, or a 3D environment are optional
later investments.

## A first learner experience

These are visits, not required consecutive days.

1. A free prologue presents one concrete mystery and lets the learner run a
   small useful experiment. The scene establishes who cares about the result.
2. The learner completes a bounded mission and saves an inspectable artifact.
3. They can continue alone or join a crew at a suitable pace.
4. A reviewer responds to their evidence. The learner revises a prediction,
   code, or explanation and tries a new case.
5. The crew makes an operational decision. An authored scene reflects the
   actual evidence and explains the cost of that decision.
6. The learner can share a playable excerpt or publish selected work.
7. A later visit offers a clear recap and a new condition affecting the project.

The experience has several exits with worthwhile accomplishments. Finishing
one operation should feel complete even if the learner does not immediately
start another.

## Priority and sequencing

The effort labels below are relative judgments, not estimates of weeks or cost.
Validate the underlying systems before scheduling these bundles.

| Bundle                     | Features                                                                | Relative burden                                | Evidence needed before expansion                                                  |
| -------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| First coherent prototype   | One short season, persistent project, character callbacks, return recap | Medium engineering, substantial editorial work | Learners understand the work and voluntarily choose another mission               |
| First community experiment | Small crews, artifact debriefs, rotating roles                          | Medium engineering, substantial facilitation   | Useful exchanges without blocked progress or one person doing everything          |
| Repeatable participation   | Cooperative arena, review clinics, playable invitations                 | High evaluation and operating burden           | Learning, response quality, repeat participation, and useful guest conversion     |
| Shared world events        | Investigations, studios, councils, archived replays                     | High editorial and community burden            | Credible outcomes, manageable moderation, affordable production                   |
| Ecosystem                  | Artifact commons, mission authors, multiple ready worlds                | High review and maintenance burden             | Good work from people outside the core team and durable reuse                     |
| Ambitious experiments      | Simulation, character generation, partner observatory, spatial missions | Very high or uncertain                         | A specific unmet need and an isolated prototype that outperforms a simpler option |

The first four anchor capabilities should be designed together, but each
mechanism should later receive focused evaluation. A giant feature release
would make it hard to learn what caused improvement or friction.

### The first experiment

Run a small discovery pilot with a handful of crews and a solo path. An
illustrative size is four to six crews of four to six learners. This is suitable
for observing mechanics and workload, not estimating an effect on a population
of 200,000. It does not replace the separately planned formal learning study.

Rehearse internally first. Observe technical failures, confusion, missing peer
responses, domination by one member, spoiler exposure, and return after a gap.
Use a new individual task to see what each person learned.

When participation supports stronger evaluation, hold the learning task
constant while testing a specific mechanism. For social features, assign by
crew where appropriate to reduce contamination across conditions. Record
self-selection, missing responses, facilitator help, and notification exposure.
Choose success criteria before looking at results, using the existing baseline
and the smallest improvement worth the operating cost.

## Scaling a community to a large population

### Many small groups with useful public connections

Local belonging can come from crews and studios. Public discovery can come
from playable missions, artifacts, investigation results, and creator work.
People should be able to move between crews and participate without joining
one. A global feed does not need to be the center of the product.

Growth can come through three proposed paths: a friend completes a playable
invitation, an engineer discovers a useful public artifact, or an educator
brings learners into a good mission. Measure meaningful continuation for each
path. The current acquisition plan still governs spending and channel tests.

### Production and editorial capacity

Treat a mission as a maintained package: objective, prerequisites, data contract,
starter/reference code, wrong-answer cases, runtime checks, story beats, branch
conditions, accessibility, and release metadata. Reuse tested components while
preserving a distinct problem and character situation.

Keep three records separate: immutable canon, the learner's recorded events,
and community event state. Mark which technical results were independently or
server-verified and which came from browser activity. Set the appropriate
verification requirement for each public contribution credit. This allows a
scene to reflect actual recorded work while preserving the evidence needed for
rankings, shared findings, or claims of demonstrated capability.

Prefer branches that rejoin after meaningful local consequences. Track actual
authoring, technical-review, and art effort. Publishing cadence should follow
measured production capacity and demand.

### Moderation, review, and absence

Separate peer help, technical adjudication, editorial correction, and behavior
moderation. Establish reporting/blocking, staff escalation, review permissions,
and visible response expectations before opening public submissions widely.
Default new community contact to structured mission spaces, with direct-message
preferences controlled by the learner.

Use staffed support for issues that cannot depend on volunteers. Avoid promising
instant human mentorship. Make empty crews recoverable and unanswered questions
visible to operators.

As scenario arithmetic, if 200,000 active people each had a 1% weekly chance of
needing eight minutes of human help, that would require about 267 hours per week.
Those are illustrative assumptions, not observed demand. Measure actual support
and moderation rates before planning staffing or pricing.

### Compute and data costs

Capacity follows concurrent runs, submission complexity, storage, and generated
dialogue, rather than account count alone. Keep private practice local where
appropriate, protect public execution, bound saved artifacts, and track cost
per completed useful activity. Preserve permission, export, deletion, and
version compatibility as publication and collaboration expand.

### Commercial options

Retain purchased course access. A future membership could fund new seasons,
facilitated crews, and continuing practice only if learners value that ongoing
service and the team can sustain it. Free playable episodes, public challenges,
and selected artifacts can support discovery.

Enterprise expeditions and creator revenue sharing are later options. Measure
delivery costs and demand before selecting them. Story relationships and prior
achievements should not disappear when someone declines another purchase.

## Measures that would justify continued investment

| Question                      | Useful evidence                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Are people learning?          | New-case performance, explanation quality, retained understanding, debugging transfer      |
| Do they care about the story? | Recall of stakes and character motives, voluntary next-episode participation, interviews   |
| Are relationships useful?     | Repeated collaborators, reciprocal help, contribution quality, belonging reports           |
| Do they return?               | Meaningful later activity by cohort, with reminders and new releases reported separately   |
| Does helping work?            | Reproduced corrections, revised artifacts, useful-response time, calibrated review quality |
| Can newcomers enter?          | Time to first useful contribution, guest continuation, unfilled roles, solo success        |
| Is the product sustainable?   | Authoring/review hours, support load, moderation incidents, compute and storage costs      |
| Is growth valuable?           | Qualified referrals, activated learners, retained purchases, refunds and support effort    |

Inspect distributions, not only averages. A healthy-looking aggregate can hide
novices receiving no replies or a few experts doing nearly all the work. Also
recognize successful completion: a learner who achieves a goal and leaves
satisfied is a legitimate outcome.

## Ideas to keep small until evidence supports them

An unrestricted AI companion, a continuous MMO, a complex token economy,
mandatory real-time crews, or a large creator marketplace would create heavy
obligations before the core experience is proven. Each can have a bounded
prototype where it solves a specific problem. None is required to test the
combination of authored story, useful work, character continuity, and human
collaboration.

The proposed first investment is one memorable operation that people finish,
understand, discuss, and choose to revisit. Its results should determine which
of these features enters the delivery roadmap.
