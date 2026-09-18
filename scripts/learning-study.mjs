// Offline evidence preparation and descriptive summaries. No messages or account writes.
import { createHash } from "node:crypto";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const day = 86_400_000;
const categoryIds = ["teaching", "facts", "readability", "story", "assessment"];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fail = (message) => {
  throw new Error(message);
};
const requireValue = (condition, message) => {
  if (!condition) fail(message);
};
const date = (value) => {
  requireValue(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)),
    "Use a valid ISO date/time with timezone.",
  );
  requireValue(/(?:Z|[+-]\d{2}:\d{2})$/.test(value), "Dates need a timezone.");
  return Date.parse(value);
};
const text = (value) => typeof value === "string" && value.trim().length > 0;
const strings = (value) => Array.isArray(value) && value.every(text);
const evidence = (value) => strings(value) && value.length > 0;
const scores = (value) =>
  Array.isArray(value) &&
  value.length === 5 &&
  value.every((v) => Number.isInteger(v) && v >= 0 && v <= 2);
const sum = (values) => values.reduce((a, b) => a + b, 0);
const bools = (object, keys) =>
  keys.every((key) => typeof object[key] === "boolean");
const count = (rows, predicate) => rows.filter(predicate).length;
const independent = (reviewers, id) =>
  reviewers.some(
    (r) =>
      r.id === id &&
      r.wroteReviewedMaterial === false &&
      text(r.expertise) &&
      text(r.relationships),
  );

function validateReviewers(reviewers) {
  requireValue(Array.isArray(reviewers), "Reviewers must be an array.");
  const ids = new Set();
  for (const reviewer of reviewers) {
    requireValue(
      text(reviewer.id) && !ids.has(reviewer.id),
      "Reviewer IDs must be unique and nonempty.",
    );
    ids.add(reviewer.id);
  }
}
function drift(snapshot) {
  requireValue(
    Array.isArray(snapshot) && snapshot.length > 0,
    "Missing frozen source snapshot.",
  );
  const seen = new Set();
  const changed = snapshot
    .filter((item) => {
      requireValue(
        text(item.path) &&
          !item.path.includes("..") &&
          !item.path.startsWith("/") &&
          /^[a-f0-9]{64}$/.test(item.sha256) &&
          !seen.has(item.path),
        "Invalid or duplicate snapshot entry.",
      );
      seen.add(item.path);
      const path = join(root, item.path);
      return !existsSync(path) || sha(readFileSync(path)) !== item.sha256;
    })
    .map((item) => item.path);
  const manifest = JSON.parse(
    readFileSync(
      join(root, "docs/audits/content-review-manifest.json"),
      "utf8",
    ),
  );
  const expected = new Set(
    [...manifest.artifacts, ...manifest.supportingArtifacts].map(
      (item) => item.path,
    ),
  );
  for (const path of expected)
    if (!seen.has(path)) changed.push(`Missing from frozen coverage: ${path}`);
  for (const path of seen)
    if (!expected.has(path))
      changed.push(`Outside current review coverage: ${path}`);
  return changed;
}

export function summarizeReview(record) {
  validateReviewers(record.reviewers);
  const sourceChanges = drift(record.snapshot);
  const expected = new Set(record.snapshot.map((item) => item.path));
  requireValue(
    Array.isArray(record.artifacts) &&
      record.artifacts.length === expected.size,
    "Review coverage must match the frozen snapshot.",
  );
  let subjectComplete = 0,
    editorialComplete = 0;
  const openFindings = [];
  for (const artifact of record.artifacts) {
    requireValue(
      expected.delete(artifact.path),
      "Unknown or duplicate artifact review.",
    );
    for (const role of ["subject", "editorial"]) {
      const review = artifact[role];
      requireValue(
        review &&
          ["pending", "complete"].includes(review.status) &&
          Array.isArray(review.findings),
        "Invalid artifact review status.",
      );
      for (const finding of review.findings) {
        requireValue(
          ["minor", "major", "blocking"].includes(finding.severity) &&
            ["open", "resolved"].includes(finding.status) &&
            text(finding.description) &&
            evidence(finding.evidence),
          "Findings need severity, status, description and evidence.",
        );
        if (finding.status === "resolved")
          requireValue(
            text(finding.resolution),
            "Resolved findings need a fix and recheck record.",
          );
        else openFindings.push({ path: artifact.path, role, ...finding });
      }
      if (review.status === "complete") {
        requireValue(
          independent(record.reviewers, review.reviewerId) &&
            evidence(review.evidence),
          "Completed review requires independent reviewer disclosure and evidence.",
        );
        if (role === "subject") subjectComplete++;
        else editorialComplete++;
      }
    }
  }
  requireValue(
    Array.isArray(record.categories) &&
      record.categories.length === categoryIds.length &&
      new Set(record.categories.map((c) => c.id)).size === categoryIds.length,
    "Provide each course category exactly once.",
  );
  const categories = record.categories.map((category) => {
    requireValue(categoryIds.includes(category.id), "Unknown course category.");
    requireValue(
      Array.isArray(category.criteria) && category.criteria.length === 5,
      "Each category needs five scores or five pending nulls.",
    );
    if (category.criteria.every((v) => v === null))
      return {
        id: category.id,
        score: null,
        status: "awaiting_independent_score",
      };
    requireValue(
      scores(category.criteria) &&
        independent(record.reviewers, category.reviewerId) &&
        evidence(category.evidence) &&
        evidence(category.criterionEvidence) &&
        category.criterionEvidence.length === 5,
      "Scored categories need five anchored scores, criterion evidence and an independent reviewer.",
    );
    const total = sum(category.criteria);
    return {
      id: category.id,
      score: total,
      status: total >= 9 ? "score_threshold_met" : "needs_revision",
    };
  });
  const coverageComplete =
    subjectComplete === record.artifacts.length &&
    editorialComplete === record.artifacts.length;
  return {
    kind: "review-summary",
    artifacts: record.artifacts.length,
    subjectComplete,
    editorialComplete,
    sourceChanges,
    openFindings,
    categories,
    acceptance:
      sourceChanges.length === 0 &&
      coverageComplete &&
      new Set(
        record.artifacts.flatMap((a) => [
          a.subject.reviewerId,
          a.editorial.reviewerId,
        ]),
      ).size >= 2 &&
      openFindings.every((f) => f.severity === "minor") &&
      categories.every((c) => c.score >= 9)
        ? "review_thresholds_met"
        : "not_accepted",
    limitations:
      "Human judgments require evidence inspection. Price, ROI, market reach and observed learner outcomes are not certified by this summary.",
  };
}

function validateObservation(observation, enrolledAt, asOf) {
  requireValue(
    date(observation.observedAt) >= enrolledAt &&
      date(observation.observedAt) <= asOf,
    "Observation date is outside enrollment/as-of bounds.",
  );
  requireValue(
    strings(observation.assistance) &&
      evidence(observation.evidence) &&
      Number.isFinite(observation.activeMinutes) &&
      observation.activeMinutes >= 0,
    "Observation needs explicit help, time and evidence.",
  );
}
export function summarizePilot(record) {
  requireValue(
    ["draft", "collecting", "closed"].includes(record.state),
    "Invalid study state.",
  );
  validateReviewers(record.reviewers);
  const sourceChanges = drift(record.snapshot);
  const asOf = date(record.asOf);
  const protocolReady =
    text(record.startsAt) &&
    text(record.endsAt) &&
    text(record.ownerContact) &&
    text(record.consentRetention) &&
    text(record.compensation) &&
    Number.isFinite(record.weeklyHours) &&
    record.weeklyHours > 0;
  let start = Infinity,
    end = -Infinity;
  if (protocolReady) {
    start = date(record.startsAt);
    end = date(record.endsAt);
    requireValue(end > start, "Study end must follow start.");
  }
  requireValue(
    record.state === "draft" || protocolReady,
    "Complete protocol dates, workload, contact, retention and compensation before collecting.",
  );
  requireValue(
    record.state !== "closed" || asOf >= end + 33 * day,
    "Follow-up windows are still open.",
  );
  requireValue(
    Array.isArray(record.participants),
    "Participants must be an array.",
  );
  requireValue(
    record.state !== "draft" || record.participants.length === 0,
    "Freeze the protocol before enrollment.",
  );
  const ids = new Set();
  for (const learner of record.participants) {
    requireValue(
      /^P[0-9]{3}$/.test(learner.id) && !ids.has(learner.id),
      "Use unique pseudonymous IDs such as P001.",
    );
    ids.add(learner.id);
    requireValue(
      learner.consented === true &&
        learner.newToMl === true &&
        ["browser", "node", "both"].includes(learner.jsBackground) &&
        typeof learner.outsideOwnerNetwork === "boolean",
      "Participant consent, eligibility and background are required.",
    );
    const enrolled = date(learner.enrolledAt);
    requireValue(
      enrolled >= start && enrolled <= end && enrolled <= asOf,
      "Enrollment is outside the declared study window.",
    );
    if (learner.courseCompletedAt)
      requireValue(
        date(learner.courseCompletedAt) >= enrolled &&
          date(learner.courseCompletedAt) <= asOf,
        "Invalid completion date.",
      );
    if (learner.firstModule) {
      requireValue(
        bools(learner.firstModule, [
          "started",
          "completed",
          "authorIntervention",
        ]) &&
          (!learner.firstModule.completed || learner.firstModule.started),
        "Invalid first-module record.",
      );
      validateObservation(learner.firstModule, enrolled, asOf);
    }
    for (const key of ["early", "final"])
      if (learner[key]) {
        const project = learner[key];
        validateObservation(project, enrolled, asOf);
        requireValue(
          scores(project.scores) &&
            strings(project.blockers) &&
            independent(record.reviewers, project.reviewerId) &&
            bools(project, [
              "runnable",
              "failureExplained",
              "freshChangeCompleted",
              "solutionRevealed",
            ]),
          "Project score needs a declared independent reviewer, five scores, blockers and observed checks.",
        );
      }
    for (const key of ["pre", "post", "delayed"])
      if (learner[key]) {
        const form = learner[key];
        validateObservation(form, enrolled, asOf);
        requireValue(
          Array.isArray(form.correct) &&
            form.correct.length === 5 &&
            form.correct.every((v) => typeof v === "boolean"),
          "Concept checks need five observed correctness judgments.",
        );
        if (key === "delayed")
          requireValue(
            learner.courseCompletedAt &&
              date(form.observedAt) >= date(learner.courseCompletedAt),
            "Delayed check requires prior course completion.",
          );
      }
    if (learner.pre && learner.post)
      requireValue(
        date(learner.post.observedAt) >= date(learner.pre.observedAt),
        "Post-task cannot precede the pre-task.",
      );
    if (learner.post && learner.delayed)
      requireValue(
        date(learner.delayed.observedAt) >= date(learner.post.observedAt),
        "Delayed task cannot precede the post-task.",
      );
    if (learner.reading) {
      validateObservation(learner.reading, enrolled, asOf);
      requireValue(
        bools(learner.reading, ["passageExplained", "storyConsequence"]),
        "Reader observation needs both judgments.",
      );
    }
    if (learner.followup) {
      requireValue(
        learner.courseCompletedAt &&
          date(learner.followup.observedAt) >=
            date(learner.courseCompletedAt) &&
          date(learner.followup.observedAt) <= asOf,
        "Follow-up needs a valid date after completion.",
      );
      requireValue(
        bools(learner.followup, ["usedProject", "artifactObserved"]) &&
          evidence(learner.followup.evidence) &&
          (!learner.followup.artifactObserved || learner.followup.usedProject),
        "Follow-up needs use/observation judgments and evidence.",
      );
    }
  }
  const learners = record.participants;
  const rate = (numerator, denominator, threshold = null) => ({
    numerator,
    denominator,
    percent: denominator
      ? Number(((100 * numerator) / denominator).toFixed(1))
      : null,
    status: !denominator
      ? "no_evidence"
      : record.state !== "closed"
        ? "collecting"
        : threshold === null
          ? "descriptive"
          : numerator / denominator >= threshold
            ? "met"
            : "not_met",
  });
  const onTime = (learner) =>
    learner.courseCompletedAt && date(learner.courseCompletedAt) <= end;
  const inWindow = (learner, field, from, to) =>
    learner.courseCompletedAt &&
    learner[field] &&
    date(learner[field].observedAt) - date(learner.courseCompletedAt) >=
      from * day &&
    date(learner[field].observedAt) - date(learner.courseCompletedAt) <=
      to * day;
  const projectPass = (project) =>
    project &&
    sum(project.scores) >= 8 &&
    project.blockers.length === 0 &&
    project.runnable &&
    date(project.observedAt) <= end;
  const early = learners.filter((p) => p.early);
  const earlyPass = count(
    early,
    (p) => projectPass(p.early) && !p.early.solutionRevealed,
  );
  const starters = learners.filter((p) => p.firstModule?.started);
  const completers = learners.filter(onTime);
  const delayed = completers.filter((p) => inWindow(p, "delayed", 6, 8));
  const readings = learners.filter((p) => p.reading);
  const followup = completers.filter((p) => inWindow(p, "followup", 27, 33));
  const paired = learners.filter((p) => p.pre && p.post);
  const gates = {
    firstModule: rate(
      count(
        starters,
        (p) =>
          p.firstModule.completed &&
          !p.firstModule.authorIntervention &&
          date(p.firstModule.observedAt) <= end,
      ),
      starters.length,
      0.8,
    ),
    earlyTransfer: rate(earlyPass, early.length, 0.8),
    finalProject: rate(
      count(
        learners,
        (p) =>
          onTime(p) &&
          projectPass(p.final) &&
          p.final.failureExplained &&
          p.final.freshChangeCompleted,
      ),
      learners.length,
      0.7,
    ),
    delayedReturn: rate(delayed.length, completers.length, 0.75),
    delayedConcepts: rate(
      count(delayed, (p) => count(p.delayed.correct, Boolean) >= 4),
      delayed.length,
      0.8,
    ),
    readingAndStory: rate(
      count(
        readings,
        (p) => p.reading.passageExplained && p.reading.storyConsequence,
      ),
      readings.length,
      0.8,
    ),
  };
  const cohortInRange = learners.length >= 12 && learners.length <= 20;
  const backgrounds = Object.fromEntries(
    ["browser", "node", "both"].map((background) => [
      background,
      count(learners, (p) => p.jsBackground === background),
    ]),
  );
  const outsideOwnerNetwork = count(learners, (p) => p.outsideOwnerNetwork);
  const recruitmentMet =
    cohortInRange &&
    backgrounds.browser + backgrounds.both > 0 &&
    backgrounds.node + backgrounds.both > 0 &&
    outsideOwnerNetwork > 0;
  return {
    kind: "pilot-summary",
    state: record.state,
    protocolReady,
    sourceChanges,
    enrolled: learners.length,
    cohortInRange,
    recruitmentMet,
    backgrounds,
    outsideOwnerNetwork,
    gates,
    earlyReach: rate(early.length, learners.length),
    earlyPassAmongEnrolled: rate(earlyPass, learners.length),
    courseCompletion: rate(completers.length, learners.length),
    lateCourseCompletions: count(
      learners,
      (p) => p.courseCompletedAt && !onTime(p),
    ),
    assistanceByStage: Object.fromEntries(
      [
        "firstModule",
        "early",
        "final",
        "pre",
        "post",
        "delayed",
        "reading",
      ].map((stage) => {
        const observations = learners.map((p) => p[stage]).filter(Boolean);
        return [
          stage,
          {
            observed: observations.length,
            assisted: count(observations, (o) => o.assistance.length > 0),
            activeMinutes: sum(observations.map((o) => o.activeMinutes)),
          },
        ];
      }),
    ),
    backgroundDiagnostics: Object.fromEntries(
      ["browser", "node", "both"].map((background) => {
        const group = learners.filter((p) => p.jsBackground === background);
        return [
          background,
          {
            enrolled: group.length,
            earlySubmitted: count(group, (p) => p.early),
            finalSubmitted: count(group, (p) => p.final),
            readersObserved: count(group, (p) => p.reading),
            readersPassingBoth: count(
              group,
              (p) => p.reading?.passageExplained && p.reading?.storyConsequence,
            ),
          },
        ];
      }),
    ),
    missing: {
      pre: learners.length - count(learners, (p) => p.pre),
      postAmongCompleters: completers.length - count(completers, (p) => p.post),
      firstModule: learners.length - count(learners, (p) => p.firstModule),
      early: learners.length - early.length,
      final: learners.length - count(learners, (p) => p.final),
      reading: learners.length - readings.length,
      delayed: completers.length - delayed.length,
      followup: completers.length - followup.length,
    },
    delayedOutsideWindow: count(
      learners,
      (p) => p.delayed && !inWindow(p, "delayed", 6, 8),
    ),
    unassistedDelayedPass: rate(
      count(
        delayed,
        (p) =>
          p.delayed.assistance.length === 0 &&
          count(p.delayed.correct, Boolean) >= 4,
      ),
      delayed.length,
    ),
    pairedConceptChecks: {
      count: paired.length,
      preCorrect: sum(paired.map((p) => count(p.pre.correct, Boolean))),
      postCorrect: sum(paired.map((p) => count(p.post.correct, Boolean))),
      possibleEach: paired.length * 5,
    },
    followup: {
      returned: rate(followup.length, completers.length),
      reportedUse: count(followup, (p) => p.followup.usedProject),
      artifactObserved: count(followup, (p) => p.followup.artifactObserved),
    },
    acceptance:
      record.state === "closed" &&
      sourceChanges.length === 0 &&
      recruitmentMet &&
      Object.values(gates).every((g) => g.status === "met")
        ? "diagnostic_thresholds_met"
        : "not_accepted",
    limitations:
      "Small diagnostic cohort; assistance and missing responses remain visible. No causal effectiveness, $70 value or market-size conclusion.",
  };
}

export function prepareStudy(output) {
  requireValue(
    !existsSync(output),
    "Output directory already exists; preserve prior study records.",
  );
  const manifest = JSON.parse(
    readFileSync(
      join(root, "docs/audits/content-review-manifest.json"),
      "utf8",
    ),
  );
  const paths = [...manifest.artifacts, ...manifest.supportingArtifacts].map(
    (item) => item.path,
  );
  const snapshot = paths.map((path) => ({
    path,
    sha256: sha(readFileSync(join(root, path))),
  }));
  const emptyReview = () => ({
    status: "pending",
    reviewerId: "",
    evidence: [],
    findings: [],
  });
  const review = {
    kind: "independent-review",
    version: 1,
    snapshot,
    reviewers: [],
    artifacts: paths.map((path) => ({
      path,
      subject: emptyReview(),
      editorial: emptyReview(),
    })),
    categories: categoryIds.map((id) => ({
      id,
      reviewerId: "",
      criteria: [null, null, null, null, null],
      criterionEvidence: [],
      evidence: [],
    })),
  };
  const pilot = {
    kind: "learner-pilot",
    version: 1,
    state: "draft",
    snapshot,
    asOf: new Date().toISOString(),
    startsAt: "",
    endsAt: "",
    weeklyHours: 5,
    ownerContact: "",
    consentRetention: "",
    compensation: "",
    reviewers: [],
    participants: [],
  };
  const participant = {
    id: "P001",
    consented: false,
    newToMl: null,
    jsBackground: "",
    outsideOwnerNetwork: null,
    enrolledAt: "",
    courseCompletedAt: null,
    withdrawalReason: null,
    firstModule: null,
    early: null,
    final: null,
    pre: null,
    post: null,
    delayed: null,
    reading: null,
    followup: null,
  };
  const blankObservation = () => ({
    observedAt: "",
    assistance: null,
    activeMinutes: null,
    evidence: [],
  });
  const blankProject = () => ({
    ...blankObservation(),
    reviewerId: "",
    scores: [null, null, null, null, null],
    blockers: null,
    runnable: null,
    failureExplained: null,
    freshChangeCompleted: null,
    solutionRevealed: null,
  });
  const templates = {
    instructions:
      "Copy a template only when the observation happens. Replace null with an observed value; [] for assistance/blockers means explicitly none. Keep original responses in the evidence records.",
    reviewer: {
      id: "",
      expertise: "",
      relationships: "",
      wroteReviewedMaterial: null,
    },
    firstModule: {
      ...blankObservation(),
      started: null,
      completed: null,
      authorIntervention: null,
    },
    early: blankProject(),
    final: blankProject(),
    conceptCheck: {
      ...blankObservation(),
      correct: [null, null, null, null, null],
    },
    reading: {
      ...blankObservation(),
      passageExplained: null,
      storyConsequence: null,
    },
    followup: {
      observedAt: "",
      usedProject: null,
      artifactObserved: null,
      evidence: [],
    },
  };
  mkdirSync(output, { recursive: true });
  for (const [name, value] of Object.entries({
    review,
    pilot,
    "participant-template": participant,
    "observation-templates": templates,
  }))
    writeFileSync(
      join(output, `${name}.json`),
      JSON.stringify(value, null, 2) + "\n",
    );
  return {
    artifacts: paths.length,
    output,
    status: "draft; no review or pilot results",
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [command, file] = process.argv.slice(2);
    requireValue(
      file && ["prepare", "summarize"].includes(command),
      "Usage: node scripts/learning-study.mjs prepare DIRECTORY | summarize RECORD.json",
    );
    if (command === "prepare")
      console.log(JSON.stringify(prepareStudy(resolve(file)), null, 2));
    else {
      const record = JSON.parse(readFileSync(file, "utf8"));
      requireValue(record.version === 1, "Unsupported record version.");
      requireValue(
        ["independent-review", "learner-pilot"].includes(record.kind),
        "Unknown study record kind.",
      );
      console.log(
        JSON.stringify(
          record.kind === "independent-review"
            ? summarizeReview(record)
            : summarizePilot(record),
          null,
          2,
        ),
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
