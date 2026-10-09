import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import * as tf from "@tensorflow/tfjs";
import { tensorflowCompletions } from "./exercise-autocomplete";

function complete(doc: string) {
  const state = EditorState.create({ doc, extensions: [javascript()] });
  return tensorflowCompletions(new CompletionContext(state, doc.length, false));
}
describe("exercise TensorFlow.js autocomplete", () => {
  it("offers existing TensorFlow.js APIs and inserts names without solving the exercise", () => {
    const result = complete("const reading = tf.te")!;
    expect(result.options.some((option) => option.label === "tensor")).toBe(
      true,
    );
    for (const option of result.options) {
      expect(option.label in tf).toBe(true);
      expect(option.apply).toBeUndefined();
    }
    expect(result.from).toBe("const reading = tf.".length);
  });
  it("completes nested TensorFlow.js namespaces", () => {
    for (const namespace of [
      "layers",
      "train",
      "data",
      "image",
      "browser",
      "losses",
      "metrics",
    ] as const) {
      for (const option of complete(`tf.${namespace}.`)!.options)
        expect(option.label in tf[namespace]).toBe(true);
    }
  });
  it("suggests tensor properties on a declared tensor", () => {
    const labels = complete(
      "const reading = tf.tensor([1, 2]);\nreading.sh",
    )!.options.map((option) => option.label);
    expect(labels).toContain("shape");
    expect(labels).toContain("arraySync");
    const tensor = tf.tensor([1, 2]);
    try {
      for (const label of labels) expect(label in tensor, label).toBe(true);
    } finally {
      tensor.dispose();
    }
  });
  it("does not assign tensor properties to arrays, models, or an array of tensors", () => {
    for (const value of [
      "[1, 2]",
      "tf.sequential()",
      "tf.split(tf.tensor([1,2]), 2)",
    ])
      expect(complete(`const reading = ${value};\nreading.`)).toBeNull();
  });
  it("does not complete inside comments or strings", () => {
    expect(complete("// tf.te")).toBeNull();
    expect(complete('const label = "tf.te')).toBeNull();
    expect(
      complete("// const reading = tf.tensor([1,2]);\nreading."),
    ).toBeNull();
  });
});
