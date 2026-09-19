export const VISION_KERNEL = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
] as const;
export type VisionPattern = "vertical" | "horizontal" | "uniform" | "reversed";

export function visionImage(
  pattern: VisionPattern,
  brighter: boolean,
): number[][] {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => {
      const value =
        pattern === "uniform"
          ? 0.4
          : pattern === "horizontal"
            ? row < 2
              ? 0.1
              : 0.8
            : pattern === "reversed"
              ? col < 2
                ? 0.8
                : 0.1
              : col < 2
                ? 0.1
                : 0.8;
      return Number((value + (brighter ? 0.1 : 0)).toFixed(1));
    }),
  );
}

/** CNN convention: cross-correlation, with no kernel reversal. */
export function visionFeatureMap(image: number[][]): number[][] {
  if (
    image.length !== 5 ||
    image.some(
      (row) =>
        row.length !== 5 ||
        row.some((value) => !Number.isFinite(value) || value < 0 || value > 1),
    )
  )
    throw new Error("Expected a 5 by 5 grayscale image in [0, 1]");
  return Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) =>
      VISION_KERNEL.reduce(
        (sum, weights, kr) =>
          sum +
          weights.reduce<number>(
            (part, weight, kc) => part + image[row + kr][col + kc] * weight,
            0,
          ),
        0,
      ),
    ),
  );
}
