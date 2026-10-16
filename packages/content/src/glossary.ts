/**
 * Curated ML glossary for Tensorcraft.
 *
 * Terms are drawn from the `keywords` of lessons across all five built worlds,
 * plus a few foundational entries. Definitions are learner-facing refreshers:
 * one or two plain sentences, no em dashes (style bible rule 6). Note that
 * `scope` is documentation only: the build matches the whole dictionary
 * against every world.
 *
 * Used to auto-underline concept terms in lesson prose and to fill the
 * Takeaways step's terms list ("Terms in this lesson").
 */

import {
  CONCEPT_DOCUMENTATION,
  type DocumentationReference,
} from "./documentation";

export interface GlossaryEntry {
  /** Canonical display form, e.g. "rank". */
  term: string;
  /** One or two plain sentences. No em dashes. */
  definition: string;
  /** Extra surface forms to match in prose, e.g. ["ranks"]. */
  aliases?: string[];
  /** "global" ML term, or a world slug for world-specific terms. */
  scope?: "global" | string;
  documentation?: DocumentationReference;
}

export const GLOSSARY: GlossaryEntry[] = [
  // Foundations: tensors and their structure
  {
    term: "tensor",
    definition:
      "An array of numbers that TensorFlow.js uses for calculations and model inputs. Its values can form a list, a grid, or a layout with more axes.",
    aliases: ["tensors"],
    scope: "global",
  },
  {
    term: "rank",
    definition:
      "The number of axes a tensor has: one number has rank 0, a list has rank 1, and a grid has rank 2. Matrix rank in linear algebra is a different count: the number of independent rows or columns.",
    aliases: ["ranks"],
    scope: "global",
  },
  {
    term: "matrix rank",
    definition:
      "The number of linearly independent columns or rows of a matrix. Full rank means rank equals the smaller matrix dimension; a wide full-rank matrix can still map nonzero inputs to zero.",
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
      "The axes along which values are arranged. A list has one axis; a grid has two, rows and columns.",
    aliases: ["dimension"],
    scope: "global",
  },
  {
    term: "typed-array",
    definition:
      "A JavaScript view of a buffer with a fixed numeric element type, such as Float32Array. TensorFlow.js accepts typed arrays as input; a GPU backend may store the tensor in a different representation.",
    aliases: ["typed array", "typed-arrays"],
    scope: "global",
  },
  {
    term: "row-major",
    definition:
      "Reading or arranging values one row at a time, from left to right, before moving to the next row.",
    aliases: ["row major"],
    scope: "deep-orbit",
  },

  // Core operations
  {
    term: "matmul",
    definition:
      "Matrix multiplication: multiply each value in a row by its matching value in a column, then add the products.",
    aliases: ["matrix multiplication", "matmuls"],
    scope: "global",
  },
  {
    term: "broadcasting",
    definition:
      "Applying a smaller tensor across a larger one, such as subtracting the same two means from every row of a [5, 2] grid. Shapes match from right to left: sizes must be equal or one must be 1, with missing axes treated as size 1.",
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
      "Putting values on a chosen scale, such as 0 to 1. Calculate any learned scaling statistics from training data, then reuse them for new readings.",
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
    term: "standard deviation",
    definition:
      "The typical distance of a value from the mean, the square root of the variance. Dividing by it measures a feature in units of its own spread, which is what a z-score is.",
    aliases: ["standard deviations", "std"],
    scope: "global",
  },
  {
    term: "variance",
    definition:
      "The average squared distance of the values from their mean. Its square root is the standard deviation, and tf.moments returns the mean and the variance in one call.",
    aliases: ["variances"],
    scope: "global",
  },
  {
    term: "regression",
    definition:
      "Predicting a number on a continuous scale, such as the next reading's value, rather than picking a class. Logistic regression is a classifier despite its name.",
    scope: "global",
  },
  {
    term: "classification",
    definition:
      "Predicting which label or labels apply to an example. Cross-entropy is a common loss, but the choice depends on the task and output format.",
    aliases: ["classifications"],
    scope: "global",
  },
  {
    term: "y-hat",
    definition:
      "The model's prediction for one example, written with a hat to tell it from y, the true value it is scored against.",
    aliases: ["ŷ"],
    scope: "global",
  },
  {
    term: "sigma-prime",
    definition:
      "The derivative of sigmoid at z: sigmoid(z) times (1 - sigmoid(z)), at most 0.25. Repeated small derivative factors can contribute to vanishing gradients.",
    aliases: ["σ'"],
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
      "A single unit that takes a weighted sum of its inputs and adds a bias. In a built layer, an activation function usually follows that sum.",
    aliases: ["neurons"],
    scope: "global",
  },
  {
    term: "layer",
    definition:
      "A named stage in a model. It transforms its input and passes the result on. In a dense layer that stage is a group of neurons; other layers reshape, drop, or convolve instead.",
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
      "The learned numbers a model multiplies its inputs by. Training adjusts the weights to reduce error.",
    aliases: ["weight"],
    scope: "global",
  },
  {
    term: "bias",
    definition:
      "A learned constant added to a neuron's weighted sum, letting the output shift independently of the inputs. Distinct from bias in the fairness sense, which is a systematic gap in how well a model performs for different groups of people.",
    aliases: ["biases"],
    scope: "global",
  },
  {
    term: "activation",
    definition:
      "A function applied to a layer's output. Nonlinear activations such as ReLU let stacked dense layers represent more than one affine calculation; a linear activation leaves values unchanged.",
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
  {
    term: "softmax",
    definition:
      "A function that turns a row of raw scores into probabilities that add up to 1. The largest score keeps the largest share, and the gaps between scores decide how confident the result looks.",
    scope: "global",
  },
  {
    term: "convolution",
    definition:
      "Applying shared kernel weights at successive positions to form output features. In image models, padding and stride determine which neighborhoods are covered and the output shape.",
    aliases: ["convolutional", "conv layer"],
    scope: "global",
  },
  {
    term: "pooling",
    definition:
      "Shrinking a feature map by summarizing each small block with one value, usually its maximum. It cuts the amount of data downstream layers carry and makes the result less sensitive to a few pixels of shift.",
    aliases: ["max pooling", "pool"],
    scope: "global",
  },

  // Training loop and optimization
  {
    term: "gradient",
    definition:
      "A list of slopes, one per parameter, showing how each affects a single output such as loss. Under ordinary Euclidean distance, its negative points toward the steepest local decrease; a large step can still increase the loss.",
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
      "The rule for finding how a change passes through nested functions: multiply their local derivatives. Backpropagation applies this rule through the network.",
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
      "Working backward from the loss to calculate parameter gradients. The optimizer uses those gradients to change the weights afterward.",
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
    term: "mae",
    definition:
      "Mean absolute error: average the sizes of the prediction errors, ignoring their signs. It uses the target's units; MSE squares the errors instead.",
    aliases: ["MAE", "mean absolute error"],
    scope: "global",
  },
  {
    term: "binary-crossentropy",
    definition:
      "A loss for two-class problems. It penalizes confident wrong predictions of a yes or no label.",
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
      "Updating parameters by taking a step opposite their loss gradients. A step that is too large can overshoot or increase the loss.",
    aliases: ["descent"],
    scope: "global",
  },
  {
    term: "sgd",
    definition:
      "Stochastic gradient descent estimates each update from one sampled example or a mini-batch. The estimate costs less per update than using the full dataset and can vary between samples.",
    aliases: ["SGD", "stochastic gradient descent"],
    scope: "global",
  },
  {
    term: "learning-rate",
    definition:
      "A setting that scales each optimizer update. Too large can overshoot or make loss grow; too small can make training slow.",
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
      "Grouping examples so a model processes several together. Batch size changes memory use, speed, and the training updates; larger is not always better.",
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
      "Of the items the model flagged as positive, the fraction that truly were positive. Distinct from numeric precision, which is how many bits a number is stored in.",
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
      "A cutoff used to turn a score into a decision. The decision rule must specify which side is positive and what happens at equality.",
    aliases: ["thresholds"],
    scope: "global",
  },
  {
    term: "baseline",
    definition:
      "A reference model, rule or measurement used for comparison. Compare candidates on the same data and relevant costs; keeping a simpler baseline can be the best outcome.",
    aliases: ["baselines"],
    scope: "global",
  },
  {
    term: "overfitting",
    definition:
      "Fitting patterns specific to the training data that do not generalize well to new examples. It need not mean literal memorization.",
    aliases: ["overfit", "overfits"],
    scope: "global",
  },
  {
    term: "logit",
    definition:
      "A raw model score before sigmoid or softmax, which can be negative or positive without fixed bounds. A loss that expects logits applies the output activation itself; a loss that expects probabilities needs it applied already.",
    aliases: ["logits"],
    scope: "global",
  },
  {
    term: "hyperparameter",
    definition:
      "A setting you choose for a model or training run, such as layer size or learning rate. It is separate from the weights learned by ordinary training updates and can be tuned using validation data.",
    aliases: ["hyperparameters"],
    scope: "global",
  },
  {
    term: "regularization",
    definition:
      "Methods that constrain fitting or favor particular solutions, such as weight penalties, dropout or early stopping. They aim to improve generalization but do not guarantee a better held-out score.",
    aliases: ["regularize", "regularized"],
    scope: "global",
  },
  {
    term: "validation split",
    definition:
      "Data kept out of weight updates and used to guide choices such as when to stop training. TensorFlow.js validationSplit takes the last rows, so choose their order carefully and preserve any time or group boundaries.",
    aliases: ["validation set", "validationSplit"],
    scope: "global",
  },
  {
    term: "confusion matrix",
    definition:
      "A table counting predicted classes against recorded classes. Check the row and column labels before deriving accuracy, precision or recall.",
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
      "A recurrent cell with update and reset gates and no separate cell state. The update gate mixes the previous hidden state with a new candidate; the reset gate controls the previous-state information used to form that candidate.",
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
      "Taking fixed-length chunks from a sequence by advancing a window by a chosen stride. Adjacent chunks overlap when the stride is shorter than the window.",
    aliases: ["sliding window"],
    scope: "deep-orbit",
  },

  // Attention and language models
  {
    term: "attention",
    definition:
      "Scoring which input representations to use, then combining their values with weights derived from those scores. A large weight shows a contribution to the combination, not proof of a physical cause.",
    scope: "global",
  },
  {
    term: "self-attention",
    definition:
      "Attention whose queries, keys and values come from the same sequence. Masks can restrict which positions each query may use, such as blocking future tokens in a decoder.",
    aliases: ["self attention"],
    scope: "global",
  },
  {
    term: "query-key-value",
    definition:
      "In attention, queries and keys are compared to obtain scores; the resulting weights combine values. These vectors are commonly learned projections of model representations.",
    aliases: ["query key value", "QKV"],
    scope: "global",
  },
  {
    term: "positional-encoding",
    definition:
      "Information that lets a model distinguish positions or relative distances. Methods include added position vectors and transformations of attention queries and keys.",
    aliases: ["positional encoding", "positional encodings"],
    scope: "global",
  },
  {
    term: "transformer",
    definition:
      "A model architecture using attention alongside feed-forward layers, residual connections and normalization. Many language models use transformer encoders, decoders or both.",
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
      "A large model trained to process or generate language, commonly using a transformer. Next-token prediction is a common training objective, often followed by additional training.",
    aliases: ["LLM", "language model"],
    scope: "global",
  },
  {
    term: "rag",
    definition:
      "Retrieval-augmented generation: retrieve relevant records or passages, then supply them as context for a generated answer. Retrieval and citations do not guarantee accurate claims.",
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

  // Representations: embeddings and encodings
  {
    term: "embedding",
    definition:
      "A vector representation of an item such as a word, image or record. Similarity in the vector space reflects the representation and training objective; it must be evaluated for the intended use.",
    aliases: ["embeddings", "embedding space"],
    scope: "global",
  },
  {
    term: "tokenization",
    definition:
      "Converting text to units a model reads and their IDs. Subword and byte methods can represent many unseen words; coverage and unknown-token behavior depend on the tokenizer.",
    aliases: ["tokenize", "tokenized", "tokenizing"],
    scope: "global",
  },
  {
    term: "cosine similarity",
    definition:
      "The dot product of two nonzero vectors divided by their lengths, ranging from -1 to 1. It measures direction, not meaning by itself; its usefulness depends on the representation.",
    scope: "global",
  },
  {
    term: "one-hot encoding",
    definition:
      "Representing a category as a vector of zeros with a single 1 in the slot for that category. Every category sits the same distance from every other, so the encoding carries no notion of similarity.",
    aliases: ["one-hot", "one hot"],
    scope: "global",
  },
  {
    term: "latent space",
    definition:
      "An internal representation space learned by a model. Nearby representations may produce similar outputs, but this depends on training and is not a universal guarantee.",
    aliases: ["latent", "latent vector"],
    scope: "global",
  },

  // Generative models
  {
    term: "GAN",
    definition:
      "A generative adversarial network trains a generator against a discriminator that distinguishes generated samples from training examples. The competing objectives do not guarantee stable training or useful outputs.",
    aliases: ["GANs", "generative adversarial network"],
    scope: "global",
  },
  {
    term: "diffusion",
    definition:
      "A family of generative methods that learns to reverse a process that adds noise. Sampling uses the learned denoising process, often starting from noise; outputs can include images, audio or other data.",
    aliases: ["diffusion model", "denoising"],
    scope: "global",
  },

  // Signal processing (deep-orbit specific)
  {
    term: "fourier-transform",
    definition:
      "Expressing a signal as a combination of waves at different frequencies, with an amplitude and phase for each. Peaks in a short recording alone do not prove there are separate physical sources.",
    aliases: ["fourier transform"],
    scope: "deep-orbit",
  },
  {
    term: "fft",
    definition:
      "Fast Fourier Transform: an efficient way to calculate the discrete Fourier transform. It turns a finite list of samples into frequency bins, each representing a frequency in the calculation.",
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
      "Multiplying a signal segment by a tapering function before an FFT to reduce leakage from the segment's edges.",
    aliases: ["windowed", "window function"],
    scope: "deep-orbit",
  },
  {
    term: "spectral-leakage",
    definition:
      "A tone spreading into several frequency bins when only a short recording is analyzed. It often occurs when the recording does not contain a whole number of cycles.",
    aliases: ["spectral leakage"],
    scope: "deep-orbit",
  },
  {
    term: "main lobe",
    definition:
      "The main cluster of frequency bins around a tone after windowing. A wider cluster makes nearby tones harder to tell apart.",
    aliases: ["main lobes", "mainlobe"],
    scope: "deep-orbit",
  },
  {
    term: "sidelobe",
    definition:
      "A smaller peak in a window's spectrum, away from its main peak. Its height and decay describe how much leakage reaches other frequencies, rather than a cutoff where leakage ends.",
    aliases: ["sidelobes", "side lobe", "side lobes"],
    scope: "deep-orbit",
  },
  {
    term: "dB",
    definition:
      "Decibels express a ratio logarithmically: 10 log10 for power ratios, or 20 log10 for amplitude ratios when power is proportional to amplitude squared. Under that assumption, -20 dB means one tenth the amplitude.",
    aliases: ["decibel", "decibels"],
    scope: "deep-orbit",
  },
  {
    term: "aliasing",
    definition:
      "A frequency above half the sample rate folds down and appears at a lower, wrong one. Sampled at 128 Hz, a 73.4 Hz tone peaks near 54.6 Hz.",
    aliases: ["aliased"],
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
      "A network trained to reconstruct an input through an internal representation, often with a bottleneck or other constraint. Reconstruction error can be used as an anomaly score after validation.",
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
    term: "supervised learning",
    definition:
      "Learning from examples with target labels. Training adjusts the model to reduce a loss that compares its predictions with those labels.",
    aliases: ["supervised"],
    scope: "global",
  },
  {
    term: "semi-supervised",
    definition:
      "Learning from a mixture of labeled and unlabeled training examples. Some anomaly-detection literature also uses this term for training on examples known to be normal; that narrower usage should be stated explicitly.",
    aliases: ["semi-supervised learning"],
    scope: "global",
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
      "Estimating an unseen state by predicting it, then combining that prediction with measurements according to their uncertainties. The basic Kalman filter assumes linear relationships for both the state changes and measurements.",
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
      "Combining predictions from several models. Different errors can make the combination useful, but neither diversity nor averaging guarantees beating the best member.",
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
      "Using fewer bits to represent weights or calculations. TensorFlow.js storage-quantized weights become floating-point values when loaded, so a smaller download does not guarantee faster predictions or lower runtime memory.",
    aliases: ["quantize", "quantized"],
    scope: "global",
  },
  {
    term: "pruning",
    definition:
      "Removing weights or units, then checking whether predictions remain useful. Setting dense weights to zero alone may leave the same storage and calculations; removing whole units can change both.",
    aliases: ["prune", "pruned"],
    scope: "global",
  },
  {
    term: "distillation",
    definition:
      "Training a student model using a teacher model as a source of targets or intermediate representations, sometimes alongside labeled data. The student may be smaller; matching the teacher does not guarantee its accuracy.",
    aliases: ["distill", "knowledge distillation"],
    scope: "global",
  },
  {
    term: "federated learning",
    definition:
      "Coordinating training across clients while keeping raw training records local. Clients share updates or statistics, which can still leak information; federation alone is not a privacy guarantee.",
    aliases: ["federated", "federated averaging"],
    scope: "global",
  },
  {
    term: "sparsity",
    definition:
      "The fraction of values that are zero. Saving space or work requires storage or code that can skip those zeros; ordinary dense arrays still keep their slots.",
    aliases: ["sparse"],
    scope: "global",
  },
  {
    term: "pretrained",
    definition:
      "A model whose parameters were learned before the current task. You can reuse it for inference or adapt it through further training.",
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
      "A browser API for graphics and general GPU computation. Whether it runs a model faster than WebGL, WASM or CPU depends on the model, runtime, device and workload.",
    aliases: ["WebGPU"],
    scope: "global",
  },
  {
    term: "wasm",
    definition:
      "WebAssembly, a portable low-level code format. TFJS offers a CPU-based WASM backend; it can be useful even when a GPU is available, depending on the workload.",
    aliases: ["WASM", "WebAssembly"],
    scope: "global",
  },
  {
    term: "opset",
    definition:
      "A versioned set of ONNX operator definitions. The target runtime must support the graph operators and their versions; lowering the export opset is not a universal fix for unsupported operations.",
    aliases: ["op-set", "operator set", "operator-set"],
    scope: "global",
  },
  {
    term: "data-drift",
    definition:
      "Incoming data changing from the data in a reference period. This may affect predictions, but the change alone does not prove accuracy has fallen.",
    aliases: ["data drift"],
    scope: "global",
  },
  {
    term: "population stability index",
    definition:
      "A score comparing proportions in fixed bins between two datasets. Results depend on binning and treatment of empty bins; common numeric cutoffs are conventions, not universal significance thresholds.",
    aliases: ["PSI", "population-stability-index"],
    scope: "global",
  },
  {
    term: "Kolmogorov-Smirnov",
    definition:
      "A statistic measuring the largest gap between cumulative distributions. It can reveal marginal distribution changes that means miss; statistical interpretation depends on sampling assumptions.",
    aliases: ["Kolmogorov-Smirnov statistic", "KS statistic"],
    scope: "global",
  },
  {
    term: "shadow model",
    definition:
      "A model that scores the same inputs as the one in service, with its verdicts logged and never acted on. Keeping the old model in shadow after a new one goes live gives every new verdict something to be checked against.",
    aliases: [
      "shadow models",
      "shadow inference",
      "shadow deployment",
      "shadow deployments",
    ],
    scope: "global",
  },
  {
    term: "canary",
    definition:
      "A first deploy to a small slice of the fleet, watched on live traffic while everything else keeps running the old version. A bad build then reaches that slice instead of every user, at the cost of the time the watch takes.",
    aliases: ["canaries", "canary deployment", "canary deployments"],
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
    term: "feature",
    definition:
      "An input measurement or property used for prediction, such as amplitude or a category stored as numbers. This course names the feature tensor xs.",
    aliases: ["features"],
    scope: "global",
  },
  {
    term: "label",
    definition:
      "The answer used to train or check a prediction, such as a class or a later reading. This course names the label tensor ys.",
    aliases: ["labels"],
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
      "A numerical function of the outcome of a random process, described by a probability distribution. Observed time series need not have a stable distribution over time.",
    aliases: ["random variables"],
    scope: "global",
  },
  {
    term: "probability distribution",
    definition:
      "A description of the probabilities assigned to possible outcomes. A discrete variable can use a probability mass function; many continuous variables use a probability density function.",
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
      "A probability-weighted average, when it exists. A sample mean can estimate it under suitable sampling assumptions; many training losses estimate an expected per-example loss.",
    aliases: ["expectation"],
    scope: "global",
  },
  {
    term: "normal distribution",
    definition:
      "A bell-shaped distribution specified by its mean and positive standard deviation. Some sums approach it under central-limit conditions; individual sensor readings need not be normal.",
    aliases: ["Gaussian", "Gaussian distribution", "bell curve"],
    scope: "global",
  },
  {
    term: "central limit theorem",
    definition:
      "For independent, identically distributed variables with finite nonzero variance, the standardized sample mean approaches a normal distribution as sample size grows. This does not make the original observations normal or automatically justify a 3-sigma anomaly rule.",
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
      "A nonzero vector that a square matrix maps to a scalar multiple of itself; the scalar is its eigenvalue. Repeated multiplication depends on eigenvalue magnitudes and the initial vector, with additional conditions needed for power-iteration convergence.",
    aliases: ["eigenvectors", "eigenvalue", "eigenvalues"],
    scope: "global",
  },
  {
    term: "SVD",
    definition:
      "Singular Value Decomposition: a real matrix factors into orthogonal directions and nonnegative singular values. Keeping the largest singular values gives a best fixed-rank approximation in Frobenius or spectral norm, not necessarily in prediction quality.",
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
      "Approximating a matrix using factors with a smaller inner dimension. This differs from low-rank fine-tuning methods that learn an update while retaining the base matrix.",
    aliases: ["low-rank", "low rank"],
    scope: "global",
  },
].map((entry) => {
  const documentation = CONCEPT_DOCUMENTATION[entry.term];
  if (!documentation)
    throw new Error(`Missing documentation for ${entry.term}`);
  return { ...entry, documentation };
});
