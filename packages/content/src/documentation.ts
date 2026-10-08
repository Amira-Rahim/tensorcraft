import apiAnchors from "./tfjs-api-anchors.json";

export interface DocumentationReference {
  title: string;
  href: string;
  source: string;
  /** A related API supplies a building block, not the entire concept. */
  kind: "api" | "guide" | "related-api" | "background";
}

// Verified against the official 4.22.0 reference on 2026-10-08. Pinning the
// version keeps links aligned with the runtime used by the course.
const API_ROOT = "https://js.tensorflow.org/api/4.22.0/";
const knownAnchors = new Set(apiAnchors);

export function tfjsApiReference(
  symbol: string,
): DocumentationReference | null {
  const bare = symbol
    .replace(/^tf\./, "")
    .replace(/^math\.confusionMatrix$/, "confusionMatrix");
  const anchor = knownAnchors.has(symbol)
    ? symbol
    : knownAnchors.has(bare)
      ? bare
      : knownAnchors.has(`class:${bare}`)
        ? `class:${bare}`
        : null;
  if (!anchor) return null;
  return {
    title:
      anchor === "confusionMatrix"
        ? "tf.math.confusionMatrix"
        : anchor.startsWith("class:")
          ? `tf.${anchor.slice(6)}`
          : anchor.startsWith("tf.")
            ? anchor
            : `tf.${anchor}`,
    href: `${API_ROOT}#${anchor}`,
    source: "TensorFlow.js",
    kind: "api",
  };
}

function api(symbol: string, title?: string): DocumentationReference {
  const reference = tfjsApiReference(symbol);
  if (!reference) throw new Error(`Unknown TensorFlow.js API: ${symbol}`);
  return { ...reference, ...(title ? { title } : {}) };
}

function related(symbol: string, title?: string): DocumentationReference {
  return { ...api(symbol, title), kind: "related-api" };
}

function guide(path: string, title: string): DocumentationReference {
  return {
    title,
    href: `https://www.tensorflow.org/js/${path}`,
    source: "TensorFlow.js",
    kind: "guide",
  };
}

function background(
  href: string,
  title: string,
  source: string,
): DocumentationReference {
  return {
    title,
    href,
    source,
    kind: source === "TensorFlow.js" ? "guide" : "background",
  };
}

function google(anchor: string, title: string): DocumentationReference {
  return background(
    `https://developers.google.com/machine-learning/glossary#${anchor}`,
    title,
    "Google ML glossary",
  );
}

function python(path: string, title: string): DocumentationReference {
  return background(
    `https://www.tensorflow.org/${path}`,
    title,
    "TensorFlow (Python)",
  );
}

const tensors = guide("guide/tensors_operations", "Tensors and operations");
const training = guide("guide/train_models", "Training models");
const models = guide("guide/models_and_layers", "Models and layers");
const platforms = guide("guide/platform_environment", "Backends and memory");
const autoencoders = python(
  "tutorials/generative/autoencoder",
  "Autoencoders and anomaly detection",
);
const signalTheory = background(
  "https://docs.scipy.org/doc/scipy/tutorial/signal.html#spectral-analysis",
  "Spectral analysis",
  "SciPy (Python)",
);

/**
 * Curated destinations for every glossary concept, shared by all worlds.
 * Do not replace a missing concept page with the API homepage. Use an exact
 * API/guide when it explains the term, label a building block as related, or
 * explicitly name the broader source when TensorFlow.js has no such guide.
 */
export const CONCEPT_DOCUMENTATION: Record<string, DocumentationReference> = {
  tensor: api("tensor"),
  rank: tensors,
  "matrix rank": python("api_docs/python/tf/linalg/matrix_rank", "Matrix rank"),
  shape: tensors,
  dimensions: tensors,
  "typed-array": api("tensor", "tf.tensor: accepted values and data types"),
  "row-major": api("reshape", "tf.reshape: preserving element order"),
  matmul: api("matMul"),
  broadcasting: api("add", "tf.add: broadcasting rules"),
  "weighted-sum": related("dot", "tf.dot: sum of products"),
  normalization: guide(
    "tutorials/training/linear_regression",
    "Preparing and normalizing data",
  ),
  "z-score": google("z-score-normalization", "Z-score normalization"),
  "standard deviation": related("moments", "tf.moments: mean and variance"),
  variance: api("moments", "tf.moments: mean and variance"),
  regression: guide(
    "tutorials/training/linear_regression",
    "Predict a numerical value",
  ),
  classification: guide(
    "tutorials/training/handwritten_digit_cnn",
    "Image classification",
  ),
  "y-hat": api("tf.LayersModel.predict", "model.predict: predicted values"),
  "sigma-prime": related("grad", "tf.grad: derivatives"),
  smoothing: api("movingAverage"),
  neuron: related("layers.dense", "tf.layers.dense: units in a layer"),
  layer: models,
  dense: api("layers.dense"),
  weights: guide("guide/train_models#model_parameters", "Model parameters"),
  bias: api("layers.dense", "tf.layers.dense: useBias and biasInitializer"),
  activation: api("layers.activation"),
  nonlinearity: related("layers.activation", "tf.layers.activation"),
  relu: api("relu"),
  sigmoid: api("sigmoid"),
  softmax: api("softmax"),
  convolution: api("layers.conv2d"),
  pooling: api("layers.maxPooling2d"),
  gradient: api("grad"),
  backpropagation: training,
  "chain-rule": related("grad", "tf.grad: automatic differentiation"),
  "forward-pass": api(
    "tf.LayersModel.predict",
    "model.predict: forward computation",
  ),
  "backward-pass": api("variableGrads"),
  loss: guide(
    "guide/train_models#optimizer_loss_and_metric",
    "Optimizer, loss and metric",
  ),
  mse: api("losses.meanSquaredError"),
  mae: api("metrics.meanAbsoluteError"),
  "binary-crossentropy": api("metrics.binaryCrossentropy"),
  optimizer: api("class:train.Optimizer"),
  "gradient descent": api("train.sgd"),
  sgd: api("train.sgd"),
  "learning-rate": api("train.sgd", "tf.train.sgd: learningRate"),
  epoch: api("tf.LayersModel.fit", "model.fit: epochs"),
  batching: api("tf.LayersModel.fit", "model.fit: batchSize"),
  convergence: google("convergence", "Convergence"),
  "vanishing-gradient": google(
    "vanishing-gradient-problem",
    "Vanishing gradients",
  ),
  accuracy: api("metrics.binaryAccuracy"),
  precision: api("metrics.precision"),
  recall: api("metrics.recall"),
  "false-positive": google("false-positive-fp", "False positives"),
  "false-negative": google("false-negative-fn", "False negatives"),
  threshold: google("classification-threshold", "Classification thresholds"),
  baseline: google("baseline", "Baselines"),
  overfitting: google("overfitting", "Overfitting"),
  logit: api(
    "losses.sigmoidCrossEntropy",
    "tf.losses.sigmoidCrossEntropy: logits",
  ),
  hyperparameter: google("hyperparameter", "Hyperparameters"),
  regularization: api("regularizers.l2"),
  "validation split": api("tf.LayersModel.fit", "model.fit: validationSplit"),
  "confusion matrix": api("confusionMatrix", "tf.math.confusionMatrix"),
  rnn: api("layers.simpleRNN"),
  lstm: api("layers.lstm"),
  gru: api("layers.gru"),
  "hidden-state": api(
    "layers.lstm",
    "tf.layers.lstm: returnState and stateful",
  ),
  "forget-gate": api("layers.lstm", "tf.layers.lstm: unitForgetBias"),
  sequence: api("layers.simpleRNN", "tf.layers.simpleRNN: sequence inputs"),
  "time-series": python(
    "tutorials/structured_data/time_series",
    "Time series forecasting",
  ),
  "sliding-window": api("signal.frame"),
  attention: google("attention", "Attention"),
  "self-attention": google(
    "self-attention-also-called-self-attention-layer",
    "Self-attention",
  ),
  "query-key-value": python(
    "text/tutorials/transformer",
    "Queries, keys and values in attention",
  ),
  "positional-encoding": google("positional-encoding", "Positional encoding"),
  transformer: google("transformer", "Transformers"),
  encoder: google("encoder", "Encoders"),
  decoder: google("decoder", "Decoders"),
  llm: google("large-language-model", "Large language models"),
  rag: google(
    "retrieval-augmented-generation-rag",
    "Retrieval-augmented generation",
  ),
  "few-shot": google("few-shot-prompting", "Few-shot prompting"),
  "prompt-engineering": google("prompt-engineering", "Prompt engineering"),
  embedding: api("layers.embedding"),
  tokenization: google("tokenizer", "Tokenizers"),
  "cosine similarity": related(
    "losses.cosineDistance",
    "tf.losses.cosineDistance: distance from similarity",
  ),
  "one-hot encoding": api("oneHot"),
  "latent space": google("latent-space", "Latent space"),
  GAN: python("tutorials/generative/dcgan", "Generative adversarial networks"),
  diffusion: background(
    "https://keras.io/examples/generative/ddim/",
    "Denoising diffusion models",
    "Keras (Python)",
  ),
  "fourier-transform": api("spectral.fft"),
  fft: api("spectral.fft"),
  stft: api("signal.stft"),
  spectrogram: related("signal.stft", "tf.signal.stft: time-frequency data"),
  frequency: signalTheory,
  windowing: api("signal.hannWindow"),
  "spectral-leakage": signalTheory,
  "main lobe": signalTheory,
  sidelobe: signalTheory,
  dB: signalTheory,
  aliasing: signalTheory,
  anomaly: autoencoders,
  autoencoder: autoencoders,
  "reconstruction-error": autoencoders,
  "supervised learning": training,
  "semi-supervised": google(
    "semi-supervised-learning",
    "Semi-supervised learning",
  ),
  outlier: google("outliers", "Outliers"),
  "kalman-filter": python(
    "probability/api_docs/python/tfp/distributions/LinearGaussianStateSpaceModel",
    "Linear Gaussian state-space models and Kalman filtering",
  ),
  forecasting: python(
    "tutorials/structured_data/time_series",
    "Time series forecasting",
  ),
  ensemble: google("ensemble", "Ensembles"),
  bagging: google("bagging", "Bagging"),
  stacking: background(
    "https://scikit-learn.org/stable/modules/ensemble.html#stacked-generalization",
    "Stacked generalization",
    "scikit-learn (Python)",
  ),
  inference: api("tf.LayersModel.predict", "model.predict"),
  quantization: background(
    "https://github.com/tensorflow/tfjs/blob/master/tfjs-converter/README.md#conversion-flags",
    "Weight quantization options",
    "TensorFlow.js",
  ),
  pruning: python("model_optimization/guide/pruning", "Weight pruning"),
  distillation: google("distillation", "Knowledge distillation"),
  "federated learning": google("federated-learning", "Federated learning"),
  sparsity: api(
    "sparseToDense",
    "tf.sparseToDense: sparse and dense representations",
  ),
  pretrained: guide(
    "guide/models_and_layers#serialization",
    "Saving and loading models",
  ),
  webgl: platforms,
  webgpu: background(
    "https://github.com/tensorflow/tfjs/tree/master/tfjs-backend-webgpu",
    "WebGPU backend",
    "TensorFlow.js",
  ),
  wasm: background(
    "https://github.com/tensorflow/tfjs/tree/master/tfjs-backend-wasm",
    "WebAssembly backend",
    "TensorFlow.js",
  ),
  opset: background(
    "https://onnx.ai/onnx/repo-docs/Versioning.html",
    "Operator set versioning",
    "ONNX",
  ),
  "data-drift": python(
    "tfx/data_validation/get_started#checking_data_skew_and_drift",
    "Checking data skew and drift",
  ),
  "population stability index": background(
    "https://arize.com/glossary/population-stability-index-psi/",
    "Population stability index",
    "Arize",
  ),
  "Kolmogorov-Smirnov": background(
    "https://www.itl.nist.gov/div898/handbook/eda/section3/eda35g.htm",
    "Kolmogorov-Smirnov goodness-of-fit test",
    "NIST",
  ),
  "shadow model": background(
    "https://docs.seldon.ai/seldon-enterprise-platform/product-tour/rollout-strategies/shadow",
    "Shadow deployments",
    "Seldon",
  ),
  canary: background(
    "https://sre.google/workbook/canarying-releases/",
    "Canarying releases",
    "Google SRE",
  ),
  preprocessing: guide(
    "tutorials/training/linear_regression",
    "Preparing data for training",
  ),
  feature: training,
  label: training,
  "feature-engineering": google("feature-engineering", "Feature engineering"),
  "random variable": python(
    "probability/api_docs/python/tfp/distributions/Distribution",
    "Probability distributions",
  ),
  "probability distribution": python(
    "probability/api_docs/python/tfp/distributions/Distribution",
    "Probability distributions",
  ),
  PDF: google("probability-density-function", "Probability density functions"),
  PMF: python(
    "probability/api_docs/python/tfp/distributions/Categorical",
    "Categorical probability mass functions",
  ),
  "expected value": related("mean", "tf.mean: sample averages"),
  "normal distribution": api("randomNormal"),
  "central limit theorem": background(
    "https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm",
    "The normal distribution and central limit theorem",
    "NIST",
  ),
  "conditional probability": python(
    "probability/api_docs/python/tfp/distributions/JointDistributionSequential",
    "Joint and conditional distributions",
  ),
  eigenvector: python(
    "api_docs/python/tf/linalg/eig",
    "Eigenvalues and eigenvectors",
  ),
  SVD: python("api_docs/python/tf/linalg/svd", "Singular value decomposition"),
  PCA: background(
    "https://scikit-learn.org/stable/modules/decomposition.html#pca",
    "Principal component analysis",
    "scikit-learn (Python)",
  ),
  "low-rank approximation": python(
    "api_docs/python/tf/linalg/svd",
    "Singular values for matrix approximation",
  ),
};

// Instance methods that are unambiguous in the course's tensor examples.
// Do not infer generic .map(), .add() or .fit(): other libraries share them.
const tensorMethods = new Set(["array", "arraySync", "dataSync", "bufferSync"]);

export function findTensorFlowReferences(
  text: string,
): DocumentationReference[] {
  const references = new Map<string, DocumentationReference>();
  for (const match of text.matchAll(/\btf\.[A-Za-z]\w*(?:\.[A-Za-z]\w*)*/g)) {
    const reference = tfjsApiReference(match[0]);
    if (reference) references.set(reference.href, reference);
  }
  for (const match of text.matchAll(
    /\.(arraySync|array|dataSync|bufferSync)\s*\(/g,
  )) {
    if (!tensorMethods.has(match[1]!)) continue;
    const reference = api(`tf.Tensor.${match[1]}`);
    references.set(reference.href, reference);
  }
  for (const match of text.matchAll(
    /\bmodel\.(fit|fitDataset|evaluate|evaluateDataset|compile|summary)\s*\(/g,
  )) {
    const reference = api(`tf.LayersModel.${match[1]}`);
    references.set(reference.href, reference);
  }
  return [...references.values()];
}
