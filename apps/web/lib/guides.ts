/** Public reference pages with editorial dates, independent of build time. */
export const GUIDES = [
  {
    slug: "tensorflow-js-reshape-vs-transpose",
    path: "/guides/tensorflow-js-reshape-vs-transpose",
    title: "TensorFlow.js reshape vs transpose",
    description:
      "Compare reshape and transpose in TensorFlow.js with exact outputs, runnable JavaScript, and a sensor-data example for JavaScript developers.",
    summary:
      "The same output shape can group readings differently. Follow one sensor reading through both operations and inspect the exact TensorFlow.js results.",
    updatedAt: "2026-11-10",
  },
  {
    slug: "javascript-machine-learning-learning-path",
    path: "/guides/javascript-machine-learning-learning-path",
    title: "Machine learning in JavaScript: a learning path",
    description:
      "A practical machine learning path for JavaScript developers: compare training, pretrained inference, and model APIs, with prerequisites, outputs, and free lessons.",
    summary:
      "Choose the kind of ML work you want to do, see what each stage should produce, and explore Deep Orbit's free starting lessons.",
    updatedAt: "2026-11-10",
  },
  {
    slug: "browser-machine-learning-project",
    path: "/guides/browser-machine-learning-project",
    title: "A browser ML project: a rule, a model, and a recorded mistake",
    description:
      "Train a TensorFlow.js model in your browser on recorded room data. Compare it with a light-threshold rule on 400 later readings and inspect its mistakes.",
    summary:
      "Run a supplied JavaScript training example, compare validation errors with a simple rule, and inspect the room readings behind the results.",
    updatedAt: "2026-11-11",
  },
] as const;

export function getGuide(slug: string) {
  const guide = GUIDES.find((entry) => entry.slug === slug);
  if (!guide) throw new Error(`Missing public guide metadata: ${slug}`);
  return guide;
}
