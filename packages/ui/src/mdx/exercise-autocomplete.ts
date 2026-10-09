import {
  acceptCompletion,
  autocompletion,
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import {
  completionPath,
  javascriptLanguage,
  scopeCompletionSource,
} from "@codemirror/lang-javascript";
import { syntaxTree } from "@codemirror/language";
import { Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

// This is a small local API vocabulary, not a solution generator or a
// TypeScript language server. Suggestions insert names only, never answers.
const TENSOR_FACTORIES =
  "tensor tensor1d tensor2d tensor3d tensor4d tensor5d tensor6d scalar zeros ones zerosLike onesLike range linspace randomNormal randomUniform reshape stack concat split slice gather transpose expandDims squeeze cast mean sum min max argMax argMin add sub mul div pow sqrt square abs clipByValue maximum minimum softmax sigmoid relu matMul oneHot".split(
    " ",
  );
const ROOT_FUNCTIONS = [
  ...TENSOR_FACTORIES,
  ..."tidy dispose sequential model input loadLayersModel loadGraphModel nextFrame memory ready setBackend getBackend".split(
    " ",
  ),
];
const NAMESPACES: Record<string, string[]> = {
  layers:
    "dense dropout flatten conv2d maxPooling2d batchNormalization lstm embedding".split(
      " ",
    ),
  train: "adam sgd momentum rmsprop adagrad".split(" "),
  data: "array generator csv zip webcam".split(" "),
  image: "resizeBilinear resizeNearestNeighbor".split(" "),
  browser: "fromPixels toPixels".split(" "),
  losses:
    "meanSquaredError softmaxCrossEntropy sigmoidCrossEntropy absoluteDifference".split(
      " ",
    ),
  metrics: "binaryAccuracy categoricalAccuracy precision recall".split(" "),
};
const functions = (names: string[]): Completion[] =>
  names.map((label) => ({ label, type: "function", detail: "TensorFlow.js" }));
const ROOT_OPTIONS: Completion[] = [
  ...functions(ROOT_FUNCTIONS),
  ...Object.keys(NAMESPACES).map((label) => ({ label, type: "namespace" })),
];
const TENSOR_OPTIONS: Completion[] = [
  {
    label: "shape",
    type: "property",
    detail: "number[]",
    info: "The length of each dimension. A list of five numbers has shape [5].",
  },
  {
    label: "size",
    type: "property",
    detail: "number",
    info: "The total number of values in this tensor.",
  },
  {
    label: "rank",
    type: "property",
    detail: "number",
    info: "The number of dimensions in this tensor.",
  },
  { label: "dtype", type: "property", detail: "DataType" },
  ...functions(
    "arraySync array dataSync data dispose reshape flatten expandDims squeeze cast clone print add sub mul div mean sum min max argMax transpose matMul".split(
      " ",
    ),
  ),
];

function isTensorVariable(context: CompletionContext, name: string): boolean {
  let tensor = false;
  // Look only at parsed declarations, so mentions inside comments/strings
  // cannot make an unrelated JS object acquire tensor suggestions.
  syntaxTree(context.state).iterate({
    to: context.pos,
    enter(node) {
      if (node.name !== "VariableDeclaration") return;
      const variable = node.node.getChild("VariableDefinition");
      if (
        !variable ||
        context.state.sliceDoc(variable.from, variable.to) !== name
      )
        return;
      const call = node.node.getChild("CallExpression");
      const callee = call?.firstChild;
      const expression = callee
        ? context.state.sliceDoc(callee.from, callee.to)
        : "";
      tensor =
        expression.startsWith("tf.") &&
        TENSOR_FACTORIES.includes(expression.slice(3)) &&
        expression !== "tf.split";
    },
  });
  return tensor;
}

export function tensorflowCompletions(context: CompletionContext) {
  const part = completionPath(context);
  if (!part) return null;
  let options: Completion[];
  if (part.path.length === 0)
    options = [{ label: "tf", type: "namespace", detail: "TensorFlow.js" }];
  else if (part.path.join(".") === "tf") options = ROOT_OPTIONS;
  else if (
    part.path.length === 2 &&
    part.path[0] === "tf" &&
    NAMESPACES[part.path[1]]
  )
    options = functions(NAMESPACES[part.path[1]]);
  else if (part.path.length === 1 && isTensorVariable(context, part.path[0]))
    options = TENSOR_OPTIONS;
  else return null;
  return {
    from: context.pos - part.name.length,
    options,
    validFor: /^[\w$]*$/,
  };
}

export const EXERCISE_EDITOR_EXTENSIONS = [
  autocompletion({ activateOnTyping: true, maxRenderedOptions: 12 }),
  javascriptLanguage.data.of({ autocomplete: tensorflowCompletions }),
  javascriptLanguage.data.of({
    autocomplete: scopeCompletionSource({
      Math,
      JSON,
      Array,
      Number,
      String,
      Object,
      console: { log() {}, error() {}, warn() {} },
    }),
  }),
  // Sandpack's normal Tab handler indents before consulting custom bindings.
  // A higher-priority binding accepts suggestions without adding whitespace.
  Prec.highest(keymap.of([{ key: "Tab", run: acceptCompletion }])),
  EditorView.theme({
    ".cm-tooltip-autocomplete": {
      border: "1px solid var(--tc-border)",
      backgroundColor: "var(--tc-surface)",
      color: "var(--tc-text)",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--tc-primary)",
      color: "var(--tc-on-primary)",
    },
    ".cm-completionDetail": { fontSize: "12px", opacity: "1" },
    ".cm-completionInfo": {
      backgroundColor: "var(--tc-surface)",
      color: "var(--tc-text)",
      border: "1px solid var(--tc-border)",
      padding: "10px 12px",
      maxWidth: "280px",
      fontFamily: "var(--font-sans, sans-serif)",
      fontSize: "13px",
      lineHeight: "1.6",
    },
  }),
];
