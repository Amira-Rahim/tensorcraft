import type { ExerciseArtifact } from "@tensorcraft/ui";
export const courseResultFixtures: Record<string, ExerciseArtifact[]> = {
  "compute-fft": [
    {
      kind: "table",
      title: "Your strongest eligible frequency",
      columns: ["Measurement", "Value"],
      rows: [
        ["Samples", 128],
        ["Sample rate (Hz)", 128],
        ["Bin spacing (Hz)", 1],
        ["Returned frequency (Hz)", 5],
      ],
    },
  ],
  "build-spectrogram": [
    {
      kind: "series",
      title: "When the test tone appears",
      xLabel: "Frame start (seconds)",
      yLabel: "Raw FFT magnitude at 40 Hz",
      labels: ["0", "0.25", "0.5", "0.75"],
      series: [{ name: "Your 40 Hz magnitudes", values: [0, 32, 0, 0] }],
    },
  ],
  "pipeline-architecture": [
    {
      kind: "table",
      title: "The feature row your pipeline delivered",
      columns: ["FFT bin", "Magnitude from normalized input"],
      rows: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 8],
      ],
    },
  ],
  "write-model-card": [
    {
      kind: "text",
      title: "The handover card your code produced",
      text: "# DEEP SCAN v1.0.0\n\n## Performance\n- Accuracy: 91.8% (measured at the pruning review)\n- Size: 3988 bytes\n- Inference: 0.035ms\n\n## Limitations\n- Lowest recall: anomaly at 84.0%\n- Only tested on Sector 7-G data\n- Requires 64-sample capture window\n\n## Usage\n- Input: Float32Array(64)\n- Output: { label, confidence }",
    },
  ],
};
