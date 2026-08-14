# Distribution Launch Copy (drafts, 2026-08-11)

Ready-to-paste copy for the two account-creation items in Tier 1-OPS
(`docs/launch-blockers.md`): the Product Hunt "upcoming" page and the
@tensorcraft X account. Voice rules applied: brand speaks as a group of
frontend engineers (no personal names, per the identity policy), checkable
numbers only, no em dashes, no claims the audits removed (no
"production-ready model" phrasing, no all-five-worlds bundle talk while
only Deep Orbit is live).

## Product Hunt "upcoming" page

- **Name:** Tensorcraft
- **Tagline (54 chars):** Learn ML in the browser, using the JS you already know
- **Description (~250 chars):** A story-driven ML course for frontend
  engineers. 55 lessons aboard a deep-space research vessel, every concept
  bridged to a frontend primitive you already use, every exercise graded
  against real TensorFlow.js in your browser. Module 1 is free.
- **Topics:** Education, Developer Tools, Artificial Intelligence, Web App
- **First comment (post on launch day, from the brand account):**
  We are a group of frontend engineers who kept bouncing off ML courses
  written for Python people. So we built the course we wanted: every
  concept anchored to something a JS developer already knows (typed arrays
  to tensors, expect() to loss functions, static deploys to model
  shipping). Every analogy is graded by how far it actually holds. The
  first module is free and runs a real model in your browser. We would
  like to hear where the bridges break for you.

## X account @tensorcraft

- **Bio (156 chars):** ML for frontend engineers. Story-driven course, real
  TensorFlow.js in your browser, every FE-to-ML analogy graded by how far
  it holds. Module 1 free.
- **Location:** The Archimedes, Proxima Centauri
- **Link:** tensorcraft.app
- **Pinned post:** You have spent years building mental models: components,
  memoization, build pipelines. Most of them transfer to ML if someone
  tells you exactly where each one stops holding. That is the whole
  product. Module 1 is free, in your browser, no Python.
  tensorcraft.app
- **First-week posts (one per day, order flexible):**
  1. `expect(actual).toBe(expected)` is a loss function with the
     resolution turned down. Your assertion returns pass/fail; a loss
     function returns a distance. Training is making that assertion fail
     less. (Link: cross-entropy blog post)
  2. The standard explanation for why classification uses cross-entropy
     instead of MSE is wrong. At a confidently wrong prediction, MSE's
     gradient is the largest it ever gets. What flattens is the sigmoid in
     front of it. Every number checkable with a calculator: (link)
  3. A model file is a static asset. It ships in dist/ next to your
     fonts. Until the day you roll back, and learn that reverting weights
     does not revert the world they were trained on. (Link: fonts post)
  4. We grade every FE-to-ML analogy in our course into three tiers by
     how far it holds, and we published the audit, including what we got
     wrong. Analogies are load-bearing; a bad one costs you a debugging
     week. (Link: the analogy-audit post)
  5. Rule-based systems fail on the case nobody wrote a rule for. That
     sentence is why you are debugging that if/else cascade, and it is
     the entire premise of our course's story. Module 1 is free: (link)
- **Cadence note:** account exists to predate launch (handle risk +
  §10b announcement); daily posting can wait until the launch window.

## Reminders for whoever creates the accounts

- No personal names, bylines, or photos anywhere (identity policy,
  2026-07-25). Brand avatar: the wordmark or ARIA glyph on #1C1C1C.
- Do not schedule the launch-week email blast until domain warmup is done
  (see the email warmup item in Tier 1-OPS).
- The drafted blog posts this copy referenced were removed on 2026-08-14;
  every blog post will be written by hand from here on. Hold posts 1
  through 4 until the hand-written replacements are live, then paste
  their URLs. Post 5 links only the site, so it can run any time.
