import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";

const round = (value: number) => Math.round(value * 1000) / 1000;
const range = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  step = 1,
): InvestigationControl => ({
  id,
  label,
  initial,
  min,
  max,
  step,
  kind: "range",
});
const choice = (
  id: string,
  label: string,
  labels: string[],
  initial = 0,
  values = labels.map((_, i) => i),
): InvestigationControl => ({
  id,
  label,
  initial: values[initial] ?? initial,
  kind: "choice",
  options: labels.map((label, i) => ({ label, value: values[i]! })),
});
const cells = (
  label: string,
  values: Array<number | string>,
  labels?: string[],
  highlight?: number[],
  columns = 2,
): InvestigationGraphic => ({
  kind: "cells",
  label,
  values,
  labels,
  highlight,
  columns,
});
const pipe = (
  label: string,
  values: string[],
  highlight?: number[],
): InvestigationGraphic => ({ kind: "pipeline", label, values, highlight });
const line = (
  label: string,
  values: number[],
  scaleGroup: string,
  highlight: number[] = [],
  labels = values.map((_, i) => String(i)),
): InvestigationGraphic => ({
  kind: "line",
  label,
  values: values.map(round),
  labels,
  highlight,
  scaleGroup,
});
const spectra = new WeakMap<number[], number[]>();
/** Unscaled one-sided DFT reference. TFJS exercises compute their own rFFT. */
export function taskMagnitudes(samples: number[]): number[] {
  const cached = spectra.get(samples);
  if (cached) return cached;
  const values = samples.map(Math.fround);
  const out = Array.from(
    { length: Math.floor(values.length / 2) + 1 },
    (_, bin) => {
      let real = 0,
        imaginary = 0;
      for (let i = 0; i < values.length; i++) {
        const angle = (2 * Math.PI * bin * i) / values.length;
        real += values[i]! * Math.cos(angle);
        imaginary -= values[i]! * Math.sin(angle);
      }
      return Math.hypot(real, imaginary);
    },
  );
  spectra.set(samples, out);
  return out;
}
export const taskTone = (
  n: number,
  rate: number,
  hz: number,
  amplitude = 1,
  phase = 0,
) =>
  Array.from(
    { length: n },
    (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / rate + phase),
  );
const sumTones = (n: number, rate: number, components: number[][]) =>
  Array.from({ length: n }, (_, i) =>
    components.reduce(
      (value, [hz, amplitude]) =>
        value + amplitude! * Math.sin((2 * Math.PI * hz! * i) / rate),
      0,
    ),
  );
const catalog = [
  [5, 0.8],
  [12, 0.6],
  [23, 0.4],
  [47, 0.2],
];
const baseline = sumTones(512, 256, catalog);
export const VIEW_TASK_CASES = {
  standard: {
    label: "Added weak tone",
    samples: sumTones(512, 256, [...catalog, [73.4, 0.05]]),
    bin: 147,
  },
  changed: {
    label: "Missing background component",
    samples: sumTones(
      512,
      256,
      catalog.filter(([hz]) => hz !== 47),
    ),
    bin: 94,
  },
  quiet: {
    label: "Quieter added tone",
    samples: sumTones(512, 256, [...catalog, [73.4, 0.01]]),
    bin: 147,
  },
  identical: { label: "Identical capture", samples: baseline, bin: 147 },
  offset: {
    label: "Constant offset",
    samples: baseline.map((value) => value - 0.5),
    bin: 0,
  },
  rotated: {
    label: "Circular time shift",
    samples: baseline.map((_, i) => baseline[(i + 137) % 512]!),
    bin: 94,
  },
};
export const FFT_TASK_CASES = {
  standard: {
    label: "One-second 5 Hz tone",
    samples: taskTone(128, 128, 5),
    rate: 128,
    bin: 5,
  },
  changed: {
    label: "7 Hz with a constant offset",
    samples: taskTone(128, 128, 7).map((value) => value + 5),
    rate: 128,
    bin: 0,
  },
  offBin: {
    label: "Isolated 7.3 Hz tone",
    samples: taskTone(128, 128, 7.3),
    rate: 128,
    bin: 7,
  },
  silence: {
    label: "Silent four-sample check",
    samples: [0, 0, 0, 0],
    rate: 8,
    bin: 1,
  },
  tied: {
    label: "Equal-magnitude impulse check",
    samples: [1, 0, 0, 0],
    rate: 8,
    bin: 1,
  },
  longer: {
    label: "Two-second 5 Hz tone",
    samples: taskTone(256, 128, 5),
    rate: 128,
    bin: 10,
  },
};
export const FRAME_TASK_CASES = {
  standard: {
    label: "Supplied 40 Hz burst",
    samples: Array.from({ length: 256 }, (_, i) =>
      i >= 64 && i < 128 ? Math.sin((2 * Math.PI * 40 * i) / 256) : 0,
    ),
    frame: 1,
    bin: 10,
  },
  changed: {
    label: "20 Hz then 60 Hz",
    samples: Array.from({ length: 256 }, (_, i) =>
      Math.sin((2 * Math.PI * (i < 128 ? 20 : 60) * i) / 256),
    ),
    frame: 2,
    bin: 15,
  },
  chord: {
    label: "Both tones throughout",
    samples: sumTones(256, 256, [
      [20, 1],
      [60, 0.5],
    ]),
    frame: 0,
    bin: 5,
  },
  offBin: {
    label: "22 Hz between frame bins",
    samples: taskTone(256, 256, 22),
    frame: 0,
    bin: 5,
  },
  short: {
    label: "Shorter than one frame",
    samples: [1, 2, 3],
    frame: 0,
    bin: 0,
  },
};
const frameCache = new Map<string, number[][]>();
export function taskFrames(
  caseId: keyof typeof FRAME_TASK_CASES,
  windowSize: number,
  hop: number,
): number[][] {
  const key = `${caseId}:${windowSize}:${hop}`;
  const cached = frameCache.get(key);
  if (cached) return cached;
  const samples = FRAME_TASK_CASES[caseId].samples;
  const rows: number[][] = [];
  for (let start = 0; start + windowSize <= samples.length; start += hop)
    rows.push(taskMagnitudes(samples.slice(start, start + windowSize)));
  frameCache.set(key, rows);
  return rows;
}
export const FEATURE_TASK_CASES = {
  standard: {
    label: "52 Hz and 72 Hz diagnostic",
    samples: sumTones(64, 256, [
      [52, 1],
      [72, 0.5],
    ]).map(
      (_, i) =>
        Math.sin((2 * Math.PI * 52 * i) / 256 + 0.45) +
        0.5 * Math.sin((2 * Math.PI * 72 * i) / 256 + 0.45),
    ),
    rate: 256,
  },
  changed: {
    label: "22 Hz diagnostic at another rate",
    samples: taskTone(64, 128, 22, 0.75, 0.45),
    rate: 128,
  },
};
export function taskBand(rate: number, band: number): [number, number] {
  return band === 2
    ? [0, rate / 2]
    : rate === 256
      ? band === 1
        ? [52, 72]
        : [50, 82]
      : band === 1
        ? [22, 22]
        : [20, 24];
}
export const symmetricHann = (n: number) =>
  Array.from(
    { length: n },
    (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))),
  );
export const TAPER_TASK_CASES = {
  standard: {
    label: "10.5 cycles in 128 samples",
    samples: taskTone(128, 128, 10.5),
    cycles: 10.5,
    sample: 32,
  },
  changed: {
    label: "20.5 cycles in 64 samples",
    samples: taskTone(64, 64, 20.5),
    cycles: 20.5,
    sample: 16,
  },
};
const taperedCases = Object.fromEntries(
  Object.entries(TAPER_TASK_CASES).map(([id, item]) => [
    id,
    item.samples.map(
      (value, i) => value * symmetricHann(item.samples.length)[i]!,
    ),
  ]),
) as Record<keyof typeof TAPER_TASK_CASES, number[]>;

export const SIGNAL_TASK_INVESTIGATIONS: Record<
  string,
  LessonInvestigationSpec
> = {
  "time-vs-frequency": {
    title: "The first differing spectral bin",
    brief:
      "Follow the supplied two-second capture pair. Inspect matching samples and bins, then apply their separate limits.",
    boundary:
      "These are the coding task's synthetic 512-sample checks at 256 Hz, separate from the eleven-day mission recording. The reference computes raw magnitudes with float32 inputs and float64 accumulation in JavaScript numbers. The task's TFJS FFT returns float32, so tiny rounding residues can differ. The activity cutoff starts at 0.5 to avoid treating those residues as a component. A differing bin identifies a comparison to investigate, not a physical source.",
    controls: [
      { ...range("bin", "Bin to inspect", 147, 0, 256) },
      range("sample", "Sample to inspect", 100, 0, 511),
      range("threshold", "Raw-magnitude difference cutoff", 5, 0.5, 20, 0.5),
      range("tolerance", "Sample difference tolerance", 0.05, 0, 0.1, 0.01),
    ],
    cases: Object.entries(VIEW_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description:
        "Same supplied background: 5, 12, 23, and 47 Hz. Compare this diagnostic variant with it.",
      values: { bin: item.bin },
    })),
    prediction: {
      prompt:
        "What is the first bin whose magnitude difference exceeds the current cutoff? Use -1 for none.",
      tolerance: 0,
    },
    evaluate: ({ bin, sample, threshold, tolerance }, caseId) => {
      const suspect =
        VIEW_TASK_CASES[caseId as keyof typeof VIEW_TASK_CASES].samples;
      const a = taskMagnitudes(baseline),
        b = taskMagnitudes(suspect);
      const differences = a.map((value, i) => Math.abs(value - b[i]!));
      const first = differences.findIndex((value) => value > threshold);
      const timeTwin = baseline.every(
        (value, i) => Math.abs(value - suspect[i]!) <= tolerance,
      );
      return {
        graphics: [
          line(
            "Baseline samples at 256 samples per second",
            baseline,
            "comparison-samples",
            [sample],
          ),
          line(
            "Suspect samples in the same time order",
            suspect,
            "comparison-samples",
            [sample],
          ),
          line("Baseline raw FFT magnitudes", a, "comparison-raw-magnitude", [
            bin,
          ]),
          line("Suspect raw FFT magnitudes", b, "comparison-raw-magnitude", [
            bin,
          ]),
          cells(
            "Selected bin comparison",
            [
              bin,
              bin * 0.5,
              round(a[bin]!),
              round(b[bin]!),
              round(differences[bin]!),
              threshold,
            ],
            [
              "Bin",
              "Bin center (Hz)",
              "Baseline raw magnitude",
              "Suspect raw magnitude",
              "Absolute magnitude difference",
              "Strict difference cutoff",
            ],
          ),
          pipe("Two comparisons on different scales", [
            `Sample ${sample}: absolute gap ${round(Math.abs(baseline[sample]! - suspect[sample]!))}, tolerance ${tolerance}`,
            `Every sample inside tolerance: ${timeTwin}`,
            `First raw-magnitude gap > ${threshold}: ${first}`,
            first < 0
              ? "No bin exceeds this cutoff"
              : `Bin center: ${(first * 256) / 512} Hz`,
          ]),
        ],
        answer: first,
        answerLabel: "First divergent bin",
        explanation: `N=512 at 256 Hz gives 0.5 Hz bin spacing. Bin ${bin} differs by about ${round(differences[bin]!)} raw magnitude units. Scan in bin order, including DC at 0, using a strict > ${threshold} comparison. The first matching bin is ${first}. The separate sample check uses <= ${tolerance} and returns ${timeTwin}. A circular shift can change samples while preserving magnitude, because magnitude omits phase.`,
        code: `// Values from this computed reference comparison.\nconst selectedBin = ${bin};\nconst baselineMagnitude = ${a[bin]};\nconst suspectMagnitude = ${b[bin]};\nconst selectedDifference = Math.abs(baselineMagnitude - suspectMagnitude);\nconst firstDivergentBin = ${first};\nconst timeTwin = ${timeTwin};`,
      };
    },
  },
  "fourier-transform": {
    title: "Samples, eligible magnitudes, and hertz",
    brief:
      "Inspect a supplied FFT check. Keep the largest computed non-DC bin, then convert its index with this capture's sample rate and length.",
    boundary:
      "These are the exercise's diagnostic captures. Their raw FFT heights are not the rescaled 64 Hz two-tone reference. The hull array's 256 Hz rate and the longer mission discovery remain separate. This reference trains no model and identifies no physical source.",
    controls: [
      {
        ...range("bin", "Selected bin index", 5, 0, 128),
        maxFor: (values) => values.samples! / 2,
      },
    ],
    cases: Object.entries(FFT_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description: `${item.samples.length} supplied samples at ${item.rate} Hz. Exclude DC when choosing a winner.`,
      values: { samples: item.samples.length, bin: item.bin },
    })),
    prediction: {
      prompt: "What frequency does the strongest eligible computed bin return?",
      unit: "Hz",
      tolerance: 0,
    },
    evaluate: ({ bin }, caseId) => {
      const item = FFT_TASK_CASES[caseId as keyof typeof FFT_TASK_CASES];
      const magnitudes = taskMagnitudes(item.samples);
      let winner = 1;
      for (let i = 2; i < magnitudes.length; i++)
        if (magnitudes[i]! > magnitudes[winner]!) winner = i;
      const spacing = item.rate / item.samples.length,
        answer = winner * spacing;
      return {
        graphics: [
          line(
            "Supplied samples in time order",
            item.samples,
            "fft-task-samples",
          ),
          line(
            "Computed raw FFT magnitudes, with DC visible",
            magnitudes,
            "fft-task-magnitudes",
            [bin, winner],
          ),
          cells(
            "Selected bin and winning eligible bin",
            [
              item.samples.length,
              item.rate,
              spacing,
              bin,
              bin * spacing,
              round(magnitudes[bin]!),
              winner,
              answer,
            ],
            [
              "Samples N",
              "Sample rate (Hz)",
              "Bin spacing (Hz)",
              "Selected bin",
              "Selected center (Hz)",
              "Selected raw magnitude",
              "Winning non-DC bin",
              "Returned frequency (Hz)",
            ],
          ),
          pipe("Eligible maximum rule", [
            "Bin 0 is visible but excluded",
            "Start at bin 1",
            "Replace the winner only for a strictly larger computed magnitude",
            caseId === "silence"
              ? "Silence ties every eligible bin. The convention returns bin 1, with no tone present."
              : caseId === "tied"
                ? "The impulse ties eligible magnitudes. Keep the lowest eligible index."
                : `Winner ${winner} represents ${answer} Hz`,
          ]),
        ],
        answer,
        answerLabel: "Strongest eligible bin center",
        explanation: `Use the computed magnitudes, exclude bin 0, and retain the lower index on a tie. This capture has ${spacing} Hz between bins, so ${winner} * ${item.rate} / ${item.samples.length} = ${answer} Hz. Selecting bin ${bin} does not make it the winner. ${caseId === "offBin" ? "The supplied 7.3 Hz tone produces a winning center at 7 Hz. This grid does not return the true tone frequency directly." : caseId === "silence" ? "The convention returns a number for silence, although silence contains no tone." : "The returned center describes this window's discrete bin grid."}`,
        code: `const sampleCount = ${item.samples.length};\nconst sampleRate = ${item.rate};\nconst selectedBin = ${bin};\nconst winningBin = ${winner};\nconst selectedFrequency = selectedBin * sampleRate / sampleCount;\nconst frequency = winningBin * sampleRate / sampleCount;`,
      };
    },
  },
  spectrograms: {
    title: "One full frame and its place in time",
    brief:
      "Select a complete frame and a bin. Follow original sample indices into its raw spectrum and the same bin across all frames.",
    boundary:
      "This uses the exercise's synthetic one-second, 256 Hz checks. Its 40 Hz burst occupies samples 64 through 127. These rectangular frames have no Hann taper. The series is a computed reference, separate from your returned 40 Hz capture and the mission's 73.4-second pulse intervals.",
    controls: [
      choice(
        "window",
        "Samples per frame",
        ["64 samples", "128 samples"],
        0,
        [64, 128],
      ),
      choice(
        "hop",
        "Hop in samples",
        ["32 samples", "64 samples"],
        1,
        [32, 64],
      ),
      {
        ...range("frame", "Frame index", 1, 0, 6),
        maxFor: (values) =>
          Math.max(
            0,
            Math.floor((values.length! - values.window!) / values.hop!),
          ),
      },
      {
        ...range("bin", "Frame bin index", 10, 0, 64),
        maxFor: (values) => values.window! / 2,
      },
    ],
    cases: Object.entries(FRAME_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description: `${item.samples.length} supplied samples. Only full frames produce rows.`,
      values: { frame: item.frame, bin: item.bin, length: item.samples.length },
    })),
    prediction: {
      prompt: "How many complete magnitude rows does this capture produce?",
      tolerance: 0,
    },
    evaluate: ({ window: size, hop, frame, bin }, caseId) => {
      const item = FRAME_TASK_CASES[caseId as keyof typeof FRAME_TASK_CASES],
        rows = taskFrames(caseId as keyof typeof FRAME_TASK_CASES, size, hop);
      const start = frame * hop,
        count = rows.length;
      const graphics = [
        cells(
          "Frame and bin settings",
          [
            item.samples.length,
            size,
            hop,
            count,
            (bin * 256) / size,
            Math.floor(size / 2) + 1,
          ],
          [
            "Capture samples",
            "Samples per frame",
            "Hop samples",
            "Complete frames",
            "Selected bin center (Hz)",
            "Bins per row",
          ],
        ),
        pipe("Complete-frame rule", [
          `Start sample = frame index * ${hop}`,
          `Keep a frame when start + ${size} <= ${item.samples.length}`,
          "Rows stay in time order. Bins stay in frequency order.",
        ]),
      ] as InvestigationGraphic[];
      if (count)
        graphics.push(
          line(
            "Complete supplied time capture",
            item.samples,
            "stft-task-samples",
            Array.from({ length: size }, (_, i) => start + i),
          ),
          line(
            "Selected frame raw FFT magnitudes",
            rows[frame]!,
            "stft-task-magnitude",
            [bin],
          ),
          line(
            "Selected bin across complete frames",
            rows.map((row) => row[bin]!),
            "stft-task-magnitude",
            [frame],
            rows.map((_, i) => String((i * hop) / 256)),
          ),
          cells(
            "Selected frame's original interval",
            [
              start,
              start + size - 1,
              start / 256,
              (start + size) / 256,
              round(rows[frame]![bin]!),
            ],
            [
              "First sample",
              "Last included sample",
              "Interval start (s)",
              "Exclusive interval end (s)",
              "Selected raw magnitude",
            ],
          ),
        );
      else
        graphics.push(
          pipe("No measured row", [
            "The capture is shorter than one full frame",
            "Return []",
            "An absent frame is different from a silent complete frame",
          ]),
        );
      return {
        graphics,
        answer: count,
        answerLabel: "Complete magnitude rows",
        explanation: count
          ? `This setting gives 1 + floor((${item.samples.length} - ${size}) / ${hop}) = ${count} complete rows. Frame ${frame} starts at sample ${start}, covering [${start}, ${start + size}) or [${start / 256}, ${(start + size) / 256}) seconds. Bin ${bin} represents ${(bin * 256) / size} Hz. Overlap reuses original samples. This one-second check cannot measure a 73.4-second interval.`
          : "No full frame fits. Return an empty outer array, with no invented spectrum. Do not pad an incomplete final frame for this task.",
        code: `const sampleCount = ${item.samples.length};\nconst frameLength = ${size};\nconst hop = ${hop};\nconst rows = Math.max(0, 1 + Math.floor((sampleCount - frameLength) / hop));\nconst selectedStart = ${frame} * hop;\nconst selectedBinHz = ${bin} * 256 / frameLength;`,
      };
    },
  },
  "fft-as-features": {
    title: "A feature keeps its measurement and position",
    brief:
      "Select a returned feature. Inspect the absolute peak, strict sign changes, or raw magnitude at a fixed bin center.",
    boundary:
      "These are the exercise's synthetic feature-extraction captures. Its row omits the mission model's phase feature. The default 256 Hz check returns two time measurements plus eight unscaled FFT magnitudes. It trains no classifier and measures no accuracy gain.",
    controls: [
      choice("band", "Requested frequency band", [
        "Supplied band",
        "Bin-center endpoints",
        "DC through Nyquist",
      ]),
      {
        ...range("feature", "Returned feature index", 2, 0, 34),
        maxFor: (values) => {
          const [lo, hi] = taskBand(values.rate!, values.band!);
          const width = values.rate! / 64;
          return 1 + Math.floor(hi / width) - Math.ceil(lo / width) + 1;
        },
      },
      range("sample", "Raw sample index", 1, 0, 63),
    ],
    cases: Object.entries(FEATURE_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description: `64 supplied samples at ${item.rate} Hz, with a 0.45-radian phase offset. Preserve the raw units and bin order.`,
      values: { rate: item.rate, feature: id === "changed" ? 3 : 2 },
    })),
    prediction: {
      prompt: "What value occupies the selected returned feature position?",
      tolerance: 0.01,
    },
    evaluate: ({ band, feature, sample }, caseId) => {
      const item =
          FEATURE_TASK_CASES[caseId as keyof typeof FEATURE_TASK_CASES],
        [lo, hi] = taskBand(item.rate, band),
        width = item.rate / 64;
      const first = Math.ceil(lo / width),
        last = Math.floor(hi / width),
        magnitudes = taskMagnitudes(item.samples);
      const amplitude = Math.max(...item.samples.map(Math.abs));
      const crossings = item.samples
        .slice(1)
        .reduce(
          (count, value, i) => count + Number(value * item.samples[i]! < 0),
          0,
        );
      const features = [
        amplitude,
        crossings,
        ...magnitudes.slice(first, last + 1),
      ];
      const labels = [
        "Peak absolute amplitude",
        "Strict zero-crossing count",
        ...features
          .slice(2)
          .map(
            (_, i) =>
              `Raw magnitude: bin ${first + i}, ${(first + i) * width} Hz`,
          ),
      ];
      const peakIndex = item.samples.findIndex(
        (value) => Math.abs(value) === amplitude,
      );
      const pair =
        sample === 0
          ? undefined
          : item.samples[sample - 1]! * item.samples[sample]!;
      const detail =
        feature === 0
          ? [
              `Maximum absolute sample = ${round(amplitude)}`,
              `Its original index is ${peakIndex}`,
              `At selected sample ${sample}, absolute value is ${round(Math.abs(item.samples[sample]!))}`,
            ]
          : feature === 1
            ? [
                `Count strictly opposite signs across adjacent pairs: ${crossings}`,
                sample === 0
                  ? "Sample 0 has no previous pair"
                  : `Pair ${sample - 1}, ${sample}: product ${round(pair!)} ${pair! < 0 ? "< 0, adds one" : ">= 0, adds zero"}`,
                "A pair containing an exact zero adds nothing",
              ]
            : [
                `Vector index ${feature} maps to bin ${first + feature - 2}`,
                `Bin center ${(first + feature - 2) * width} Hz`,
                `Keep its raw magnitude ${round(features[feature]!)}, in frequency order`,
              ];
      return {
        graphics: [
          line(
            "Supplied samples for the feature row",
            item.samples,
            "feature-task-samples",
            [sample],
          ),
          cells(
            "Requested band and included bin centers",
            [lo, hi, width, first, last, features.length],
            [
              "Lower limit (Hz)",
              "Upper limit (Hz)",
              "Bin spacing (Hz)",
              "First included bin",
              "Last included bin",
              "Returned feature count",
            ],
          ),
          cells(
            "Returned features in their fixed order",
            features.map(round),
            labels,
            [feature],
          ),
          pipe("Selected feature calculation", detail),
          pipe("Scaling after feature extraction", [
            "Keep raw magnitudes here",
            "Fit per-column scaling on training rows only",
            "Reuse those training statistics at validation and inference",
            "This ten-value exercise row differs from the mission's eleven-input research model",
          ]),
        ],
        answer: features[feature]!,
        answerLabel: labels[feature]!,
        explanation: `${lo}-${hi} Hz includes centers from bin ${first} through ${last}, using ceil(lower / ${width}) and floor(upper / ${width}). The vector begins with peak ${round(amplitude)} and ${crossings} strict sign changes. Position ${feature} holds ${round(features[feature]!)}. Sorting or normalizing the magnitudes here would change the required feature contract.`,
        code: `const sampleRate = ${item.rate};\nconst sampleCount = 64;\nconst binWidth = sampleRate / sampleCount;\nconst firstBin = Math.ceil(${lo} / binWidth);\nconst lastBin = Math.floor(${hi} / binWidth);\nconst selectedFeature = ${feature};\nconst selectedValue = ${features[feature]};`,
      };
    },
  },
  "windowing-and-overlap": {
    title: "One sample's weight and the resulting spectrum",
    brief:
      "Inspect a supplied off-bin tone before and after symmetric Hann multiplication. Compare far-bin summed magnitudes and peak shape.",
    boundary:
      "These are the exercise's 10.5-cycle/128-sample and 20.5-cycle/64-sample checks. The frequency axis is bin index because this taper check supplies cycles per slice, not a physical sample rate. The leakage measure sums raw magnitudes more than three bins from the rounded tone bin. It is not energy or a universal reduction factor.",
    controls: [
      {
        ...range("sample", "Sample index", 32, 0, 127),
        maxFor: (values) => values.length! - 1,
      },
      choice(
        "taper",
        "Applied window",
        ["Rectangular weights", "Symmetric Hann"],
        1,
      ),
    ],
    cases: Object.entries(TAPER_TASK_CASES).map(([id, item]) => ({
      id,
      label: item.label,
      description:
        "An authored off-bin diagnostic. The taper reaches zero at both ends and keeps original sample order.",
      values: { sample: item.sample, length: item.samples.length },
    })),
    prediction: {
      prompt: "What weighted sample remains at the selected index?",
      tolerance: 0.001,
    },
    evaluate: ({ sample, taper }, caseId) => {
      const id = caseId as keyof typeof TAPER_TASK_CASES,
        item = TAPER_TASK_CASES[id],
        n = item.samples.length;
      const weights =
          taper === 1 ? symmetricHann(n) : (Array(n).fill(1) as number[]),
        applied = taper === 1 ? taperedCases[id] : item.samples;
      const before = taskMagnitudes(item.samples),
        after = taskMagnitudes(applied),
        roundedToneBin = Math.round(item.cycles);
      const farSum = (values: number[]) =>
        values.reduce(
          (total, value, bin) =>
            total + (Math.abs(bin - roundedToneBin) > 3 ? value : 0),
          0,
        );
      const rawFar = farSum(before),
        appliedFar = farSum(after);
      return {
        graphics: [
          line("One weight per original sample", weights, "hann-weights", [
            sample,
          ]),
          line(
            "Original and ordered capture samples",
            item.samples,
            "hann-samples",
            [sample],
          ),
          line(
            "Samples after elementwise multiplication",
            applied,
            "hann-samples",
            [sample],
          ),
          cells(
            "Selected sample multiplication",
            [
              sample,
              round(item.samples[sample]!),
              round(weights[sample]!),
              round(applied[sample]!),
            ],
            [
              "Sample index",
              "Original value",
              "Window weight",
              "Weighted value",
            ],
          ),
          line("Raw capture magnitudes by bin", before, "hann-raw-magnitude"),
          line(
            "Weighted capture magnitudes by bin",
            after,
            "hann-raw-magnitude",
          ),
          cells(
            "The grader's far-bin magnitude measure",
            [
              roundedToneBin,
              round(rawFar),
              round(appliedFar),
              round(rawFar / appliedFar),
              round(Math.max(...after)),
            ],
            [
              "Rounded tone bin",
              "Far-bin sum before",
              "Far-bin sum after",
              "Before / after ratio",
              "Largest magnitude after",
            ],
          ),
          pipe("Overlap uses original indices", [
            "For a 64-sample frame and hop 32, frame 0 uses samples 0-63",
            "Frame 1 uses samples 32-95",
            "Samples 32-63 contribute to both frames",
            "Tapering reduces distant leakage here while changing heights and broadening the main peak",
          ]),
        ],
        answer: applied[sample]!,
        answerLabel: "Selected weighted sample",
        explanation: `For n=${n}, symmetric Hann uses denominator n-1=${n - 1}. At index ${sample}, ${round(item.samples[sample]!)} * ${round(weights[sample]!)} gives ${round(applied[sample]!)}. The far-bin measure adds magnitudes with |bin - ${roundedToneBin}| > 3. It changes from ${round(rawFar)} to ${round(appliedFar)} for these supplied inputs. Compare this same definition on both spectra.`,
        code: `const sampleIndex = ${sample};\nconst sampleCount = ${n};\nconst weight = ${taper === 1 ? "0.5 * (1 - Math.cos(2 * Math.PI * sampleIndex / (sampleCount - 1)))" : "1"};\nconst rawSample = ${item.samples[sample]};\nconst weightedSample = rawSample * weight;`,
      };
    },
  },
};
