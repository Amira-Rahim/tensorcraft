/**
 * Curated ML glossary for Tensorcraft.
 *
 * Terms are drawn from the `keywords` of deep-orbit lessons (the only themes in
 * the build) plus a few foundational entries. Definitions are learner-facing
 * refreshers: one or two plain sentences, no em dashes (style bible rule 6).
 *
 * Used to auto-underline concept terms in lesson prose and to feed a concept rail.
 */

export interface GlossaryEntry {
  /** Canonical display form, e.g. "rank". */
  term: string;
  /** One or two plain sentences. No em dashes. */
  definition: string;
  /** Extra surface forms to match in prose, e.g. ["ranks"]. */
  aliases?: string[];
  /** "global" ML term, or a theme slug for theme-specific terms. */
  scope?: "global" | string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Foundations: tensors and their structure
  {
    term: "tensor",
    definition:
      "A multi-dimensional array of numbers with optional GPU acceleration. It is the core data structure in TensorFlow.js.",
    aliases: ["tensors"],
    scope: "global",
  },
  {
    term: "rank",
    definition:
      "The number of dimensions (axes) a tensor has: a scalar is rank 0, a vector rank 1, a matrix rank 2. Distinct from matrix rank in linear algebra, which counts the independent directions a matrix preserves.",
    aliases: ["ranks"],
    scope: "global",
  },
  {
    term: "matrix rank",
    definition:
      "The number of independent directions a matrix preserves, distinct from tensor rank, which counts axes. Full rank means no direction collapses to zero; a rank-deficient matrix collapses some directions and loses information.",
    aliases: ["full rank", "full-rank", "rank-deficient"],
    scope: "global",
  },
  {
    term: "shape",
    definition:
      "The size of a tensor along each axis, written as a list like [2, 3].",
    aliases: ["shapes"],
    scope: "global",
  },
  {
    term: "dimensions",
    definition:
      "The independent axes of a tensor along which its values are arranged. A 2D tensor has rows and columns.",
    aliases: ["dimension"],
    scope: "global",
  },
  {
    term: "typed-array",
    definition:
      "A fixed-type JavaScript array such as Float32Array that stores numbers compactly and backs a tensor in memory.",
    aliases: ["typed array", "typed-arrays"],
    scope: "global",
  },
  {
    term: "row-major",
    definition:
      "A memory layout where the values of each row are stored next to each other before moving to the next row.",
    aliases: ["row major"],
    scope: "deep-orbit",
  },

  // Core operations
  {
    term: "matmul",
    definition:
      "Matrix multiplication, the operation that combines two matrices by taking dot products of rows and columns.",
    aliases: ["matrix multiplication", "matmuls"],
    scope: "global",
  },
  {
    term: "weighted-sum",
    definition:
      "Adding up inputs after multiplying each by its own weight. It is the basic computation inside a neuron.",
    aliases: ["weighted sum"],
    scope: "global",
  },
  {
    term: "normalization",
    definition:
      "Rescaling values so they share a common range or distribution, which helps a model train faster and more stably.",
    aliases: ["normalize", "normalizing"],
    scope: "global",
  },
  {
    term: "z-score",
    definition:
      "A value rescaled by subtracting the mean and dividing by the standard deviation, so it is measured in units of spread.",
    aliases: ["z score", "z-scores"],
    scope: "global",
  },
  {
    term: "smoothing",
    definition:
      "Reducing short-term noise in a signal or series so the underlying trend is easier to see.",
    scope: "deep-orbit",
  },

  // Neural network building blocks
  {
    term: "neuron",
    definition:
      "A single unit that takes a weighted sum of its inputs, adds a bias, and applies an activation function.",
    aliases: ["neurons"],
    scope: "global",
  },
  {
    term: "layer",
    definition:
      "A group of neurons that transforms its inputs together and passes the result to the next layer.",
    aliases: ["layers"],
    scope: "global",
  },
  {
    term: "dense",
    definition:
      "A layer where every input connects to every neuron, also called a fully connected layer.",
    aliases: ["dense layer", "fully connected"],
    scope: "global",
  },
  {
    term: "weights",
    definition:
      "The learned numbers a model multiplies its inputs by. Training adjusts them to reduce error.",
    aliases: ["weight"],
    scope: "global",
  },
  {
    term: "bias",
    definition:
      "A learned constant added to a neuron's weighted sum, letting the output shift independently of the inputs.",
    aliases: ["biases"],
    scope: "global",
  },
  {
    term: "activation",
    definition:
      "A function applied to a neuron's output that introduces nonlinearity, such as ReLU or sigmoid.",
    aliases: ["activations", "activation function"],
    scope: "global",
  },
  {
    term: "nonlinearity",
    definition:
      "A nonlinear step that lets a network learn curved relationships rather than only straight-line ones.",
    aliases: ["non-linearity"],
    scope: "global",
  },
  {
    term: "relu",
    definition:
      "Rectified Linear Unit, an activation that outputs the input when positive and zero otherwise.",
    aliases: ["ReLU"],
    scope: "global",
  },
  {
    term: "sigmoid",
    definition:
      "An activation that squashes any number into the range 0 to 1, often used for probabilities.",
    scope: "global",
  },

  // Training loop and optimization
  {
    term: "gradient",
    definition:
      "The direction and rate at which the loss changes as a weight changes. It tells training which way to adjust.",
    aliases: ["gradients"],
    scope: "global",
  },
  {
    term: "backpropagation",
    definition:
      "The algorithm that computes gradients for every weight by applying the chain rule backward through the network.",
    aliases: ["backprop"],
    scope: "global",
  },
  {
    term: "chain-rule",
    definition:
      "The calculus rule for differentiating composed functions, which backpropagation uses to pass gradients through layers.",
    aliases: ["chain rule"],
    scope: "global",
  },
  {
    term: "forward-pass",
    definition: "Running inputs through the network to produce a prediction.",
    aliases: ["forward pass"],
    scope: "global",
  },
  {
    term: "backward-pass",
    definition:
      "Propagating the loss gradient back through the network to update the weights.",
    aliases: ["backward pass"],
    scope: "global",
  },
  {
    term: "loss",
    definition:
      "A single number measuring how wrong the model's predictions are. Training tries to make it smaller.",
    aliases: ["loss function"],
    scope: "global",
  },
  {
    term: "mse",
    definition:
      "Mean squared error, a loss that averages the squared differences between predictions and targets.",
    aliases: ["mean squared error"],
    scope: "global",
  },
  {
    term: "binary-crossentropy",
    definition:
      "A loss for two-class problems that penalizes confident wrong predictions of a yes or no label.",
    aliases: ["binary cross-entropy", "binary crossentropy"],
    scope: "global",
  },
  {
    term: "optimizer",
    definition:
      "The algorithm that updates weights from gradients, such as stochastic gradient descent or Adam.",
    aliases: ["optimizers"],
    scope: "global",
  },
  {
    term: "gradient descent",
    definition:
      "An optimization method that repeatedly steps the weights in the direction that lowers the loss.",
    aliases: ["descent"],
    scope: "global",
  },
  {
    term: "sgd",
    definition:
      "Stochastic gradient descent: gradient descent where each update uses the gradient from a random mini-batch instead of the full dataset, making steps noisy but cheap.",
    aliases: ["SGD", "stochastic gradient descent"],
    scope: "global",
  },
  {
    term: "learning-rate",
    definition:
      "How big a step the optimizer takes on each update. Too high overshoots, too low trains slowly.",
    aliases: ["learning rate"],
    scope: "global",
  },
  {
    term: "epoch",
    definition:
      "One full pass of the optimizer over the entire training dataset.",
    aliases: ["epochs"],
    scope: "global",
  },
  {
    term: "batching",
    definition:
      "Grouping training examples so the model processes several at once, which is faster and steadier than one at a time.",
    aliases: ["batch", "batches"],
    scope: "global",
  },
  {
    term: "convergence",
    definition:
      "The point where further training stops meaningfully reducing the loss.",
    aliases: ["converge"],
    scope: "global",
  },
  {
    term: "vanishing-gradient",
    definition:
      "When gradients shrink toward zero as they flow back through many layers, stalling learning in early layers.",
    aliases: ["vanishing gradients", "vanishing gradient"],
    scope: "global",
  },

  // Evaluation
  {
    term: "accuracy",
    definition: "The fraction of predictions a model gets right.",
    scope: "global",
  },
  {
    term: "precision",
    definition:
      "Of the items the model flagged as positive, the fraction that truly were positive.",
    scope: "global",
  },
  {
    term: "recall",
    definition:
      "Of all the truly positive items, the fraction the model managed to flag.",
    scope: "global",
  },
  {
    term: "false-positive",
    definition:
      "A case the model flagged as positive that was actually negative, also called a false alarm.",
    aliases: ["false positive", "false positives"],
    scope: "global",
  },
  {
    term: "false-negative",
    definition: "A truly positive case the model missed and labeled negative.",
    aliases: ["false negative", "false negatives"],
    scope: "global",
  },
  {
    term: "threshold",
    definition:
      "The cutoff score above which a model's output is treated as a positive prediction.",
    aliases: ["thresholds"],
    scope: "global",
  },
  {
    term: "baseline",
    definition:
      "A simple reference model or score that a real model must beat to prove it adds value.",
    aliases: ["baselines"],
    scope: "global",
  },
  {
    term: "overfitting",
    definition:
      "When a model memorizes its training data and fails to generalize to new examples.",
    aliases: ["overfit", "overfits"],
    scope: "global",
  },

  // Sequence models and memory
  {
    term: "rnn",
    definition:
      "A recurrent neural network, which processes a sequence step by step while carrying a hidden state.",
    aliases: ["RNN", "recurrent"],
    scope: "global",
  },
  {
    term: "lstm",
    definition:
      "A long short-term memory network, an RNN with gates that help it remember information over long sequences.",
    aliases: ["LSTM"],
    scope: "global",
  },
  {
    term: "gru",
    definition:
      "A gated recurrent unit, a streamlined RNN cell with fewer gates than an LSTM.",
    aliases: ["GRU"],
    scope: "global",
  },
  {
    term: "hidden-state",
    definition:
      "The running summary a recurrent network carries from one time step to the next.",
    aliases: ["hidden state"],
    scope: "global",
  },
  {
    term: "forget-gate",
    definition:
      "The part of an LSTM that decides how much of the previous memory to keep or discard.",
    aliases: ["forget gate"],
    scope: "global",
  },
  {
    term: "sequence",
    definition:
      "An ordered list of values, such as words in a sentence or readings over time.",
    aliases: ["sequences"],
    scope: "global",
  },
  {
    term: "time-series",
    definition:
      "Data recorded in time order, where the sequence of points carries meaning.",
    aliases: ["time series"],
    scope: "deep-orbit",
  },
  {
    term: "sliding-window",
    definition:
      "Taking fixed-length chunks from a sequence by moving a window along it one step at a time.",
    aliases: ["sliding window"],
    scope: "deep-orbit",
  },

  // Attention and language models
  {
    term: "attention",
    definition:
      "A mechanism that lets a model weigh which parts of the input matter most for each output.",
    scope: "global",
  },
  {
    term: "self-attention",
    definition:
      "Attention applied within a single sequence so each position can draw on every other position.",
    aliases: ["self attention"],
    scope: "global",
  },
  {
    term: "query-key-value",
    definition:
      "The three projections attention uses: a query asks what to look for, keys advertise content, values carry it.",
    aliases: ["query key value", "QKV"],
    scope: "global",
  },
  {
    term: "transformer",
    definition:
      "A sequence model built entirely from attention rather than recurrence, the basis of modern language models.",
    aliases: ["transformers"],
    scope: "global",
  },
  {
    term: "encoder",
    definition:
      "The part of a model that turns an input into an internal representation.",
    aliases: ["encoders"],
    scope: "global",
  },
  {
    term: "decoder",
    definition:
      "The part of a model that turns an internal representation into an output, often one step at a time.",
    aliases: ["decoders"],
    scope: "global",
  },
  {
    term: "llm",
    definition:
      "A large language model, a transformer trained on huge text corpora to predict and generate language.",
    aliases: ["LLM", "language model"],
    scope: "global",
  },
  {
    term: "rag",
    definition:
      "Retrieval-augmented generation, which fetches relevant documents and feeds them to a language model for grounded answers.",
    aliases: ["RAG", "retrieval-augmented generation"],
    scope: "global",
  },
  {
    term: "few-shot",
    definition:
      "Prompting a model with a handful of examples so it infers the task without retraining.",
    aliases: ["few shot"],
    scope: "global",
  },
  {
    term: "prompt-engineering",
    definition:
      "Crafting the wording and structure of a prompt to steer a language model toward better outputs.",
    aliases: ["prompt engineering"],
    scope: "global",
  },

  // Signal processing (deep-orbit specific)
  {
    term: "fourier-transform",
    definition:
      "A method that decomposes a signal into the frequencies that make it up.",
    aliases: ["fourier transform"],
    scope: "deep-orbit",
  },
  {
    term: "fft",
    definition:
      "Fast Fourier Transform, an efficient algorithm for computing the Fourier transform of a sampled signal.",
    aliases: ["FFT"],
    scope: "deep-orbit",
  },
  {
    term: "stft",
    definition:
      "Short-time Fourier transform, which runs an FFT over short overlapping windows to show how frequencies change over time.",
    aliases: ["STFT"],
    scope: "deep-orbit",
  },
  {
    term: "spectrogram",
    definition:
      "A visual map of how a signal's frequency content varies over time.",
    aliases: ["spectrograms"],
    scope: "deep-orbit",
  },
  {
    term: "frequency",
    definition: "How many times a repeating pattern cycles per unit of time.",
    aliases: ["frequencies"],
    scope: "deep-orbit",
  },
  {
    term: "windowing",
    definition:
      "Multiplying a signal segment by a tapering function before an FFT to reduce leakage from its edges.",
    aliases: ["window"],
    scope: "deep-orbit",
  },
  {
    term: "spectral-leakage",
    definition:
      "Smearing of a signal's energy across nearby frequencies that happens when a window cuts off mid-cycle.",
    aliases: ["spectral leakage"],
    scope: "deep-orbit",
  },

  // Anomaly detection and forecasting (deep-orbit specific)
  {
    term: "anomaly",
    definition: "A data point that departs sharply from the expected pattern.",
    aliases: ["anomalies", "anomaly detection"],
    scope: "deep-orbit",
  },
  {
    term: "autoencoder",
    definition:
      "A network that learns to compress data and reconstruct it, used to flag inputs it cannot rebuild well.",
    aliases: ["autoencoders"],
    scope: "global",
  },
  {
    term: "reconstruction-error",
    definition:
      "How far an autoencoder's rebuilt output is from the original input, used as an anomaly score.",
    aliases: ["reconstruction error"],
    scope: "deep-orbit",
  },
  {
    term: "outlier",
    definition: "An observation far from the bulk of the data.",
    aliases: ["outliers"],
    scope: "global",
  },
  {
    term: "kalman-filter",
    definition:
      "A recursive estimator that blends noisy measurements with a motion model to track a hidden state over time.",
    aliases: ["kalman filter"],
    scope: "deep-orbit",
  },
  {
    term: "forecasting",
    definition: "Predicting future values of a series from its past.",
    aliases: ["forecast"],
    scope: "deep-orbit",
  },

  // Ensembles
  {
    term: "ensemble",
    definition:
      "Combining several models so their pooled prediction beats any single one.",
    aliases: ["ensembles"],
    scope: "global",
  },
  {
    term: "bagging",
    definition:
      "An ensemble method that trains models on random resamples of the data and averages their predictions.",
    scope: "global",
  },
  {
    term: "stacking",
    definition:
      "An ensemble method where a final model learns how to combine the outputs of several base models.",
    scope: "global",
  },

  // Deployment and performance
  {
    term: "inference",
    definition:
      "Running a trained model to make predictions, as opposed to training it.",
    scope: "global",
  },
  {
    term: "quantization",
    definition:
      "Storing model weights at lower numeric precision, such as int8, to shrink size and speed up inference.",
    aliases: ["quantize", "quantized"],
    scope: "global",
  },
  {
    term: "pruning",
    definition:
      "Removing weights or neurons that contribute little, making a model smaller and faster.",
    aliases: ["prune", "pruned"],
    scope: "global",
  },
  {
    term: "sparsity",
    definition:
      "The fraction of a model's weights that are zero. Higher sparsity can mean smaller, faster models.",
    aliases: ["sparse"],
    scope: "global",
  },
  {
    term: "pretrained",
    definition:
      "A model already trained on a large dataset that you reuse instead of training from scratch.",
    aliases: ["pre-trained"],
    scope: "global",
  },
  {
    term: "webgl",
    definition:
      "A browser graphics API that TensorFlow.js can use to run tensor math on the GPU.",
    aliases: ["WebGL"],
    scope: "global",
  },
  {
    term: "webgpu",
    definition:
      "A newer browser GPU API that offers faster, more general compute than WebGL for in-browser models.",
    aliases: ["WebGPU"],
    scope: "global",
  },
  {
    term: "wasm",
    definition:
      "WebAssembly, a fast low-level browser runtime TensorFlow.js can use when no GPU is available.",
    aliases: ["WASM", "WebAssembly"],
    scope: "global",
  },
  {
    term: "data-drift",
    definition:
      "When the statistics of incoming data shift away from what a model was trained on, degrading its accuracy.",
    aliases: ["data drift"],
    scope: "global",
  },
  {
    term: "preprocessing",
    definition:
      "Cleaning and transforming raw data into the form a model expects before training or inference.",
    aliases: ["preprocess"],
    scope: "global",
  },
  {
    term: "feature-engineering",
    definition:
      "Creating informative input features from raw data to help a model learn.",
    aliases: ["feature engineering"],
    scope: "global",
  },

  // Math deep-dive: statistics of signals
  {
    term: "random variable",
    definition:
      "A quantity whose individual outcomes are unpredictable but whose long-run pattern is stable, like request latency or a sensor reading. Described by a probability distribution.",
    aliases: ["random variables"],
    scope: "global",
  },
  {
    term: "probability distribution",
    definition:
      "The full description of which values a random variable takes and how often. Discrete variables use a PMF, continuous ones a PDF.",
    aliases: ["probability distributions", "distribution"],
    scope: "global",
  },
  {
    term: "PDF",
    definition:
      "Probability density function, the continuous distribution curve. Density is probability per unit of width, so only areas under the curve are probabilities and the peak can exceed 1.",
    aliases: ["probability density function"],
    scope: "global",
  },
  {
    term: "PMF",
    definition:
      "Probability mass function, the discrete distribution table. Maps each outcome to its probability, with all entries summing to 1.",
    aliases: ["probability mass function"],
    scope: "global",
  },
  {
    term: "expected value",
    definition:
      "The probability-weighted average of a random variable over all outcomes. Sample means estimate it, and every ML loss is an expected value estimated by a batch average.",
    aliases: ["expectation"],
    scope: "global",
  },
  {
    term: "normal distribution",
    definition:
      "The bell-curve distribution, also called Gaussian, described entirely by its center (mean) and spread (standard deviation). Sums of many small independent effects tend toward it.",
    aliases: ["Gaussian", "Gaussian distribution", "bell curve"],
    scope: "global",
  },
  {
    term: "central limit theorem",
    definition:
      "Averages of many independent random effects approach a Normal distribution regardless of the source distribution. It is why Gaussian assumptions and z-score thresholds are usually reasonable, and it fails under heavy tails or correlated inputs.",
    aliases: ["CLT"],
    scope: "global",
  },
  {
    term: "conditional probability",
    definition:
      "The probability of one event given that another happened, written P(A | B). Computed by restricting attention to outcomes where B is true and renormalizing.",
    aliases: ["conditional probabilities"],
    scope: "global",
  },

  // Math deep-dive: eigenvectors, SVD, compression
  {
    term: "eigenvector",
    definition:
      "A direction a matrix scales without rotating. The scale factor is its eigenvalue, and the largest one dominates repeated multiplication, which drives both power iteration and exploding or vanishing gradients.",
    aliases: ["eigenvectors", "eigenvalue", "eigenvalues"],
    scope: "global",
  },
  {
    term: "SVD",
    definition:
      "Singular Value Decomposition, which factors any matrix into rotate, scale, rotate. Keeping only the largest scale factors gives the best possible low-rank compression of the matrix.",
    aliases: ["singular value decomposition"],
    scope: "global",
  },
  {
    term: "PCA",
    definition:
      "Principal Component Analysis, the result of applying SVD to centered data. It sorts perpendicular directions through the data by variance so the top few can stand in for the rest.",
    aliases: ["principal component analysis", "principal components"],
    scope: "global",
  },
  {
    term: "low-rank approximation",
    definition:
      "Replacing a large matrix with the product of much smaller factors that keep only its most important directions. The mathematical basis for model compression and low-rank fine-tuning.",
    aliases: ["low-rank", "low rank"],
    scope: "global",
  },
];
