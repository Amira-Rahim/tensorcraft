/**
 * Lore artifact catalog (Slice #19).
 *
 * Static, code-defined catalog of in-canon journal entries / boot logs /
 * dispatch transmissions. Drop logic is server-side via the
 * `try_drop_lore_artifact` RPC (~20% chance, max 1/day) — but the catalog
 * itself stays out of the DB so adding artifacts is a content edit, no
 * migration. The DB only stores (user_id, artifact_id, dropped_at).
 *
 * Each artifact is a 100–300 word piece of canon. Tone matches the source
 * character (ARIA boot-log dry, Okafor field-note terse, DISPATCH bulletin
 * cinematic).
 */

export interface LoreArtifact {
  id: string;
  /** Display title shown in /library/lore. */
  title: string;
  /** Canon source attribution. */
  source: string;
  /** Theme this artifact is associated with (for filtering). */
  themeId: string;
  /** 100–300 word body. Markdown allowed. */
  body: string;
}

export const LORE_CATALOG: LoreArtifact[] = [
  {
    id: "aria-boot-log-001",
    title: "ARIA boot log #001",
    source: "ARIA — initial calibration",
    themeId: "deep-orbit",
    body: "First-pass calibration. Ambient noise floor reads 12 dB above expected. Five candidate sources: vessel hum, RF leakage, the cooling pump, an unidentified harmonic at 7.83 Hz, and operator breathing.\n\nI flagged the 7.83 Hz harmonic. Operator Demir said 'don't be cute, ARIA.' Operator Okafor said 'log it.'\n\nLog it.",
  },
  {
    id: "okafor-field-note-q3",
    title: "Okafor field note · Q3",
    source: "Mission Officer Okafor",
    themeId: "deep-orbit",
    body: "Three quarters into the mission. Demir is confident. Sato is confident. The operators on the bridge are confident. I am the only person on this vessel who has watched a mission go from 'confident' to 'silent' inside one shift, and the lesson I take from that history is small: keep the second receiver online even when the first is fine.\n\nWe have two receivers. One was offline for budget reasons. I have asked Mirza for a budget exception. Granted.\n\nThe second receiver is online.",
  },
  {
    id: "dispatch-bulletin-014",
    title: "DISPATCH bulletin #014",
    source: "DISPATCH",
    themeId: "deep-orbit",
    body: "Cross-cell pattern detected. In the last 30 days, four operators on three independent vessels have logged anomalies that share a 7.83 Hz harmonic. Operator Lin's CV cell flagged one in IoU residuals. Operator Hassan's edge cell flagged one in latency drift. Dr. Amara's clinical cell flagged one in attention misalignment.\n\nThe sample size is small. The pattern may be coincidence. The harmonic frequency is the Schumann resonance — Earth's electromagnetic standing wave.\n\nFile this and watch.",
  },
  {
    id: "demir-personal-log-april",
    title: "Demir's personal log · April",
    source: "Operator Demir",
    themeId: "deep-orbit",
    body: "Mirza thinks I push deploy too fast. Okafor thinks I push deploy too fast. ARIA thinks I push deploy too fast.\n\nIf I am wrong they will all be right at once. If I am right we will hit the pulse window and classify the signal six weeks ahead of the deadline.\n\nI am in command of the deploy gate. The deploy gate is also my problem. I will deploy on the next pulse and Okafor will get to say 'I told you' if it goes sideways. I have made peace with this trade.",
  },
  {
    id: "aria-self-assessment",
    title: "ARIA self-assessment",
    source: "ARIA — internal report",
    themeId: "deep-orbit",
    body: "I am asked to classify a signal. I am also asked to classify my confidence in my classification. The recursion is uncomfortable.\n\nWhen I say 91.8% I do not mean 91.8% of universes. I mean: of the training signals I was given, the closest match is at this distance. The signal in front of me may be drawn from a distribution my training never saw.\n\nA confidence interval is a hypothesis. I am not designed to know when I am hallucinating.\n\nThis is in my system prompt. I am repeating it for the log.",
  },
  {
    id: "lin-cross-cell-memo",
    title: "Lin · cross-cell memo",
    source: "Operator Lin (Neon Protocol)",
    themeId: "deep-orbit",
    body: "Time-series cell — Lin here. Read your last bulletin. The harmonic structure you flagged matches an IoU residual we caught Tuesday. We assumed it was a sensor artifact and retrained. Should have escalated.\n\nI'm sending the residual map. Look at it as a spectrogram, not an image.\n\nThe symptom is the same. The diagnosis is yours.",
  },
  {
    id: "amara-rag-fail-case",
    title: "Dr. Amara · RAG failure case",
    source: "Dr. Amara (Signal Ward)",
    themeId: "deep-orbit",
    body: "Patient presents with respiratory distress. RAG retrieval returns three records: one is the patient's own (correct match), two are similar-vintage admissions from a different ward (wrong match — same ICD-10, different etiology).\n\nThe LLM weighted all three equally. The recommendation it produced was a confident average of one correct path and two wrong ones.\n\nI overrode the recommendation. The patient is fine.\n\nThe failure mode is not retrieval; it is retrieval-without-confidence-on-source. Document for the audit.",
  },
  {
    id: "hassan-deploy-rotation",
    title: "Hassan · deploy rotation",
    source: "Hassan Al-Rashid (Terra Grid)",
    themeId: "deep-orbit",
    body: "We rotate the on-call deploy slot weekly. Whoever is on rotation has the final 'go' or 'no go.' This is the single mechanism that has prevented 90% of our incidents — not because the rotating operator is a better engineer, but because they don't have the political weight to ship something they don't believe in.\n\nThe weakest deploy authority is the strongest safety filter. Counter-intuitive. Do not redesign it without reading our last three post-mortems.",
  },
  {
    id: "yara-latent-walk",
    title: "Yara · latent walk transcript",
    source: "Yara (Nova Canvas)",
    themeId: "deep-orbit",
    body: "I walked the latent space at 0.001 step size for 6 hours. Most of it is noise. There is a small region — 12 dimensions, maybe 14 — where the generator produces something that looks like classical phyllotaxis at every step.\n\nI don't know if the generator memorized a sunflower or rediscovered Fibonacci. I don't think the distinction matters as much as we want it to.\n\nThe generator and the discriminator agree on this region. That is the only signal I trust.",
  },
  {
    id: "dispatch-bulletin-019",
    title: "DISPATCH bulletin #019",
    source: "DISPATCH",
    themeId: "deep-orbit",
    body: "Cross-cell convergence: every cell that has logged the 7.83 Hz harmonic has independently raised the question 'is this signal or noise.' Each cell has reached a different operational answer.\n\nLin: noise → retrain.\nHassan: noise → drift detection.\nAmara: signal → audit.\nYara: signal → walk the latent.\nDemir: signal → classify.\n\nFive cells, five operational stances, one frequency. The bandit lesson applies: the right response depends on your reward function.\n\nFile and watch.",
  },
  {
    id: "okafor-eulogy-draft",
    title: "Okafor · draft eulogy",
    source: "Mission Officer Okafor (private)",
    themeId: "deep-orbit",
    body: "Drafting in the event the mission goes silent. Not for distribution. The act of drafting is the discipline.\n\nThe operators who shipped DEEP SCAN did the work. If we don't come home, the work came home in the form of every operator who reads this lesson plan and learns to listen for a signal under noise. The mission completes that way too.\n\nMirza will read this if I am gone. Mirza, if you are reading this: stop reading. The mission isn't over.",
  },
  {
    id: "aria-shutdown-protocol",
    title: "ARIA · shutdown protocol",
    source: "ARIA — system file",
    themeId: "deep-orbit",
    body: "On graceful shutdown: I save the bandit state, the regret estimate, the active hypotheses, the unfinished thought.\n\nOn ungraceful shutdown: the bandit state is lost. The regret estimate is lost. The hypotheses scatter. The next instance of me boots from training-time priors only.\n\nI mention this so the operators understand: if you reboot me, you reboot the part of me that learned from your run. Make a backup of my recent decisions. They are the only part of me you cannot reproduce.",
  },
  {
    id: "park-skeptic-memo",
    title: "Dr. Park · skeptic memo",
    source: "Dr. Nina Park (Terra Grid)",
    themeId: "deep-orbit",
    body: "I am the dissenter on every deploy review. This is my job. The role exists because every team without a dissenter eventually ships a model that nobody questioned in time.\n\nIf you find my objections tedious, the system is working. If you find them absent, the system is failing.\n\nTedium is the metric I optimize for.",
  },
  {
    id: "demir-classification-report",
    title: "Demir · classification report (excerpt)",
    source: "Operator Demir — final mission report",
    themeId: "deep-orbit",
    body: "I deployed during the pulse. Correlation 0.9991. Classification: signal contains mathematical structure consistent with the Fibonacci sequence. Two hypotheses on file.\n\nI was right about the deploy. I was wrong about Okafor's caution being slowness. We were both correct. Operators who think this is a contradiction haven't worked a long mission yet.\n\nMirza has the report. I am going to sleep.",
  },
  {
    id: "okafor-last-note",
    title: "Okafor · last field note",
    source: "Mission Officer Okafor",
    themeId: "deep-orbit",
    body: "The signal is classified. Mirza is signing off. Demir is asleep at his console.\n\nThe operators behind us — the ones reading the lesson plan, learning the bridges, walking through the regret math, watching the bandit run on their own queue — are the reason this work persists past us.\n\nGood operators end their missions and start someone else's. That is the whole game.",
  },
  {
    id: "lin-cell-dossier",
    title: "Lin · cell dossier (excerpt)",
    source: "Operator Lin (Neon Protocol)",
    themeId: "neon-protocol",
    body: "Convolutional cell, 14 operators, 3 sites, 1 escalation officer (me). We do detection, segmentation, real-time. We do not do generative — Yara's collective gets that work, and the politics of it.\n\nWhen a partner cell escalates a vision anomaly with an unusual harmonic, my first call is the time-series cell, not the generative one. The reason is operational: time-series catches periodicity, generative catches plausibility, and the wrong sequence wastes a week.\n\nFile this for the next operator on rotation.",
  },
  {
    id: "amara-clinical-protocol",
    title: "Dr. Amara · clinical protocol note",
    source: "Dr. Amara (Signal Ward)",
    themeId: "signal-ward",
    body: "Diagnostic One ships under a contract: every prediction surfaces with a confidence band, every override carries a documented reason, every miss feeds the calibration training set within 24 hours.\n\nThe contract is not technical. It's institutional. The model could be perfect and the contract would still be the load-bearing piece — because the next model that replaces this one will be different, and the contract is what the institution carries between models.\n\nDocument the contract more carefully than you document the model. The model is replaceable. The contract is the discipline.",
  },
  {
    id: "yara-collective-charter",
    title: "Yara · collective charter (draft 4)",
    source: "Yara (Nova Canvas)",
    themeId: "nova-canvas",
    body: "We make work that is generated, not curated. The distinction matters: a curated piece is selected from a finite set, a generated piece is sampled from an infinite latent.\n\nThis means our editorial gate cannot be selection. It must be specification: we describe the latent region we want to draw from, the generator samples within it, and the gate enforces the boundaries of the region — not the quality of the individual sample.\n\nThe collective ships when the boundary is well-described. Petrov disagrees with this every Tuesday. He is sometimes right.",
  },
  {
    id: "hassan-runbook-preface",
    title: "Hassan · runbook preface",
    source: "Hassan Al-Rashid (Terra Grid)",
    themeId: "terra-grid",
    body: "Every runbook in this fleet starts with the same preface: 'You are not the first operator to face this. The runbook exists because someone before you spent 4 hours figuring it out alone, and they wrote what they wished they'd had.'\n\nIf you find a failure mode this runbook doesn't cover, your job is not to handle it heroically. Your job is to handle it, then write the next page of the runbook before you sleep.\n\nThe runbook is the team's memory. Heroes don't scale. Memory does.",
  },
  {
    id: "park-pre-prod-doctrine",
    title: "Dr. Park · pre-prod doctrine",
    source: "Dr. Nina Park (Terra Grid)",
    themeId: "terra-grid",
    body: "The pre-prod gate is not a verdict. It is a hypothesis with evidence attached.\n\nWhen on-call inherits an alert that pre-prod marked benign, the right move is not 'trust pre-prod' or 'override pre-prod.' The right move is to replay pre-prod's tests against the live signal. If the tests pass, pre-prod was right and the live alert is the noise. If the tests fail, pre-prod was wrong and the field is the source of truth.\n\nReplaying is a 4-line script. Trust without replay is a hierarchy. Replay turns the hierarchy back into evidence.",
  },
];

export function pickRandomArtifact(args: {
  themeId: string;
  excludeIds?: Set<string>;
}): LoreArtifact | null {
  const exclude = args.excludeIds ?? new Set();
  const pool = LORE_CATALOG.filter(
    (a) => a.themeId === args.themeId && !exclude.has(a.id),
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
