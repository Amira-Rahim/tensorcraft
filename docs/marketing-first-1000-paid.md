# Tensorcraft: first 1,000 paying customers

Working plan, 2026-09-25. Starting point confirmed by the owner: **zero users, a target of 1,000 paying customers, and $200 per month for marketing.**

Audience size and available working hours are unknown. This plan assumes no existing audience and proposes 10 hours of marketing work per week. The workload and timeline must change if less time is available. The $200 is treated as incremental marketing spend; hosting and other existing operating costs are outside it.

This is the operating plan for this target. It supersedes the acquisition budgets, waitlist targets, launch forecasts and channel calendar in [the earlier marketing plan](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/marketing-plan.md). Conversion rates below are planning assumptions, not Tensorcraft results or industry benchmarks.

## 1. Decision

Keep the $50 Deep Orbit offer. Recruit the first buyers personally, use their experience to improve the sales explanation and opening lessons, then distribute useful course excerpts through JavaScript publications and community hosts.

The proposed positioning is:

> Learn to build and evaluate machine learning models in JavaScript, through a sci-fi mission you can code in your browser.

The target buyer already writes JavaScript, is new to ML, and wants to understand what a model does well enough to build and assess one. They have a concrete learning goal, such as understanding a classifier or adding a model to a personal project. React and Node backgrounds both fit. Find this intent in conversations before narrowing further by job title.

The story is part of the teaching experience and a reason to remember the product. Show it together with working code. Test whether buyers value it; do not assume that attractive art establishes demand or improves retention.

The first sales message should explain the learning outcome, show an actual interaction, and invite the reader into the free course. The existing story-first homepage headline is an owner-decided baseline. This plan proposes campaign copy and small funnel improvements, not an unsolicited homepage redesign.

## 2. What the product actually supports

I inspected the local product and content architecture, acquisition pages, free lessons, selected later course material, exercises and project exports, payment flow, analytics, email runbook, launch records and learner-study materials. I also inspected live public pages and repository screenshots. Browser control timed out before a complete interactive walkthrough; this is not a fresh end-to-end checkout or learning-runtime verification. Local lesson changes are in progress, so promotional recordings must use the deployed version.

| Finding | Consequence for marketing | Evidence |
| --- | --- | --- |
| Deep Orbit is the only launched world: 56 lessons, 11 modules, 65 exercises. | Sell one complete course. Other worlds are future interest, not purchased value. | [Constants](../packages/shared/src/constants.ts), [launch scope](launch-scope.md) |
| Five foundations lessons are free without an account; the full course is $50 once. | Every campaign can lead to a usable sample. Avoid a new prelaunch waitlist. | [Live homepage](https://tensorcraft.app/), [pricing](https://tensorcraft.app/pricing) |
| The deployed pricing page lists about 109 minutes for the free module and the homepage about 28 hours overall. | Do not describe Module 1 as a five-minute trial or the full course as a weekend project. Local timing edits differ from production. | [Pricing](https://tensorcraft.app/pricing), [first lesson source](../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) |
| Lesson one teaches tensor storage, shape and disposal. Model architecture and training come later. | Explain the first task honestly. Show the eventual model outcome before asking for a long learning commitment. | [Foundations](../packages/content/content/deep-orbit/foundations/module.yaml), [first lesson](../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) |
| The channel-layout experiment has a direct entry URL. A pretrained DEEP SCAN demonstration exists at the end of the free normalization lesson. | Existing interactions can supply clips and article demonstrations. Label inference with a supplied model separately from training your own model. | [Tensor shapes](../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx), [normalization](../packages/content/content/deep-orbit/foundations/05-normalization.mdx), [demo](../apps/web/app/components/mdx/deep-scan-demo.tsx) |
| The course includes analogy limitations, real exercise checks, model export and an independent room-occupancy assignment. | Demonstrate why someone would pay for the structured practice. Later external projects require a local setup; the no-setup claim applies to in-browser lessons. | [Independent project](../apps/web/app/components/mdx/independent-project.tsx), [project export](../apps/web/app/components/mdx/project-export.tsx) |
| The code distinguishes 56 lesson-embedded bridges from a 51-entry canonical bridge package. | Prefer a specific example over a headline count. Check publication and documentation links before promoting the package. | [Constants](../packages/shared/src/constants.ts), [package README](../packages/bridges-public/README.md) |
| Signup is optional for the preview but required by the current purchase flow. | Measure the sign-in handoff between pricing and checkout. Do not advertise guest checkout. | [Checkout button](../apps/web/app/pricing/checkout-button.tsx), [payment routes](../apps/api/src/routes/payments.ts) |
| Learning and purchase events exist, but the homepage hero lacks the explicit free-CTA tracker used on `/learn`. Checkout metadata does not contain campaign attribution. | Verify source-to-purchase reporting before buying traffic. Existing analytics are useful but are not proof that the entire funnel is attributed. | [Hero](../apps/web/app/components/landing-hero.tsx), [events](../apps/web/lib/analytics-events.ts), [payment routes](../apps/api/src/routes/payments.ts) |
| The email runbook says automation setup is pending and contains outdated duration/count copy. | Verify the real configuration and update drafts before relying on email follow-up. Code hooks alone do not establish delivery. | [Email runbook](email-retention-sequences.md) |
| Independent learner recruitment and outcome evidence remain open. | First collect real buyer reasons, friction and follow-through. Do not claim proven learning gains, job outcomes or happy customers. | [Study packet](learning-study/README.md), [measurement handoff](learning-study/learning-product-handoff.md) |

The repo has enough product material for a sales experiment now. Prioritize observed blockers and distribution over adding another world or another marketing feature.

### The competitive reason to pay

JavaScript ML itself is available free: TensorFlow publishes tutorials and a browser-ML course. Therefore, “no Python” is a useful audience filter, but it does not by itself justify $50. Tensorcraft's paid proposition is a coherent sequence, executable practice with feedback, explanations grounded in familiar JavaScript, and a continuing story. This is a positioning hypothesis to test, not a uniqueness or effectiveness claim. [TensorFlow's own learning resources](https://www.tensorflow.org/js/tutorials).

Potential first customers want ML understanding in their existing language. Buyers seeking a Python/PyTorch career path, an accredited qualification, or a quick chatbot API tutorial need a different offer. Do not stretch the campaign to include them.

## 3. What counts as success

Count **unique external customers with a successful real payment and positive retained revenue**, excluding staff, test transactions, complimentary access, fully refunded/disputed purchases and people whose purchase was funded by the study. Deduplicate by account and reconcile duplicate accounts if discovered. Keep gross purchasers, refunds and retained purchasers visible separately. Reassess the retained count as later refunds occur.

At $50 each, 1,000 full-price purchases generate $50,000 gross revenue before refunds, fees, taxes and support costs. This is not profit or recurring revenue.

Use the purchase ledger and verified payment records as the count. Client-side `payment_completed` events alone are insufficient: server and client events share that name, and the server also supports zero-value grants. Reconcile by payment/session identity and actual amount.

The intermediate learning milestone is a first successful free exercise. Track whether people then return and start paid material. Neither a pageview nor an account creation counts toward the 1,000.

## 4. The scale required

The monthly budget is too small to assume advertising will supply 1,000 sales. Even an illustrative $20 acquisition cost would cost $20,000, or 100 months of the whole budget. Most acquisition must come from founder work, editorial discovery, partner audiences, search and eventual customer recommendations.

| Unique product visitors who eventually purchase | Visitors required for 1,000 purchases |
| --- | ---: |
| 0.5% | 200,000 |
| 1% | 100,000 |
| 2% | 50,000 |
| 3% | 33,334 |

These are arithmetic scenarios. Tensorcraft has no measured conversion baseline. Campaign link clicks are not automatically unique product visitors, and return visits must not inflate the denominator. Use a defined 30-day observation window and report late sales separately.

A 12-18 month ambition is reasonable to investigate, not a forecast. Suppose the first 90 days produce 50 retained buyers. The remaining 950 would then take:

| Sustained new retained buyers per month after day 90 | Additional months | Approximate total elapsed time |
| --- | ---: | ---: |
| 25 | 38 | 41 months |
| 75 | 13 | 16 months |
| 150 | 7 | 10 months |

Reforecast monthly from actual sales. A launch spike is useful, but the plan must work in ordinary weeks.

## 5. Stage one: earn the first 10 purchases

**Working target: 10 retained buyers in the first 30 days.** This is a target to test the offer, not a predicted yield from the activity below.

1. Recruit JavaScript engineers who have recently expressed an interest in learning ML. Start with relevant personal contacts if available. Otherwise, participate in two existing communities and arrange recruitment with their hosts. Avoid unsolicited bulk messages.
2. Send 30 individually relevant invitations over two weeks. Explain that the free sample is available and the complete course costs $50 before asking them to try it.
3. Observe five compensated discovery sessions at $20 each. Pay for time regardless of opinion. Keep these participants separate from the sales cohort; compensation must not be presented as purchase evidence.
4. Invite additional interested people to try it independently. Ask what they hope to learn, what they tried before, where the explanation loses them, and what would make the full course worth buying.
5. Offer the normal $50 product to people who find the sample useful. Offer a bounded, shared onboarding session for early buyers if there is capacity. Describe its actual date and scope; do not create an ongoing coaching obligation at this price.
6. Follow up once with people who asked for it. Record purchases, reasons for declining, refund reasons and the exact source of each conversation.
7. Contact buyers who opted into follow-up after a week. Find out what they completed and what stopped them. Ask permission before publishing a quote or project.

The five compensated sessions are a small marketing discovery round. They do not replace the existing independent review or formal 12-20-person learner pilot.

After 30 relevant invitations, a low response count first calls for a better recruiting venue or invitation. After 20 people have meaningfully tried the sample and discussed the $50 offer, zero purchases calls for interviews about the outcome, workload and value. Do not respond automatically with a price cut or more traffic. These are diagnostic rules, not statistical tests.

## 6. Stage two: reach 50 through repeatable distribution

**Working target: 50 cumulative retained buyers by day 90.** Run three connected activities, then concentrate on the one or two that produce buyers who use the course.

### A. Publish one useful technical piece every two weeks

Write around a real problem, include working code and a visible result, explain a limitation, and link to the relevant free activity. Publish on Tensorcraft where the current blog supports the piece, then adapt for DEV with a canonical link to the original. If the digest-shaped blog makes an evergreen tutorial cumbersome, begin on DEV; a publishing-system rebuild is not a prerequisite.

| First six pieces | Source material | Call to action |
| --- | --- | --- |
| “A tensor adds shape and a cleanup obligation to your JavaScript array” | Free lesson one | Try the tensor exercise |
| “Reshape and transpose can give you the same shape and different data” | Channel-layout experiment | Try the changed packet yourself |
| “Why a model changes its answer when you scale its inputs differently” | Free normalization lesson | Explore normalization, then see Deep Orbit's syllabus |
| “A neuron starts with a weighted sum you can write with reduce” | Neural-networks lesson | Show the worked example, link to the free course |
| “How random splits can mislead you on a stream of sensor readings” | Data loading and recurrent networks | Explain the task, link to the free foundations |
| “What belongs beside model.json when you ship a model” | Runtime and capstone material | Show the artifact contract and full course outcome |

Each piece also supplies one 30-60 second clip and two short posts. Use one social network where relevant conversations can actually be found. Do not commit to daily posts across every platform.

Use the product's distinct visual style in clips. Make code and the result legible; an art-only trailer does not demonstrate the learning method. A paid-lesson excerpt should teach something complete, with the full exercise still clearly identified as paid.

### B. Pitch editorial coverage and guest teaching

Build a list of 20 relevant editors, community hosts and small JavaScript educators. Send five tailored pitches a week, each referencing an actual publication or session. Offer a working explanation, an experiment readers can try, or a guest lesson. Track replies and placements; a large audience is not guaranteed reach.

| Starting prospect | Proposed fit | First approach |
| --- | --- | --- |
| JavaScript Weekly | Tensor/array explanation or launch with a usable free course | Send the strongest finished piece to the published [Cooperpress editorial contact](https://cooperpress.com/contact/). |
| Node Weekly | Model preprocessing, evaluation or artifact contract explained with JavaScript | Pitch only a piece that is useful to Node readers. The course itself still teaches in the browser. |
| Frontend Focus | Browser inference, runtime behavior and visible experiments | Offer the browser-specific piece, not a general course announcement. |
| Reactiflux | JavaScript engineers interested in ML | Use the published contact route to ask whether a guest session fits; promotion permissions are not assumed. |
| Local JavaScript meetups and small teaching communities | A practical introduction their members can complete together | Find active hosts and upcoming sessions, then propose a free guest workshop. |

The publication topics above are supported by [Cooperpress's publication descriptions](https://cooperpress.com/publications/). Reactiflux describes its community and Q&A format on its [official site](https://www.reactiflux.com/). Placements, attendance and sales are all unproven.

Do not buy newsletter placements initially. A free review copy can help an editor evaluate the course; it does not count as a customer or guarantee coverage. No affiliate, coupon or revenue-share program is assumed to exist.

### C. Teach one partner-hosted session a month, then repeat if it sells

Proposed session: **“What changes when a JavaScript array becomes a tensor?”** Use the free exercises and channel-layout experiment. Target 40 minutes of teaching and ten minutes for questions. Rehearse before offering a duration promise.

Open with the eventual anomaly-detection system, then do one small foundation task. Let participants run it themselves. Explain what the paid course adds, show the $50 price and provide an optional purchase link. Nobody needs to buy to finish the session.

Use the host's existing audience and meeting tools. Send the resources through the host or to people who explicitly requested follow-up. Do not turn attendee lists into a mailing list without their agreement.

Record attendance, meaningful participation, purchases within 30 days and teaching/preparation hours. Two completed sessions with no buyers are a reason to inspect audience fit and the offer before scheduling more. A useful free workshop can still be an ineffective sales channel.

## 7. Stage three: turn 50 into 1,000

At 50 buyers, rank channels by retained customers, money spent and hours spent. Continue the strongest two. Keep interviews running with a few buyers and non-buyers each month.

The intended compounding assets are six to twelve useful tutorials, a workshop that hosts want to repeat, credible learner examples with permission, and relationships with educators who have seen the course work for their audience. Search may add traffic over time; do not assign it a sales quota before impressions and purchases appear.

An illustrative monthly workload that could supply 100 purchases is:

| Acquisition source | Required monthly volume | Assumed purchase rate | Purchases |
| --- | ---: | ---: | ---: |
| Partner/editorial referrals | 2,500 unique new visitors | 2% | 50 |
| Owned tutorials, search and social discovery | 2,000 unique new visitors | 2% | 40 |
| Partner workshops | 100 attendees new to Tensorcraft | 10% | 10 |
| Total | Disjoint cohorts | Unvalidated assumptions | 100 |

This is a capacity check, not a forecast or additive attribution report. Count a person once. Workshop attendance at this scale may require multiple hosts; editorial inclusion does not promise 2,500 visitors. At half the conversion, the same activity produces 50 purchases. Until a channel demonstrates its volume, leave its contribution uncertain.

If 100 purchases per month becomes repeatable, the remaining 950 after the initial 50 take about ten months. If channels only yield 25, the current plan needs a longer horizon or a material change in reach, available time or offer.

After a learner has completed something worth showing, invite them to share that actual work with a colleague. Track referral source manually at first. Certificates, stars and shares are supporting signals, not purchased users. A referral feature is unnecessary until people are recommending the product without one.

Make one Show HN submission when a fresh visitor can reliably run the free experience and the team can answer questions. HN explicitly favors usable products with few access barriers. Treat it as an experiment with no assumed sales contribution. [Show HN guidelines](https://news.ycombinator.com/showhn.html).

Product Hunt is optional and lower priority than the channels above. The old plan's coordinated-upvote instruction must not be used; Product Hunt prohibits asking for upvotes and coordinated voting. Do not budget around a ranking. [Official sharing guidance](https://help.producthunt.com/en/articles/2690626-how-do-i-share-my-post).

## 8. The $200 monthly budget

| Use | Month one | Later months |
| --- | ---: | ---: |
| Compensated usability/discovery sessions | $100: five at $20 | Up to $50 |
| One measured distribution experiment | $0 | Up to $100, only after initial real sales and attribution checks |
| Reserve for a demonstrated need | $100 | At least $50 |
| Maximum | $200 | $200 |

Spending is optional. Free publishing, existing recording tools and host-provided meeting rooms are enough to begin. Keep unused budget. A paid experiment can be a small relevant placement or another clearly priced way to reach the tested audience; obtain an actual quote and reject offers above the cap.

For later distribution tests, use a provisional cash acquisition ceiling of $20 per retained buyer. It is an operating limit, not a measured profitable CAC. Calculate an affordable ceiling from retained receipts minus fees, taxes, variable support and the contribution the business needs. Never treat the full $50 as advertising margin.

One $100 test needs at least five attributable retained buyers to meet the provisional ceiling. Close the 30-day attribution window and allow for the stated refund period before evaluating. A five-sale result is encouraging, not enough evidence to scale aggressively. Recheck after a second comparable test.

Measure founder time too: ten weekly hours are a substantial contribution. Track both cash per buyer and hours per buyer. Revenue reinvestment above $200 per month is outside the current budget and is not assumed.

## 9. Minimal funnel work

Do this alongside recruitment. None of it requires building a new world or growth platform.

Status, 2026-11-02 (details in the backlog's "First-1,000 funnel follow-ups"). Item 1 is partly verified. On desktop, production passed every guest step from the homepage through lesson one (failing and passing runs, completion kept after a reload) to the signed-out checkout redirect. An iPhone 13 profile covered the homepage, the consent banner, the hero CTA and the opening of lesson one. Stripe test mode accepted a Checkout Session built with the handler's exact parameters. Still open: entry from a campaign link, signup with guest-progress carry-over, a completed test-mode purchase and the access it grants. Item 2's note is drafted under the hero buttons and awaits owner approval, and its recording task is open. Item 4's tracker now wraps the landing hero, the landing closing CTA and the `/pricing` closing link, and checking it against the downstream events waits for the deploy. Item 5 has an optional Stripe Checkout question that turns on once the owner fills its option list.

1. Verify a fresh deployed guest path: campaign link, first exercise, saved progress, signup, pricing, checkout and access. Use test mode for the payment check. The existing launch record provides prior evidence, not verification of every current local edit.
2. Put “5 free lessons, no account required” close to the primary homepage CTA. Keep the existing headline. Record one real interaction and the eventual model output for distribution outside the homepage; the prior removal of the homepage demo was deliberate.
3. Use the existing [channel-layout entry](https://tensorcraft.app/worlds/deep-orbit/foundations/tensor-shapes?start=experiment) for a shape-specific article. Use [lesson one](https://tensorcraft.app/worlds/deep-orbit/foundations/introduction-to-tensors) for the general course invitation. Test both destinations with people; do not assume the deeper link supplies enough context.
4. Connect homepage free-CTA tracking and verify it against `lesson_started`, `exercise_completed`, `module_completed`, signup, checkout and purchase. Retain separate events for demonstrations and successful exercises.
5. Verify campaign attribution through signup and checkout. Current explicit Stripe metadata does not preserve it, although consented PostHog identity linking may already provide useful attribution. Check the real report before adding code. Until then, ask buyers optionally where they found Tensorcraft and keep “unknown” as a valid answer.
6. Check the actual Kit setup before depending on automation. For people who opt in, start with a welcome link, a useful next-lesson reminder, and a clear paid-course explanation after the free module. Suppress sales reminders after purchase and stop on unsubscribe. Update old duration and bridge-count claims first.
7. Collect permitted, specific buyer proof: the concept they understood, the task they completed and the artifact they can show. Keep assistance and compensation visible. Add this only when it exists.

Browser analytics are consent-gated. Report learning funnels for the consented cohort and describe that coverage limit. Do not divide all server-recorded purchases by only consented visitors and call it the site's conversion rate. For non-consenting visitors, do not add hidden tracking to fill the gap. First exercise passes, returns and completed lessons also do not establish independent mastery.

The current sitemap already includes free-module lessons even in its core phase. Check indexing and query data before changing it. Hundreds of speculative SEO pages would consume time without establishing purchase intent. [Sitemap implementation](../apps/web/app/sitemap.ts).

## 10. First two weeks and weekly rhythm

| When | Deliverable | Completion evidence |
| --- | --- | --- |
| Days 1-2 | Verify the opening funnel, record baseline, prepare one 45-second product clip and the buyer/source log | Fresh test record; playable clip; empty log with real definitions |
| Days 3-5 | First 15 relevant invitations; schedule discovery sessions; publish the tensor/array article | Actual invitations and replies; published article; no invented learner quotes |
| Days 6-7 | Observe initial sessions and fix the most repeated blocking issue | Observation notes with assistance recorded; retest the specific fix |
| Days 8-10 | Remaining 15 invitations; five tailored host/editor pitches; offer the normal course to interested learners | Responses, reasons and real purchase records |
| Days 11-14 | Finish five discovery sessions; publish shape experiment piece; review purchases; secure a workshop date if a host accepts | Two useful pieces; five observations; source-level review; confirmed date or recorded rejection |

This is roughly 20 hours of work across two weeks and assumes source material can be adapted efficiently. Scheduling depends on replies. Do not invent a session or placement to meet the calendar.

Proposed recurring ten-hour week: three hours on conversations and partner outreach, three on one article/clip workstream, two on a session or learner support, one on distribution in the chosen communities, and one on reviewing the scorecard. Publish every two weeks if a weekly article would reduce quality or leave no time for distribution.

Review each Friday:

| Record | Decision it supports |
| --- | --- |
| Relevant invitations, replies, pitches and accepted placements | Whether the audience can be reached |
| Unique tracked visitors, exercise completions and free-module completions by source | Where the learning funnel loses the observed cohort |
| New gross buyers, retained buyers, refunds and paid-course starts | Whether people buy and receive value |
| Cash spend and working hours by channel | What can be repeated within budget |
| Most common purchase reason and most common reason for declining | What the next article or product correction should address |

Use simple records initially. For the channel log: week, source, campaign, asset URL, cash, hours, visits where measurable, exercise completers, gross buyers, retained buyers and notes. Keep contact details and identifiable interview notes private, outside committed marketing documents.

Give each asset a consistent UTM, for example `utm_source=devto&utm_medium=article&utm_campaign=first1000&utm_content=tensor-shape-01`. Use distinct source names for partner sessions. For the paid-source ledger, choose one primary acquisition source per customer; record other influences separately. Do not add together competing last-click and assisted-conversion reports.

At this traffic level, run sequential message experiments and interviews. Splitting tiny samples into many A/B variants will rarely settle the decision.

## 11. Drafts ready to adapt

These drafts have not been sent or published. Public Tensorcraft copy follows the existing collective maker identity.

**Product description**

> Tensorcraft teaches machine learning to JavaScript engineers through a sci-fi mission. Work through executable exercises, learn to train and evaluate models, and build an anomaly-detection system. The first five lessons are free in your browser without an account. Deep Orbit costs $50 once.

**Invitation to an interested engineer**

> You mentioned wanting to understand [specific ML topic]. We're building Tensorcraft for JavaScript engineers learning ML. The first five lessons are free, and the complete Deep Orbit course is $50. Would you try the opening exercise and tell us where the explanation gets unclear? Here's the sample: [lesson link].

**Editorial pitch**

> We've published a JavaScript example showing why reshape and transpose can produce the same shape with different data. Readers can change the packet layout themselves in a free browser experiment. It includes the code and the point where the array analogy stops working. [Article link]. We built Tensorcraft, the course behind the example; its first five lessons are free. Would this fit [publication]?

**Community-host pitch**

> Would a practical introduction to tensors fit an upcoming [community] session? We can teach one exercise using JavaScript arrays, then let attendees test a channel-layout experiment in their browsers. The sample is free without an account. We make the $50 Deep Orbit course and would disclose that, with an optional course link at the end. Here's the exercise and a short recording: [links].

**Follow-up requested by a free learner**

> You tried [specific exercise]. What are you hoping to build with ML, and did the lesson help? Deep Orbit continues into network architecture, training, evaluation and deployment across 56 lessons. The full course is $50 once. Here's the syllabus: [pricing link]. If the sample missed what you needed, we'd like to understand why.

**Show HN title**

> Show HN: Tensorcraft, learn ML in JavaScript through a sci-fi mission

The accompanying maker comment should explain the product's actual origin, link to the free exercise, disclose the $50 offer and ask a specific learning-design question. Do not invent an origin story or claim learner results that do not exist.

## 12. Decisions after the first month

- If people buy and use the paid lessons, repeat the source that brought them and collect specific evidence of value.
- If qualified people try the free course but do not buy, investigate outcome, workload, trust and price separately. Test one change at a time.
- If people purchase but cannot progress, prioritize the observed learning or runtime problem before increasing distribution.
- If the offer works in conversations but publications and communities send little traffic, distribution is the limiting factor. Spend more of the available hours building host relationships and useful material they want to share.
- If the required weekly time is unavailable, reduce the content cadence and extend the horizon. The $200 monthly budget cannot substitute for the missing distribution work.

The proposed first step is a month of selling and observing the existing course, with 10 retained buyers as the first target. The 1,000-customer plan becomes credible when those purchases can be repeated through channels that fit the available time and money.
