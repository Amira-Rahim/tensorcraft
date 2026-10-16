/** Small deterministic teaching systems. No downloaded weights or timing claims. */
export function fitScaler(rows: readonly number[][]) {
  const width = rows[0]?.length;
  if (
    !width ||
    rows.some((r) => r.length !== width || r.some((x) => !Number.isFinite(x)))
  )
    throw new Error("Expected finite rectangular training rows");
  const mean = rows[0].map(
    (_, j) => rows.reduce((s, r) => s + r[j], 0) / rows.length,
  );
  const std = mean.map((m, j) =>
    Math.sqrt(rows.reduce((s, r) => s + (r[j] - m) ** 2, 0) / rows.length),
  );
  return { mean, std };
}
export const TRAINING_ROWS = [
  [20, 0],
  [20, 2],
  [24, 0],
  [24, 2],
];
export const SAVED_SCALER = fitScaler(TRAINING_ROWS);
export function standardize(row: number[], scaler = SAVED_SCALER) {
  if (
    row.length !== scaler.mean.length ||
    scaler.std.length !== row.length ||
    [...row, ...scaler.mean, ...scaler.std].some((x) => !Number.isFinite(x)) ||
    scaler.std.some((x) => x < 0)
  )
    throw new Error("Row and scaler must share finite feature dimensions");
  return row.map((x, j) => (x - scaler.mean[j]) / (scaler.std[j] || 1));
}
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export function fixedNeuron(row: number[]) {
  return sigmoid(0.6 * row[0] - 0.8 * row[1] + 0.1);
}
export interface LabeledScore {
  score: number;
  positive: boolean;
}
export const VALIDATION_SCORES: LabeledScore[] = [
  ...[0.85, 0.8, 0.6, 0.5, 0.2].map((score) => ({ score, positive: true })),
  ...[
    0.65,
    0.55,
    0.45,
    ...Array.from({ length: 13 }, (_, i) => (i + 1) * 0.02),
  ].map((score) => ({ score, positive: false })),
];
export const HELD_OUT_SCORES: LabeledScore[] = [
  ...[0.85, 0.68, 0.3].map((score) => ({ score, positive: true })),
  ...[0.76, 0.55, 0.25, 0.2, 0.14, 0.1, 0.02].map((score) => ({
    score,
    positive: false,
  })),
];
export function policyMetrics(
  rows: LabeledScore[],
  threshold: number,
  reviewCost: number,
  missCost: number,
) {
  if (
    ![threshold, reviewCost, missCost].every(Number.isFinite) ||
    reviewCost < 0 ||
    missCost < 0 ||
    rows.some((r) => !Number.isFinite(r.score))
  )
    throw new Error("Expected finite scores and nonnegative costs");
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const r of rows) {
    const alert = r.score > threshold; // equality does not alert
    if (r.positive) {
      if (alert) tp++;
      else fn++;
    } else if (alert) fp++;
    else tn++;
  }
  return {
    tp,
    fp,
    tn,
    fn,
    precision: tp + fp ? tp / (tp + fp) : 0,
    recall: tp + fn ? tp / (tp + fn) : 0,
    f1: 2 * tp + fp + fn ? (2 * tp) / (2 * tp + fp + fn) : 0,
    cost: fp * reviewCost + fn * missCost,
  };
}
export function gradientTrace(rate: number, start = 4, target = 0) {
  const rows = [{ step: 0, weight: start, loss: 0.5 * (start - target) ** 2 }];
  for (let i = 1; i <= 4; i++) {
    const w = rows[i - 1].weight;
    const next = w - rate * (w - target);
    rows.push({ step: i, weight: next, loss: 0.5 * (next - target) ** 2 });
  }
  return rows;
}
export function spectrum(samples: number, padded = false) {
  if (![32, 64, 128].includes(samples))
    throw new Error("Unsupported teaching window");
  const size = samples * (padded ? 2 : 1),
    sampleRate = 128;
  const signal = Array.from(
    { length: samples },
    (_, i) =>
      Math.sin((2 * Math.PI * 10 * i) / sampleRate) +
      0.5 * Math.sin((2 * Math.PI * 12 * i) / sampleRate),
  );
  // Direct DFT agrees with FFT values; small fixed limits keep browser work bounded.
  const bins = Array.from({ length: size / 2 + 1 }, (_, k) => {
    let re = 0,
      im = 0;
    signal.forEach((x, i) => {
      re += x * Math.cos((2 * Math.PI * k * i) / size);
      im -= x * Math.sin((2 * Math.PI * k * i) / size);
    });
    return {
      hz: (k * sampleRate) / size,
      magnitude: Math.hypot(re, im) / samples,
    };
  });
  return {
    signal,
    bins,
    gridSpacing: sampleRate / size,
    nativeSpacing: sampleRate / samples,
    seconds: samples / sampleRate,
  };
}
export const KEYS = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const VALUES = [
  [10, 0],
  [0, 10],
  [5, 5],
];
export function attention(query: number[]) {
  if (query.length !== 2 || query.some((x) => !Number.isFinite(x)))
    throw new Error("Expected a finite query [2]");
  const scores = KEYS.map((k) => query[0] * k[0] + query[1] * k[1]);
  const max = Math.max(...scores),
    exp = scores.map((s) => Math.exp(s - max));
  const sum = exp.reduce((a, b) => a + b, 0),
    weights = exp.map((x) => x / sum);
  const value = [0, 1].map((j) =>
    VALUES.reduce((s, v, i) => s + weights[i] * v[j], 0),
  );
  return { scores, weights, value };
}
export type CacheMode = "exact" | "rounded" | "unversioned";
export function cacheReplay(mode: CacheMode, model: number, scaler: number) {
  const cache = new Map<string, number>();
  let calls = 0;
  const requests = [
    [0.499, 1, 1],
    [0.501, 1, 1],
    [0.501, 1, 1],
    [0.501, model, scaler],
  ];
  const rows = requests.map(([input, m, s]) => {
    const key = JSON.stringify([
      ...(mode === "unversioned" ? [] : [m, s]),
      mode === "rounded" ? Number(input.toFixed(2)) : input,
    ]);
    const expected = sigmoid(
      100 * (input + (s === 2 ? 0.01 : 0) - 0.5) + (m === 2 ? 0.2 : 0),
    );
    const hit = cache.has(key);
    if (!hit) {
      calls++;
      cache.set(key, expected);
    }
    const returned = cache.get(key)!;
    return {
      input,
      model: m,
      scaler: s,
      key,
      hit,
      expected,
      returned,
      wrong: Math.abs(expected - returned) > 1e-10,
    };
  });
  return { rows, calls, hits: rows.length - calls };
}

export const EXPERIMENTS = {
  normalization: {
    title: "Keep the model and scaler together",
    lesson: "normalization",
  },
  threshold: {
    title: "Choose what an alert costs",
    lesson: "threshold-tuning",
  },
  "learning-rate": {
    title: "Watch a weight overshoot",
    lesson: "gradient-descent",
  },
  fft: { title: "Change the observation window", lesson: "fourier-transform" },
  attention: {
    title: "Follow a query into the value vector",
    lesson: "beyond-lstm",
  },
  cache: { title: "Find the cache collision", lesson: "caching-strategies" },
} as const;
export type ExperimentId = keyof typeof EXPERIMENTS;
export type ExperimentPhase = "prediction" | "changed_case";
export interface ExperimentOutcome {
  correct: boolean;
  assisted: boolean;
}
export interface ExperimentRecord {
  first: ExperimentOutcome | null;
  latest: ExperimentOutcome | null;
  count: number;
  help: boolean;
}
export interface ExperimentDraft {
  version: 1;
  phase: ExperimentPhase;
  settings: number[];
  answer: string;
  revealed: boolean;
  result: ExperimentOutcome | null;
  prediction: ExperimentRecord;
  changed_case: ExperimentRecord;
  frozen: number[] | null;
}
export const SETTING_OPTIONS: Record<ExperimentId, number[][]> = {
  normalization: [
    [20, 22, 24, 28],
    [0, 1, 2],
    [0, 1, 2],
  ],
  threshold: [
    [0.2, 0.4, 0.7, 1],
    [1, 5],
    [1, 10],
  ],
  "learning-rate": [[0.1, 0.5, 2.2]],
  fft: [
    [32, 64, 128],
    [0, 1],
  ],
  attention: [[0, 1, 2]],
  cache: [
    [0, 1, 2],
    [1, 2],
    [1, 2],
  ],
};
export const DEFAULT_SETTINGS: Record<ExperimentId, number[]> = {
  normalization: [24, 2, 1],
  threshold: [0.4, 1, 1],
  "learning-rate": [0.5],
  fft: [32, 0],
  attention: [0],
  cache: [0, 1, 1],
};
export function experimentDraft(id: ExperimentId): ExperimentDraft {
  const record = (): ExperimentRecord => ({
    first: null,
    latest: null,
    count: 0,
    help: false,
  });
  return {
    version: 1,
    phase: "prediction",
    settings: [...DEFAULT_SETTINGS[id]],
    answer: "",
    revealed: false,
    result: null,
    prediction: record(),
    changed_case: record(),
    frozen: null,
  };
}
export function parseExperimentDraft(
  raw: string,
  id: ExperimentId,
): ExperimentDraft {
  if (raw.length > 4000) throw new Error("Draft too large");
  const d = JSON.parse(raw) as ExperimentDraft;
  const validSettings = (s: unknown): s is number[] =>
    Array.isArray(s) &&
    s.length === SETTING_OPTIONS[id].length &&
    s.every((x, i) => SETTING_OPTIONS[id][i].includes(x));
  const outcome = (x: ExperimentOutcome | null) =>
    x === null ||
    (!!x && typeof x.correct === "boolean" && typeof x.assisted === "boolean");
  const record = (r: ExperimentRecord) =>
    !!r &&
    Number.isInteger(r.count) &&
    r.count >= 0 &&
    r.count <= 20 &&
    typeof r.help === "boolean" &&
    outcome(r.first) &&
    outcome(r.latest) &&
    (r.count === 0) === (r.first === null) &&
    (r.count === 0) === (r.latest === null) &&
    // Every submitted attempt reveals feedback for the next attempt.
    (r.count === 0 || r.help === true) &&
    (r.count !== 1 ||
      (r.first?.correct === r.latest?.correct &&
        r.first?.assisted === r.latest?.assisted));
  if (
    !d ||
    d.version !== 1 ||
    !["prediction", "changed_case"].includes(d.phase) ||
    !validSettings(d.settings) ||
    typeof d.answer !== "string" ||
    d.answer.length > 80 ||
    typeof d.revealed !== "boolean" ||
    !outcome(d.result) ||
    !record(d.prediction) ||
    !record(d.changed_case) ||
    !(d.frozen === null || (id === "threshold" && validSettings(d.frozen))) ||
    (id === "threshold" && d.phase === "changed_case" && d.frozen === null)
  )
    throw new Error("Incompatible experiment draft");
  const current = d[d.phase];
  if (
    (d.revealed && !current.help) ||
    (d.result !== null &&
      (current.count === 0 ||
        d.result.correct !== current.latest?.correct ||
        d.result.assisted !== current.latest?.assisted)) ||
    (id === "threshold" &&
      d.frozen !== null &&
      d.settings.some((setting, i) => setting !== d.frozen![i]))
  )
    throw new Error("Incompatible experiment feedback or frozen policy");
  return Object.fromEntries(
    Object.keys(experimentDraft(id)).map((k) => [
      k,
      d[k as keyof ExperimentDraft],
    ]),
  ) as unknown as ExperimentDraft;
}
export function matchNumbers(answer: string, expected: number[]) {
  const parts = answer.trim().split(/[\s,]+/);
  return (
    parts.length === expected.length &&
    parts.every(
      (p, i) =>
        /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(p) &&
        Number.isFinite(Number(p)) &&
        Math.abs(Number(p) - expected[i]) <= 0.005,
    )
  );
}
export function experimentExpected(
  id: ExperimentId,
  d: ExperimentDraft,
): number[] {
  const changed = d.phase === "changed_case",
    [a, b, c] = changed && id === "threshold" ? d.frozen! : d.settings;
  switch (id) {
    case "normalization":
      return changed
        ? standardize([26, 3])
        : c === 0
          ? [a, b]
          : c === 1
            ? standardize([a, b])
            : [0, 0];
    case "threshold":
      return [
        policyMetrics(changed ? HELD_OUT_SCORES : VALIDATION_SCORES, a, b, c)
          .cost,
      ];
    case "learning-rate":
      return [
        gradientTrace(changed ? 0.5 : a, changed ? -3 : 4, changed ? 1 : 0)[1]
          .weight,
      ];
    case "fft":
      return changed ? [1, 2] : [spectrum(a, b === 1).gridSpacing];
    case "attention":
      return changed
        ? attention([0, 2]).value
        : [
            attention(
              [
                [1, 0],
                [0, 1],
                [-1, 0],
              ][a],
            ).scores[0],
          ];
    case "cache":
      return [
        cacheReplay(
          changed
            ? "exact"
            : (["exact", "rounded", "unversioned"] as CacheMode[])[a],
          changed ? 2 : b,
          changed ? 2 : c,
        ).calls,
      ];
  }
}
