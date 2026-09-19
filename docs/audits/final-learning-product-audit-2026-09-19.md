# Final learning-product audit

2026-09-19. Internal review of revision `80a3f029`. This audit asks what would make Deep Orbit a course learners choose, finish, use and recommend. It does not repeat the previous release verification or claim independent learner evidence.

**The next substantial improvement is to make the investigation something the learner conducts.** Tensorcraft already has unusually specific story material and substantial engineering practice. Its weakest connection is between reading about a mechanism, manipulating that mechanism, seeing its consequences, and recognizing the skill gained.

I would keep the identity, characters, browser editor and curriculum investment. I would improve the first session, introduce a few carefully designed visual experiments, make the growing system visible, and strengthen character development. More lessons, more cinematic assets and more badges would be lower priorities.

I cannot conclude that Tensorcraft is one marketing plan away from tens of thousands of users. This review can assess the product's design and teaching opportunities. It cannot establish conversion, sustained use, learning transfer or repeat purchases.

## What this review covers

- Read the authored dialogue and epilogues across all 56 Deep Orbit lessons, including all six decision prompts and their six later continuations. Read the season rules and character metadata.
- Closely inspected teaching and assessment material around tensors, shapes, normalization, evaluation, attention, threshold selection and the final project. Inspected selected runtime and deployment material and the preceding technical verification report. This is not another word-by-word factual certification of every lesson or another execution of all 65 exercises.
- Inspected onboarding, prerequisite enforcement, the six lesson phases, recall/review, decisions, dashboard, project export, pricing and the cross-world handoff in source.
- Ran a local production-build check: seven successful cached build tasks. Captured 20 public page/lesson states at 1440px and 390px. All returned HTTP 200, with no uncaught page errors or document overflow. Lesson-phase fixtures select states; they do not demonstrate learning or earned completion. Motion was reduced. This pass does not measure cinematic playback, production performance or physical-phone usability.
- Re-examined retained desktop/mobile lesson and dashboard captures from the preceding UI audit. Authenticated layout observations are fixture evidence, not a new signed-in production test.
- Checked current primary product pages and learning-science papers. No reviewers were contacted, no accounts modified and no application changes deployed.

The [evidence record](final-learning-product-2026-09-19/evidence.json) records source hashes, inventory counts, measurements and reading scope. The [first implementation specification](deep-orbit-first-experiment-spec-2026-09-19.md) makes the highest-priority recommendation concrete.

## Where the product stands

These are editorial judgments against a more demanding product standard, not a replacement for the previous internal correctness grade.

| Area | Current assessment | What would make it excellent |
| --- | --- | --- |
| JS engineer new to ML | Good technical entry point, demanding first module | Earlier visible success, fewer simultaneous new ideas, gradual removal of help |
| Learner who knows ML | Useful browser deployment material, weak entry route | Direct access to relevant material and challenges that test engineering judgment |
| Conceptual understanding | Careful explanations, code, recall and optional derivations | Manipulable representations that expose why results change |
| Practical value | Real exercises, runtime lab and external project | A visible chain from lesson work to an independently explainable artifact |
| Story | Strong mystery, distinctive ARIA/Nazari moments | More visible character growth and fewer repeated novice mistakes |
| Player agency | Six persisted choices with downstream effects | Defensible alternatives, constrained resources and visible follow-through |
| Visual identity | Coherent, recognizable and worth keeping | More instructional graphics and a clearer hierarchy of evidence |
| Readability | Far better than generic generated prose; uneven density | Move secondary precision into appropriately placed notes; reduce repeated explanation |
| Value at $70 | Credible for the right learner | Demonstrate the actual deliverable and disclose the time commitment |
| Retention and market scale | Unestablished | Actual learner behavior and transfer evidence after internal improvements |

## Findings and recommended changes

### F01. The promise should describe a specific useful outcome

The world page currently says that 11 modules stand between the learner and their first ML model. That undersells the early model work and makes the course sound like a long prerequisite. The paid card lists lessons, modules, illustrated lessons, a capstone, GitHub and a certificate. It does not show what the learner's finished work does. [World page](../../apps/web/app/worlds/[slug]/page.tsx), [pricing](../../apps/web/app/pricing/pricing-tiers.tsx).

Recommended world-page promise: **Build, evaluate and run a signal-classification system in JavaScript, while investigating a signal the Archimedes crew cannot explain.** Pair that with a plainly labeled example of the external room-occupancy project: inputs, baseline comparison, prediction, uncertainty and saved artifact. Identify supplied starter work separately from learner work. Keep the owner-approved homepage headline; the outcome example can live in the course overview and pricing explanation.

Name the intended audience: people comfortable with JavaScript functions, arrays, objects and async code who want practical ML understanding. A second audience already knows model basics and wants browser inference, evaluation, caching and deployment practice. The current course is not a complete preparation for ML research or a promise of a career change. Existing comparison-page honesty is useful; make the entry and onboarding equally specific.

JavaScript alone is not a unique proposition. Scrimba also teaches AI application development in JavaScript. Google's ML Crash Course offers interactive explanations and self-contained modules; fast.ai is free and explicitly puts a deployed model near the beginning. Tensorcraft needs to win through the combination of coherent investigation, JS implementation and sound judgment. These are feature comparisons, not a claim to have completed the competing courses. [Scrimba curriculum documentation](https://docs.scrimba.com/how-ai-works/introduction), [Google MLCC](https://developers.google.com/machine-learning/crash-course), [fast.ai](https://course.fast.ai/).

### F02. The first useful result should arrive before a long introduction to runtime ownership

Lesson 1 introduces rank, backend storage, readback, dtype and tensor disposal. Its first exercise also requires a tensor reduction and conversion to a plain JS array. These are legitimate skills. Together they make the first achievement feel more like satisfying an API contract than understanding a new capability. [Lesson](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx), [exercise](../../packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml).

The five free lessons total **109 authored minutes**, including exercises. The live classifier preview appears in lesson 5's epilogue. The homepage links directly to lesson 1; its earlier spectator demo was deliberately removed. Improve the learner's first experiment inside the course rather than restoring that removed homepage panel. [Landing hero](../../apps/web/app/components/landing-hero.tsx).

Add one short, meaningful experiment in lesson 2: predict which values belong to a sensor channel, compare reshape with transpose, and watch the channel trace become correct. This uses a mistake the lesson already teaches and leaves the mystery intact. Keep lesson 1's cleanup discipline, but introduce it after the learner can see the data they are holding. Do not postpone disposal until after repeated inference.

Make a 10-to-15-minute first-session route a design target, not a promised completion time. It should end with a saved result and a clear stopping point even if the learner has not finished the entire free module. Do not shorten the preview merely to push the paywall earlier.

### F03. Several mechanisms deserve experiments instead of more paragraphs

Inventory: 129 authored `CodeBlock` components, 83 recall prompts and 20 derivation drawers. The course has 65 coding exercises, three decision assessments and external work. It is interactive. However, I found no authored `InteractiveDemo` use in Deep Orbit; its one `DeepScanDemo` embed classifies fixed rows without learner controls. The largest opportunity is conceptual experimentation alongside that existing code practice.

Start with three experiments; extend only after their behavior is good:

| Experiment | Learner controls | Learner observes and explains |
| --- | --- | --- |
| Shape and channel membership | Reshape versus transpose; selected coordinate | Identical target shapes can contain different values; identify the correct channel |
| Scaling and inference contract | Raw versus saved training statistics; one input reading | Same fixed weights produce different scores when input representation changes |
| Threshold and cost | Threshold and stated miss/review costs | Which rows move between TP/FP/TN/FN; why the lowest-cost choice can change |

Later candidates: learning-rate overshoot on a stated toy loss; window length versus FFT resolution; attention weights as coefficients in a value blend; exact versus rounded cache keys around a decision boundary. These are not all launch requirements.

Every experiment needs a prediction before the reveal, inspectable numeric output, a short explanation and one unfamiliar follow-up case. A slider alone can encourage motion without understanding. Keep the relevant code beside the display, and identify toy data, pretrained weights and actual measurements accurately.

For normalization, hold the model and its preprocessing contract fixed when teaching inference. For thresholds, use validation examples while choosing and a separate final evaluation. For attention, do not visually equate large weights with causal importance. For a cache experiment, show the uncached verdict as the reference, not a fictional accuracy improvement.

### F04. Prior ML knowledge needs a real route through the course

Onboarding asks about JavaScript seniority and goals. Advanced/expert profiles open math drawers by default. Paid lesson routes still enforce prior-module completion, and lesson navigation imposes additional sequential affordances. A senior JS engineer is not necessarily experienced in ML, and an ML practitioner should not need to clear every beginner module to inspect browser deployment. [Onboarding](../../apps/web/app/onboarding/page.tsx), [lesson routing](../../apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx).

Offer two reversible choices: **Learn ML from the beginning** and **I know the basics; show me the engineering challenges**. Keep the current story sequence as the recommended route. The second route should open a compact prerequisite check and let a purchaser browse relevant lessons with links to missing concepts. Passing a short diagnostic can recommend a starting point; it must not silently award all the skipped exercises or a certificate.

Do not build a large adaptive engine for launch. An explicit route preference, a small set of capability checks, optional examples and a spoiler-aware recap will do more than another profile questionnaire. Payment authorization remains enforced regardless of route.

### F05. Practice should gradually ask for more judgment

The build-triage assignment, three decision tasks, incident exercises and independent room project are valuable additions. Keep them. The next step is to connect them into the ordinary course progression, so independent work does not feel like an extra assignment encountered late.

At each major capability, use a small progression: inspect a worked example, finish a partly completed example, debug a plausible failure, then apply the idea with changed data or constraints. Do not add all four to every lesson. Reuse an existing exercise where possible.

Some existing challenges deliberately change an example's function signature or tensor rank. That can test adaptation, but adaptation should serve the learning objective. In the attention lesson, foreground why keys and values may have different widths, rather than making the benefit sound like preventing copied code. [Attention challenge](../../packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx).

Feedback should say what was observed, why it matters and what to inspect next. Example: “Your output contains readings from several channels. Compare the original coordinates of the first three values.” Keep the reference solution available after help; follow a viewed solution with a different small task. Neither a passed test nor a self-rated recall establishes mastery.

Use diagnostic questions selectively. For example, ask which rows may fit the scaler, or which cached result can suppress an alert. Requiring an essay after every successful operation would add friction without establishing better understanding.

### F06. The learner needs to see DEEP SCAN accumulate

The story carries a growing system. The interface largely carries lesson progress, scores, streaks, collected bridges and exercise files. The external project and runtime lab provide practical work, but their relationship to the system assembled during the story can be easier to see. [Dashboard](../../apps/web/app/dashboard/dashboard-view.tsx), [independent project](../../apps/web/app/components/mdx/independent-project.tsx), [runtime lab](../runtime-lab.md).

Add a compact system view with five stages: data, model, evaluation, runtime and operations. Each stage should link to the relevant learner result, its input/output contract and what remains unchecked. Start with links and evidence summaries from existing work; do not immediately turn all 65 isolated exercises into one fragile shared program.

Useful statuses are “practised with help,” “passed this check,” “applied to new data” and “review due.” Counts and streaks can remain secondary. Never calculate a mastery percentage from exercise completion and present it as validated ability.

Bring the room project brief into the course overview, add milestone prompts after data preparation and evaluation, and make the final export a destination learners recognize. Keep the supplied model and maintainer fixture distinct from the learner's independently trained result. A portfolio of exercise answers alone is a weaker value proposition than a small app its owner can explain.

### F07. Character development should change later behavior

The strongest scenes already do this. ARIA retains a fragment through an old watchdog rule after the failed deployment. Nazari watches the signal without writing anything down. Demir's shuffled-sequence experiment gives him a concrete reason to change the model. These moments combine the lesson with a change in perspective.

The repeating weakness is Demir returning to an overconfident analogy, paying for it, and receiving a correction. By capstone CI/CD, he reuses a model-name cache key after the earlier loading and cache lessons have already made that failure expensive. A later error can be harder without making him forget an earlier lesson. [Model loading](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx), [CI/CD](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx).

| Character | Preserve | Next development to earn on the page |
| --- | --- | --- |
| Demir | JS instincts, certification ambition, willingness to try | He catches an old failure before another person does; his later mistake concerns a new constraint. Pay off certification responsibility through a duty or review assignment before the final log. |
| Nazari | Crew time, counts, skepticism, restrained warmth | More disagreement about real resource limits; fewer threats about sleep or coffee. Let respect change whom she trusts with a task. |
| Farah | Precision, curiosity, trust in methods | An attractive hypothesis costs her something; she withdraws it and changes the next investigation herself. Avoid making every appearance a correction of Demir. |
| ARIA | Records, literal language, the shrinking role | Keep the watchdog rescue and fallback box. Her accumulated records should materially help the investigation without becoming magical intuition. |
| Mirza | Questions and decisions | Show a costly decision's aftermath through the duty board or withheld action. Keep her terse. |

These are revisions to existing beats, not requests for more cast or backstory chapters. Follow the character registers and preserve the fixed canary deployment, unresolved signal, and final `operator_note: none` beat. Do not add direct cast address to the learner beyond the established exception. Any change to those rules is a separate canon decision. [Story bible](../story-style-bible.md).

### F08. Make the strongest choices contestable

The six saved choices already change later work and handle missing choices. Their technical scaffolding is not missing. The design opportunity is in the alternatives: inventing a confirmed label and treating an unlabeled probe correctly are not equally defensible calls. Such a choice can teach a misconception, but it is not a difficult command decision. The cache choice similarly makes the versioned exact key conspicuously complete. [Anomaly decision](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx), [cache decision](../../packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx).

First improve the existing 7741 investigation and drift-response choices. State the resource constraint, evidence available and cost of delay. Ensure at least two options are defensible under different explicit priorities. The consequence should show the action taken, its opportunity cost and the next observation. Keep invalid scientific claims invalid; do not reward a choice by changing ground truth or calibration.

Keep stored IDs stable. The current stance labels and rendering order are implementation details, not a reason to author one universally superior answer. If the content eventually needs a different option schema, migrate it deliberately. More choices are unnecessary until the existing ones carry this weight.

### F09. Separate dramatic prose from measurement provenance without losing either

Recent factual repairs prevent serious misunderstandings. They also sometimes put review language into the closing scene. Autoencoders stops to explain that mission numbers are not a reproduced experiment. Multi-model systems labels its fictional timing and distinguishes its fictional 340 MB bundle from the shipped model while the scene is moving toward a crisis. [Autoencoders](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx), [multi-model systems](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx).

Retain that information in a clearly visible, compact note adjacent to the relevant figure or scene: “Mission scenario. Your run may differ.” Put reproduction details in an expandable evidence note. Keep scientific caution inside the dialogue when it affects the decision: a score cannot identify a signal's origin, for example. Do not hide a material caveat only in a tooltip or remove it to improve drama.

Use a plain body sentence before any analogy, then one useful mapping, one boundary and one concrete counterexample. The attention lesson spends substantial space establishing and then undoing CSS `:focus`; a weighted JS reduction explains the arithmetic more directly. Browser-specific analogies can remain where they help, but a Node-oriented engineer should not need CSS knowledge to understand the core mechanism.

The existing lexicon tests are useful. They cannot judge rhythm, redundant qualifications or the feeling that a character exists only to deliver a lesson. Those require scene-level reading.

### F10. Keep the visual identity; spend the next design effort on learning

The square geometry, restrained green, mono labels, sans-serif reading text and illustrated setting form a recognizable identity. Desktop reading width is reasonable in the inspected states. Shrinking body type to reduce page height would make the product worse.

The normalization Concept view measured **6,170px desktop and 10,064px mobile** at a 900px-high viewport. The introductory tensor Concept view measured 3,527px and 5,132px. Height alone is not a usability failure, and scrolling is preferable to unnecessary pagination. Here it reveals how much explanation and code precede experimentation.

Use the existing Concept phase for a few short explanation/experiment pairs. Keep a complete reference view available. Let Code be an optional example/reference workspace when it repeats the same blocks, rather than a mandatory extra read. Preserve existing deep links, backward navigation and exercise state.

For instructional graphics: label axes and units directly, distinguish inputs from outputs, synchronize highlighted values with code, and provide a table/text equivalent. All controls need keyboard operation; animations need a static/reduced-motion form. On mobile, show the question, control and result together before optional derivation. Use the current design tokens and no colored left accent bars.

The mission's urgency should remain fictional. Avoid real countdown pressure, lost streak threats or withholding needed help. Do not add background animation to code work. The useful visual spectacle is the learner seeing a wrong channel trace become correct.

### F11. Give the next theme a skill-based reason to exist

Deep Orbit already has a Neon Protocol intercept and a modeled cross-world ring. Preserve them; adding more DISPATCH appearances would conflict with the current story bible. [Existing handoff](../../packages/content/content/deep-orbit/capstone/05-launch.mdx), [shared progression model](../../packages/shared/src/journey.ts).

Let the ending settle. Put the commercial continuation in the course-completion/dashboard surface, separate from the final narrative beat. Show what is reused, what is new, one sample task and actual availability. Example for Neon Protocol: reuse tensor and evaluation skills, learn spatial inputs and bounding-box evaluation. Future worlds should avoid charging returning learners in time for the same beginner material; provide prerequisite refreshers and a returning-learner route.

The next purchase should offer a new application and a new cast relationship while respecting the work already completed. Do not make the Deep Orbit learning payoff depend on buying an unfinished sequel, imply unreleased material is available, or invent a release date.

### F12. Price and growth need evidence the interface does not yet provide

$70 is a credible one-time price for a focused course with useful practice and a working external deliverable. It is not automatically fair because the repository is large or the art is expensive. Free alternatives are strong; Execute Program currently lists $39/month for its whole catalog and emphasizes code practice plus review. That is a different product and billing model, not proof that Tensorcraft should charge the same. [Execute Program](https://www.executeprogram.com/), [fast.ai](https://course.fast.ai/).

The current metadata totals 1,676 minutes, about 28 hours, of lessons and embedded exercises. The separate room project suggests another 4 to 8 hours, explicitly an unvalidated author estimate. The learner's time is the larger commitment. Show the result, prerequisites, what the purchase includes, the current five-day refund terms and the honest workload before checkout. Do not change pricing or refund policy as part of a design audit.

The move from $50 to $70 is better supported by users reaching a useful outcome than by another internal grade. Retain the existing recall/review and study tooling. Add evidence of progress toward an external artifact to the product, not a stronger certificate claim.

## Teaching methods: what the research supports

These findings guide the proposals; they do not predict Tensorcraft's effect size.

| Research | Application here | Limit |
| --- | --- | --- |
| Karpicke and Blunt found retrieval practice improved conceptual learning and inference from science texts in their experiments. [Paper](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf) | Keep the 83 recall prompts; add a few later questions using changed examples, not just rereading summaries. | Text learning is not proof of software-building transfer. Self-rated recall remains self-report. |
| Cepeda and colleagues examined the relationship between study spacing and later retention. [Paper record and abstract](https://digitalcommons.usf.edu/psy_facpub/1766/) | Keep the implemented spaced-review system and a delayed check; do not replace it with a daily streak. | There is no single optimal interval for every retention goal or skill. |
| Reisslein and colleagues found different example/problem ordering benefited learners with different prior knowledge in circuit analysis. [Paper](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Exp_Rev_LI06.pdf) | Offer examples first for newcomers and problems first with optional explanation for experienced learners. | The study did not establish fading as universally superior; ML familiarity must be assessed separately from JS seniority. |
| Mayer and Moreno describe and test ways to reduce avoidable processing demands in multimedia instruction, with transfer as an outcome. [Paper](https://carpentries.github.io/instructor-training/files/papers/mayer-reduce-cognitive-load-2003.pdf) | Put code, diagram and explanation near each other; let learners control the pace; remove decoration competing with the task. | This does not establish that every animation, short page or particular word count improves learning. |
| Habgood and Ainsworth compared versions of a mathematics game with different integration of learning and gameplay. [Paper](https://www.tandfonline.com/doi/full/10.1080/10508406.2010.508029) | Make understanding the mechanism useful to the investigation itself. | Participants were children learning mathematics. Do not transfer its engagement multiplier to adult JS engineers. |

## The season, with a teaching payoff at each stage

This is a revision map, not eleven new feature requirements. One well-executed experiment can establish the pattern; use existing tasks for most later stages.

| Module | Learning payoff to foreground | Story development to strengthen |
| --- | --- | --- |
| Foundations | Recover channel membership; preserve a scaler contract | Learner obtains usable evidence without resolving 7741 |
| Neural networks | Trace a weighted sum to its output | Demir makes and checks a prediction before Farah explains |
| Training loop | Beat or reject a baseline on held-out data | A disappointing score changes what the crew is willing to deploy |
| Browser runtimes | The same artifact works after reload and cache failure | ARIA retains an old result the crew later needs |
| Signal processing | Read frequency and resolution from an actual plot | The learner notices the relevant peak before the dialogue names its significance |
| Recurrent networks | Compare ordered and shuffled inputs and a persistence baseline | The successful recurrence prediction pays off the earlier failed run |
| Anomaly detection | Set a policy using error costs and acknowledge unknown labels | Investigation consumes a resource another crew member needs |
| Advanced time-series | Inspect a weighted blend and test a forecast against later observations | Farah acts on her own hypothesis's failure; Demir corrects an earlier instinct |
| LLM integration | Trace and reject an unsupported claim | Keep Nazari initialing the correction to her own approved summary |
| Optimization and edge | Measure size, output disagreement and latency separately | Preserve the irrecoverable capture loss and ARIA's limited salvage |
| Capstone | Run and explain a reproducible external artifact | Pay off Demir's responsibility and ARIA's changed role before the unchanged final record |

## Implementation order and the stopping point

Do these as small reviewable patches. The order is deliberate; do not rebuild the entire player before proving the first experiment is pleasant to use.

| Patch | Concrete scope | Acceptance evidence |
| --- | --- | --- |
| 1. First useful experiment | F02/F03: shape experiment in the existing lesson; short explanation and unseen follow-up. Specification linked above. | Numerical correctness, a complete keyboard path, narrow-screen rendering, reload/state behavior and no exercise-state loss |
| 2. Honest route and outcome | F01/F04/F06: correct first-model claim, show the actual project, explicit ML-background route and prerequisite guidance | Purchaser can reach appropriate material; no payment bypass or automatic mastery/certificate credit; project and supplied work clearly labeled |
| 3. Concentrated story edit | F07/F08/F09: revise repeated cache mistake, two existing decisions, key character payoffs and placement of evidence notes | Six existing decision IDs and every branch preserved; missing-choice states valid; technical qualifications and final canon intact; scenes read aloud in sequence |
| 4. Core experiments and progress | Scaling and threshold experiments; evidence links and project milestones; targeted transfer checks | Correct boundary behavior, help recorded honestly, saved evidence distinguishable from fiction and self-report |
| 5. Continuation | Completion-surface next-theme preview with skills carried forward | Ending remains intact, unreleased status accurate, returning route avoids redundant work |

Before broad promotion, I would complete patches 1 through 3 and make the existing external project easy to discover. Patch 4 can follow in small additions; do not hold launch for every possible visualization or a full shared-code workspace. Patch 5 matters most when a second theme has a credible preview.

Internally, an excellent result means the promised experience is implemented, every core mechanic has an accurate explanation and check, story decisions remain coherent, and representative novice/experienced routes work without intervention. It does **not** mean we have measured novice understanding by walking through our own answers. Independent reviewers and learners remain later steps, as requested.

## How to tell whether it earns wider distribution

Use the existing lesson, exercise, hint, recall and conversion events first. Add only missing events for experiments, selected routes and project milestones. Do not send free-text answers, submitted code or story text to analytics. Continue honoring consent. Server purchases and opt-in browser activity have different denominators; report that limitation rather than silently joining them into a complete funnel. [Event registry](../../apps/web/lib/analytics-events.ts).

The first useful measures are:

1. First meaningful result among people who start the free course, with time and help used. A completed animation is not this event.
2. Success on a different input after the example is hidden, separated from a solution-assisted pass.
3. Return to useful work within seven days, alongside voluntary stopping points and unresolved confusion. Longer time on page is not inherently better.
4. Progress from an original project brief to a runnable artifact and an explanation of its split, baseline, errors and limits.
5. Purchase, refund and support reasons by audience and acquired cohort.
6. Interest in a specific next-theme task, followed by actual purchase when available. A waitlist click alone is weak evidence.

Use the already prepared pre/post/delayed [task forms](../learning-study/task-forms.md) when that later learner phase begins. A small observed cohort helps diagnose problems; it will not prove a market-size forecast. Set experiment decisions in advance, retain counts and uncertainty, and do not optimize conversion at the expense of demonstrated learning.

Illustrative scale arithmetic, not forecasts or industry benchmarks: 20,000 registrations would require 200,000 qualified visitors at an assumed 10% registration rate. If 5% of those registered learners buy, that is 1,000 buyers, not 20,000. At $70 that is $70,000 gross before refunds, fees, taxes, acquisition and support costs. Twenty thousand buyers through that same hypothetical funnel would require four million qualified visitors. Repeat theme purchases increase purchases, not unique users.

Tensorcraft has a credible product direction: learn ML by carrying out a technically honest investigation in JavaScript. The next release should make that claim visible in the learner's first result and in the work they can take away.
