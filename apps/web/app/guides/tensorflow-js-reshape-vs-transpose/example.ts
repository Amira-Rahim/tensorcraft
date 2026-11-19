import { WORKED_PACKET } from "../../components/mdx/channel-layout-data";

/** This is the exact runnable example shown in the public guide. */
export const GUIDE_EXAMPLE = `import * as tf from "@tensorflow/tfjs";

await tf.ready();

// Local moments 0, 1, 2. Sensor order: A, B, C, D.
const packet = ${JSON.stringify(WORKED_PACKET, null, 2)};

const comparison = tf.tidy(() => {
  const input = tf.tensor2d(packet);
  return {
    reshaped: input.reshape([4, 3]).arraySync(),
    transposed: input.transpose().arraySync(),
  };
});

console.log(comparison);`;
