// Reference inputs are exact supplied kernels from the two optimization exercises.
// Class decisions below were checked with the shipped solutions on TFJS 4.22 CPU.
// The activities do not run a model. Learner captures remain separate results.
export const QUANTIZATION_CASES = {
  standard: {
    kernel: [40, -10, 0, 0.05],
    bias: [0, -0.02],
    captures: [
      [1, 0],
      [0, 1],
      [1, 0],
      [0, 1],
      [0, 1],
    ],
    before: [0, 1, 0, 1, 1],
    after: [0, 0, 0, 0, 0],
  },
  changed: {
    kernel: [2, -2, -2, 2],
    bias: [0.1, -0.1],
    captures: [
      [1, 0],
      [0, 1],
      [3, 1],
      [1, 3],
    ],
    before: [0, 1, 0, 1],
    after: [0, 1, 0, 1],
  },
  constant: {
    kernel: [0, 0, 0, 0],
    bias: [0, 0],
    captures: [[1, 2]],
    before: [0],
    after: [0],
  },
} as const;
export function quantizedKernel(values: readonly number[]) {
  const original = values.map(Math.fround);
  const min = Math.min(...original),
    max = Math.max(...original);
  const scale = (max - min) / 255;
  const stored = original.map((value) =>
    scale === 0 ? 0 : Math.round((value - min) / scale),
  );
  const decoded = stored.map((code) => code * scale + min);
  const error = decoded.map((value, index) =>
    Math.abs(value - original[index]!),
  );
  return {
    original,
    min,
    max,
    scale,
    stored,
    decoded,
    applied: decoded.map(Math.fround),
    error,
  };
}
export const PRUNING_LEVELS = [0, 0.3, 0.6, 0.8, 1] as const;
export const PRUNING_CLASS_NAMES = [
  "Pulsar",
  "Quasar",
  "Noise",
  "Interference",
  "Anomaly",
];
export const PRUNING_KERNELS = [
  [
    [
      0.243, 0.362, 0.297, 0.362, 0.05, 0.356, 0.35, -0.286, 0.179, 0.241,
      -0.325, -0.461,
    ],
    [
      0.297, -1.06, -0.221, 0.038, -0.488, -0.262, 0.804, 0.223, 0.416, -0.225,
      -0.078, 0.464,
    ],
    [
      -0.318, 0.299, 0.771, 0.663, 0.192, -0.197, 0.345, 0.469, -0.765, -0.773,
      -0.384, 0.41,
    ],
    [
      0.136, 0.563, -0.553, 0.304, -0.783, -0.009, -0.56, -0.221, 0.483, -0.87,
      0.296, -0.232,
    ],
    [
      0.021, -0.765, 0.683, 0.216, 0.985, -0.11, 0.072, 0.267, 0.13, 0.965,
      -0.197, -0.123,
    ],
    [
      -0.482, -0.431, -1.235, 0.046, -0.534, -0.462, -0.502, -0.291, 0.194,
      0.872, 0.427, 0.405,
    ],
    [
      0.385, 0.666, -0.075, 0.192, 0.318, -0.013, -1.071, 0.491, -0.224, 0.056,
      0.224, 0.375,
    ],
    [
      0.051, -0.358, -0.032, 0.1, -0.016, 0.369, -0.738, -0.025, 0.337, -0.756,
      0.288, 0.424,
    ],
    [
      0.284, 0.325, 0.044, 0.049, 0.446, 0.42, -0.213, 0.017, -0.02, -0.253,
      -0.116, 0.517,
    ],
    [
      -0.33, 0.331, -0.144, -0.116, -0.322, 0.159, 0.829, 0.139, -0.373, 0.729,
      0.347, -0.345,
    ],
    [
      -0.54, -1.014, -0.216, 0.683, 0.222, -0.33, 0.782, 0.296, 0.21, 0.018,
      -0.389, 0.332,
    ],
  ],
  [
    [-0.142, -0.562, 0.125, -0.1, -0.289],
    [-0.337, -0.701, 1.741, -0.128, -0.455],
    [0.143, -0.884, -0.507, 1.368, 0.114],
    [0.208, -0.528, -0.426, 0.141, -0.229],
    [-0.238, 0.209, -0.886, 1.031, -0.301],
    [-0.2, -0.294, 0.326, 0.315, 0.174],
    [1.813, 0.47, -0.248, -0.947, -0.62],
    [0.355, -0.584, -0.134, 0.649, -0.279],
    [-0.121, 0.092, -0.169, -0.303, 1.036],
    [-1.148, 1.779, 0.103, 0.437, 0],
    [-0.245, -0.161, 0.356, -0.246, 0.516],
    [0.247, -0.484, 0.06, -0.469, 0.039],
  ],
].map((rows) => rows.flat().map(Math.fround));
export const PRUNING_RECALL = [
  [1, 1, 1, 1, 0.975],
  [1, 1, 1, 1, 0.95],
  [1, 1, 1, 1, 0.7],
  [1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1],
];
export function pruningReference(levelIndex: number) {
  const level = PRUNING_LEVELS[levelIndex]!;
  const values = PRUNING_KERNELS.flat();
  const ranked = values.map(Math.abs).sort((a, b) => a - b);
  const cutoff =
    level === 1 ? Infinity : ranked[Math.floor(ranked.length * level)]!;
  const output = values.map((value) => (Math.abs(value) < cutoff ? 0 : value));
  return {
    level,
    cutoff,
    original: values,
    output,
    zeros: output.filter((value) => value === 0).length,
    recall: PRUNING_RECALL[levelIndex]!,
  };
}
