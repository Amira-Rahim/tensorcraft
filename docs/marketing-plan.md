# Tensorcraft marketing plan

Working proposal, updated November 11, 2026. This is the current marketing direction following the owner's request for a fresh strategy. It replaces the earlier first-1,000 plan as the planning baseline.

The owner confirmed a **$200 monthly marketing budget**. Existing audience size and available marketing hours are unknown. The first month assumes we must earn attention from people who have never heard of Tensorcraft. Targets below describe work and review points, not predicted reach or sales.

## 1. Strategic direction

The first encounter must explain the offer to someone who has never heard of Tensorcraft: an interactive machine-learning course for JavaScript engineers. Show a capability they might want to learn before introducing character names or tensor operations.

Use the [model-teaching preview](https://tensorcraft-cases.vercel.app/) as that entry. Visitors identify a generated pattern, compare their choice with a real model, label a separate example, and train again. Show the model's actual prediction on the same held-out pattern. Both labels must affect the real training result. These illustrative patterns are separate from Deep Orbit's fictional recordings.

After that payoff, a 14-second character film introduces Deep Orbit as Tensorcraft's first world. Explain that the free lessons begin with data preparation and the full course continues into model building, training, and evaluation. Keep the first-five-free scope and no-account offer visible.

Build a recurring campaign from these cases. Each case should work on its own and make the next part of the course easy to understand. The story supplies continuity across the campaign. The code and observed result explain the learning value.

The existing 15-second teaser introduces the setting and brand. The approved 27-second film gives interested viewers the wider explanation. The recurring cases give people a concrete reason to open Tensorcraft and send it to another engineer.

This is a positioning hypothesis. People may enjoy a puzzle without wanting a course. The first month must distinguish attention, participation, continued learning, and purchase.

## 2. Audience and message

Start with JavaScript engineers who are curious about ML and enjoy learning through visual experiments. They already know how to program. They want to understand what happens to data, how a model learns, and how to judge a result.

Creative coding communities are a plausible place to reach some of these people. Their interest in visual work does not establish willingness to buy ML education. Keep that distinction visible in the results.

Use this message as the campaign's factual foundation:

> Tensorcraft teaches machine learning through interactive story worlds and JavaScript exercises. Start with Deep Orbit, where you help a research crew investigate an unexplained signal. The first five lessons are free in your browser, with no account needed.

Keep the brand relationship consistent:

| Name | What it means in the campaign |
| --- | --- |
| Tensorcraft | The learning product and the recognizable publisher of every case. |
| Deep Orbit | Its first available world and the setting for the initial campaign. |
| Other worlds | Future settings and subjects, clearly marked coming soon. They are not part of the current purchase. |

Mention the paid continuation when it helps someone decide: Deep Orbit continues into model building, training, evaluation, and deployment. Local pricing is $79 introductory and $99 regular, paid once. Verify the deployed offer before publishing price-bearing copy. There is no scheduled offer deadline in the shared pricing source.

## 3. The recurring campaign

Use three initial cases from the free material. These are production briefs, not new homepage titles or promises of completion time.

| Case | Reason to pay attention | What people can do | Course connection |
| --- | --- | --- | --- |
| The sensor grouping | Two arrangements can contain the same readings while grouping them differently. Which one gives the crew a sensor's readings in time order? | Predict, run the two operations, and inspect the selected sensor and chart. | The free tensor-shapes activity. |
| The input shape | One extra level of nesting changes how the runtime describes the input. What does that dimension represent? | Edit a small input, run it, and connect its shape to the supplied readings. | The first free mission and its tensor explanation. |
| The input scale | The preprocessing used with a model matters to its predictions. What happens when it changes? | Change the input in the existing normalization interaction and inspect the actual result. | The free normalization lesson. Clearly identify any supplied model. |

Keep the [sensor-grouping case](https://tensorcraft-cases.vercel.app/sensor-grouping.html) as a supporting lesson preview. It shows data preparation, which is too indirect to carry the first product introduction on its own. The related free course activity also has an existing direct entry path:

`/worlds/deep-orbit/foundations/tensor-shapes?start=experiment`

This URL enters the concept step, not a standalone miniature. Check that a first-time visitor can find the demonstrated activity in the deployed version. Prefer a truthful link and brief orientation over a new campaign landing page.

Explain its connection to ML early: this case practices keeping the meaning of readings intact during data preparation. Follow it with the input-scale case so people also see model behavior. A successful array puzzle alone does not establish interest in learning ML.

Each edition has the same structure:

1. Open on the visual problem, such as the apparent sensor spike. Identify the Deep Orbit context briefly while showing the evidence.
2. Ask one answerable question. Show enough information for someone to reason about it.
3. Let the viewer predict, then show the actual code run and its result. Resolve the technical question in the edition itself.
4. Identify Tensorcraft and Deep Orbit. Invite people to try that exact activity, with the free-access scope beside the link.
5. Close with the next technical question the course addresses, without inventing a story discovery.

Produce one useful source artifact, then adapt it into a short screen recording, one still or question post, and a concise explanation. The proposed recording length is 20 to 40 seconds. Use the time needed to make the result legible. Show code and the result together where possible.

Use actual runs from the version people can open. Name supplied examples, fictional recordings, and supplied models. The first mission creates a tensor and visualizes readings. It does not train a model or establish the source of the unexplained signal.

### Curiosity in the opening

The first frame should give a stranger something specific to investigate before asking them to care about a course. For the sensor case, show the apparent spike and ask, "Did sensor A really spike?" Then show A's actual readings, let people predict the operation, and reveal which sensors supplied the misleading chart's values.

Resolve the question within the clip or public explanation. The destination offers hands-on control and a related learning task. It does not hold the answer behind a click or signup.

Test alternative openings sequentially using the same verified case. A broader opening is the apparent spike. A more technical opening is, "Both operations return four rows of three values. Why do they draw different charts?" Compare attention and course attempts within each channel, since view definitions and audiences differ across platforms.

Use the actual surprise as a reason someone might share the case with another engineer. Keep the connection to ML visible so the series attracts people interested in the learning product as well as the individual puzzle. No version should invent a physical anomaly or claim that this grouping task trains a model.

## 4. Distribution at scale

Prioritize public discovery and access to established audiences. Personal conversations can explain the response, while repeatable public releases supply the main acquisition experiment. Publishing on a new account does not guarantee viewers.

### Recurring discovery through Shorts and DEV

Create a vertical version of the case for YouTube Shorts. Recompose the chart, evidence, and code for a phone screen rather than cropping the landscape film. Open on the apparent spike, use readable captions, and deliver the reveal before inviting people into Tensorcraft. Shorts can appear in the Shorts feed, search, and the homepage, which provides a route beyond existing followers. Reach remains a test. [YouTube discovery guidance](https://support.google.com/youtube/answer/11914225?hl=en).

Use a channel-profile link for the playable destination. YouTube makes URLs in Shorts descriptions and comments non-clickable, so the invitation must reflect the actual path. Treat viewing and website participation separately. [YouTube link guidance](https://support.google.com/youtube/answer/13748639?hl=en).

Publish a complete visual explanation on DEV with the playable demonstration, actual code, result, and relevant JavaScript and ML tags. DEV offers topic-based discovery through Relevant, Latest, and Top feeds. Its editor supports embeds and recurring series. The article must be useful in place and clearly identify Tensorcraft's connection to the activity. [DEV feeds](https://dev.to/help/customizing-your-feed), [publishing and series](https://dev.to/help/writing-editing-scheduling).

These are the two recurring releases for each case. Adapt the same source material instead of producing unrelated content for every network. Use an existing relevant social audience if one is available, without adding another mandatory publishing cadence.

### Amplification through established developer audiences

Submit the finished experiment for editorial consideration at Cooperpress's relevant JavaScript publications. A single accepted feature can distribute the case to an existing audience. The pitch asks the editors to consider the case for their readers. It does not ask them to buy the course.

JavaScript Weekly issue 809 includes a JavaScript-to-neural-network demonstration, a concrete example of topic fit. Frontend Focus is another candidate when the case emphasizes the browser interaction. Placement and traffic are uncertain. Frontend Horse also received the November 10 pitch. Its archive ends at [issue 78](https://frontend.horse/issues/78/) and its curator describes it as on hiatus, so it gets no follow-up. [JavaScript Weekly example](https://javascriptweekly.com/issues/809), [Cooperpress contact](https://cooperpress.com/contact/).

Supply a finished playable URL, a clear image, and the short recording so a curator can understand and demonstrate the case quickly. A creator can use the same package for a public playthrough. Neither a free feature nor a sponsorship price is assumed.

The two pitches sent on November 10, 2026 link the cases host root with `utm_content=sensor-grouping`. The root now serves the model-teaching preview. A redirect in `output/marketing/tensorcraft-cases/vercel.json` sends requests with that value to `/sensor-grouping.html` and keeps their UTM parameters. If an editor publishes the link without those parameters, readers land on the model-teaching preview. Keep the rule while editors and readers can still open those emails. Before a shared URL serves a different page, add a redirect like this one for every link already sent.

### A distinct public launch through Show HN

Prepare a launch of the substantial Tensorcraft free experience, using the sensor case as a concrete entry point. Show HN is for runnable work, ideally without signup barriers, and has public discovery through its shownew and Show HN pages. Its rules reject landing-page-only submissions and quickly generated one-offs. Do not present a tiny demonstration as the entire product. [Show HN rules](https://news.ycombinator.com/showhn.html).

HN prohibits generated or AI-edited post and comment text and automated posting. The owner must write its launch text and discussion replies. This plan can supply a factual checklist and asset package. [HN guidelines](https://news.ycombinator.com/newsguidelines.html).

### The playable asset and CodePen discovery

Keep the full free activity on Tensorcraft. A small public CodePen can additionally make the experiment easy to inspect, embed, and share. CodePen's guidance favors visual work and recommends relevant tags and sharing through Bluesky or DEV. Staff featuring is discretionary. [CodePen picking guidance](https://blog.codepen.io/faq/how-are-picked-pens-chosen/).

Public Pens carry an automatic MIT license. Use an original demonstration intended for public reuse with compatible assets. If adaptation exceeds one working day, use the existing Tensorcraft activity and its recording. [CodePen licensing](https://blog.codepen.io/documentation/licensing/).

The first launch package therefore has one playable destination, a vertical clip, a complete DEV explanation, a still, and an editorial asset package. The three cases provide a recurring reason to encounter Tensorcraft, while a separate launch introduces the broader product.

## 5. First-month sequence

| Period | Marketing work | Reviewable output |
| --- | --- | --- |
| Week 1 | Finish the sensor case and its vertical recording. Prepare the DEV explanation, compatible public-demo version if adaptation fits the cap, and editorial asset package. Confirm the destination matches the recording. | One complete edition prepared for Shorts, DEV, and editorial consideration, with source-labelled links. |
| Week 2 | Release the first edition on Shorts and DEV. Submit the experiment to the relevant editors. Answer public technical questions. Give interested participants a direct next-lesson link and offer future cases only when requested. | Public asset URLs, observed attention and activity participation, editorial responses, and a clear continuation invitation. |
| Week 3 | Release the input-shape case. Let the response to the first edition shape its explanation. Prepare the factual assets for an owner-written Show HN launch of Tensorcraft's substantial free experience. | A second complete edition, a concrete next-lesson invitation, and a separate product-launch package. |
| Week 4 | Release the input-scale case. Show how the free tasks connect to the full Deep Orbit project. Review return visits, purchases, refunds, and work spent. | A third edition, a clear paid-continuation explanation, and a decision about the next month. |

This proposes three campaign editions in a month. If time is tight, finish two and spend the remaining time distributing them and talking to participants. A half-finished library of content has little marketing value.

Independent playthroughs are useful because they show where an explanation works or loses someone. Ask participants before recording or quoting them. Publish their actual experience, including relevant limitations. A person's permission to try the activity does not imply permission to publish their identity or comments.

## 6. The $200 budget

Begin with organic distribution and the assets we already have. Keep the first month's total expenditure at or below $200.

| Allocation | Ceiling | Release condition |
| --- | ---: | --- |
| One paid distribution test | $150 | A case has brought relevant people into the course with some observed continuation. One suitable paid placement or capped traffic campaign fits the available budget. |
| Contingency | $50 | A specific production or delivery obstacle prevents reuse of the winning case. |

The paid test is a conditional reserve, not a promised sponsorship purchase. Do not assume a creator or publication accepts $150. Select a placement for audience relevance and a concrete quote. An alternative is one capped traffic test of the strongest creative. Reddit's current setup guidance distinguishes lower-budget page-visit campaigns from its much larger purchase-optimization recommendation. Use a campaign spend cap and evaluate case participation, not a claim of optimized sales. A $150 test cannot establish reliable purchase economics. [Reddit campaign setup](https://business.reddithelp.com/articles/Knowledge/Set-up-a-Reddit-Ads-Campaign), [budgets and caps](https://business.reddithelp.com/s/article/How-much-do-Reddit-Ads-cost).

Use a clearly disclosed demonstration or sponsorship with its own destination link. Record the quote, actual spend, observed activity participation, and any later purchases. Avoid judging the test by video impressions alone.

Existing tools are sufficient for this pilot. New subscriptions, giveaways, discounts, and an affiliate system are outside the first month's scope.

## 7. Measurement and decisions

The main early signal is a relevant person doing something meaningful in the free activity. Return to another lesson and successful paid use make that signal stronger.

Keep these stages separate:

| Stage | Evidence to record | What it helps us decide |
| --- | --- | --- |
| Attention | Within-channel viewing, retention through the evidence and reveal, and specific replies about the question. | Whether the opening earns curiosity and the explanation sustains it. |
| Public-demo participation | Demonstration visits and actions where observable. | Whether the case itself invites participation. |
| Course handoff | Visits to the Tensorcraft activity, first attempts, and successful checks or exercise runs. | Whether interest in the case extends into the actual learning product. |
| Continuation | Return within seven days or a start in another free lesson. | Whether interest extends beyond an isolated puzzle. |
| Purchase and use | Verified paid orders, refunds, and a later paid-lesson start where observable. | Whether the course explanation attracts customers who use it. |
| Efficiency | Cash and marketing hours by edition and distribution route. | Whether we can repeat the work within the budget. |

Use one campaign name, such as `playable-cases-01`, with a source and content identifier for each link. Example:

`?start=experiment&utm_source=codepen&utm_medium=demo&utm_campaign=playable-cases-01&utm_content=sensor-grouping`

The application has exercise and experiment events, but their existence does not prove campaign-to-purchase reporting. Verify one real campaign entry through the consented event flow before reading source-level conversion rates. Respect analytics consent and report the resulting coverage limits. Use observed counts and voluntary feedback where the full path is unavailable. Reconcile purchases with actual payment records and keep refunds visible.

A public demo and Tensorcraft may not identify the same visitors. Report their counts separately when they cannot be matched. An unmatched visitor is not evidence of a drop-off.

Review the first three editions as a pilot. Small samples support interviews and directional decisions, not claims of a winning variant.

If no relevant placement happens and few intended readers encounter a case, call the test inconclusive. Low exposure says little about the case's appeal. Repeated attempts by suitable engineers followed by little course continuation are more useful evidence against this approach. Published asset counts alone do not establish success.

- If people watch but do not visit, change the invitation or clarify what they can do at the destination.
- If they visit but do not attempt anything, inspect the match between the clip and the first screen they reach.
- If they finish one activity but do not continue, test whether the broader course outcome matters to them.
- If they return but do not buy, ask about the paid outcome, workload, trust, and price before changing the offer.
- If distribution produces almost no relevant participation, seek a better host or venue before producing another batch of cases.

After the pilot, repeat the case format and distribution route that bring continued learning and paid use. If neither does, change the audience or message before increasing spend. No sales forecast is credible from the available information today.

## 8. Longer-term marketing

If the cases attract suitable learners, organize the best ones into a public collection that shows a progression from data preparation to a model someone can evaluate. Add selected learner explanations or independent playthroughs with permission.

Invite people who ask for future editions to opt into an existing appropriate follow-up channel. Build a recognizable series before creating a separate community space. Continue showing Tensorcraft as the product and Deep Orbit as the current world. Introduce another world through a real available activity when it is ready.

Use the recurring audience and demonstrated participation as the basis for a wider launch, additional editorial pitches, and any later paid distribution. The course's useful experience should be visible before the announcement asks for a purchase.

## 9. Basis for the proposal

Research checked November 10, 2026. External examples show formats and participation routes. They do not prove demand for Tensorcraft.

- [Brilliant's CS page](https://brilliant.org/cs/) already emphasizes interactive problem solving and feedback. Interactivity alone is a broad category claim. Tensorcraft should demonstrate its particular combination of JavaScript work and continuing story.
- [Scrimba's AI Engineer Path](https://scrimba.com/the-ai-engineer-path-c02v) presents a practical JavaScript route into AI applications. Tensorcraft's campaign can make its own model-building and evaluation experience concrete without claiming competitors lack useful practice.
- [TensorFlow.js](https://www.tensorflow.org/js) already provides tutorials and browser demonstrations. Browser ML availability alone does not explain the value of a paid course. The campaign needs to show how Tensorcraft's sequence, feedback, and story help someone work through a task.
- [The Coding Train's Passenger Showcase](https://thecodingtrain.com/guides/passenger-showcase-guide) connects learning material with projects participants make and share. That is a useful participation pattern to adapt. Its submission process ties projects to specific Coding Train videos, so it is not a general Tensorcraft promotion directory.

Local facts checked: [pricing and launch status](../packages/shared/src/constants.ts), [direct lesson entry](../apps/web/app/worlds/%5Bslug%5D/%5Bmodule%5D/%5Blesson%5D/page.tsx), [channel activity](../apps/web/app/components/mdx/channel-layout-experiment.tsx), [events](../apps/web/lib/analytics-events.ts), and [consent-gated analytics](../apps/web/lib/posthog.ts). The approved films and current homepage changes remain local until deployed.
