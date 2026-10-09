/** Connect each practice view to the authored task, without inventing results. */
export const LESSON_HANDOFFS: Record<string, string> = {
  "introduction-to-tensors":
    "Help Demir prepare the same five values for TensorFlow.js. Create a tensor and save its shape. The supplied code reads the values back so the tests can check that all five readings are preserved.",
  "tensor-shapes":
    "Farah needs to know where each value lands. You will carry the small layout experiment into a twelve-value block: predict the second row, then reshape and read it back.",
  "tensor-operations":
    "Nazari needs the feeds combined without mixing up their channels. You will average the passes and apply gain, then use a weighted channel mix where a sum of products is needed.",
  "data-loading":
    "Demir's archive cannot live in one growing array. You will build a lazy source, shuffle individual training samples before batching, and keep later readings out of the training split.",
  normalization:
    "Farah's fixed preview neuron needs comparable inputs. You will fit statistics on the training batch, scale each feature, then reuse those statistics for a new reading.",
  "first-neuron":
    "Farah needs the weighted sum to work for any reading. You will turn the products you inspected into a tensor function that returns one score and preserves its gradient path.",
  "activation-functions":
    "Nazari needs the score transformation made explicit. You will apply ReLU to the tensor: negative pre-activations become zero and positive ones pass through.",
  "layers-and-architecture":
    "Nazari wants the size quoted before the network runs. You will build the practice stack and calculate its parameter count from the input width, weights and biases.",
  "forward-pass":
    "The bridge demo failed because its input lacked a batch axis. You will add that axis for one reading, then run a whole batch through the model in one prediction call.",
  "building-a-network":
    "Mirza's classifier needs more than connected layers. You will assemble the practice network, compare its initial predictions, and record what changes after training.",
  "loss-functions":
    "Farah needs a loss that matches the output. You will implement squared error and logits cross-entropy, then choose the correct cross-entropy form for the supplied output kind.",
  "gradient-descent":
    "Nazari wants a correction based on the current loss. You will differentiate the supplied function and update the weight using the learning rate you just explored.",
  backpropagation:
    "Demir needs gradients without probing every weight separately. You will compare automatic differentiation with a numerical estimate, restoring the weight after each probe.",
  "training-loop":
    "Demir needs to notice when validation stops improving. You will run the supplied model with early stopping and describe its recent loss trends without guessing their cause.",
  "evaluating-deep-scan":
    "Mirza needs evidence from readings the model has not trained on. You will train on the supplied training rows, evaluate the separate rows, and report the measured accuracy gap.",
  "why-the-browser":
    "Nazari needs inference on a usable console. You will apply the exercise's privacy, offline and loading constraints to decide where a model can run.",
  "tensorflow-js-setup":
    "The console must have a ready runtime before accepting readings. You will request a backend, wait for initialization, and report the backend that actually started.",
  "model-loading":
    "The dashboard needs to know what the loaded model accepts. You will load it once, then inspect that model's input shape, output shape and layer count.",
  "inference-pipeline":
    "The bridge needs repeated predictions without abandoned tensors. You will normalize each reading, classify it, and use the supplied snapshots to estimate remaining tensor capacity.",
  "onnx-runtime-web":
    "Nazari needs a comparison on the same workload. You will send identical inputs through both runtimes, read their outputs, and measure inference separately from loading.",
  "transformers-js":
    "The crew's reports need a text model with the right task. You will load one sentiment pipeline and reuse it across the reports, preserving each result's connection to its input.",
  "time-vs-frequency":
    "Farah suspects a difference the time trace conceals. You will compare the two captures in both views and return the first frequency bin that exceeds the supplied difference limit.",
  "fourier-transform":
    "Farah needs a measured frequency, not a guessed tone. You will find the strongest eligible FFT bin and convert its position to hertz using the capture's sample rate.",
  spectrograms:
    "One spectrum cannot show when a frequency appears. You will move a window through the capture and keep each frame's magnitudes in time and bin order.",
  "fft-as-features":
    "Demir needs every model input to mean the same thing. You will extract the amplitude, zero-crossing count and selected FFT bins in a fixed order.",
  "windowing-and-overlap":
    "Farah needs the abrupt frame edges tapered before the FFT. You will build a symmetric Hann window and multiply it into the capture without reordering samples.",
  "sequences-matter":
    "Farah needs the order of the readings to reach the model. You will form windows, pair each with the following reading, and preserve the time and feature axes.",
  "simple-rnns":
    "Demir needs to see what the recurrent layer carries forward. You will compute the hidden states in JavaScript, compare them with the TFJS cell, and track the derivative through time.",
  "lstm-gates":
    "Farah needs earlier information to survive later readings. You will compute one gated cell update, then connect those same equations to a one-unit TFJS LSTM.",
  "sliding-windows":
    "Farah found shared readings on both sides of the evaluation boundary. You will split the stream first and build windows within each side so the checks can catch any overlap.",
  "sequence-prediction":
    "The bridge needs a forecast it can inspect. You will train the supplied task, roll predictions into the next input window, and keep the feature scales and physical limits consistent.",
  "normal-vs-anomalous":
    "Nazari needs to know which baseline an alert used. You will implement the z-score rule, then examine how reviewed normal readings change the expected alert workload.",
  autoencoders:
    "Farah needs a model of the normal archive. You will select unflagged rows, train the reconstruction model on those rows alone, and keep flagged readings out of the fit.",
  "reconstruction-error":
    "Farah needs more than an alert score. You will measure reconstruction error, then inspect which features explain a confirmed missed anomaly.",
  "threshold-tuning":
    "Nazari needs an alert policy the crew can work with. You will compare candidate thresholds on labeled validation readings, then investigate the separate alert-storm incident.",
  "the-anomaly":
    "The three detectors need an explicit decision rule. You will compute their separate verdicts from the supplied readings and scores before combining them into one alert.",
  "beyond-lstm":
    "Farah wants the current query to reach an earlier reading directly. You will compute its key scores, normalize the weights, and use them to combine the values.",
  "temporal-attention":
    "Demir needs the summary to retain a sense of time. You will add position to the attention scorer, then use its weights to pool the original readings.",
  forecasting:
    "The crew needs to know how a forecast behaves after its first step. You will compare rolling predictions forward with replaying each newly arrived reading.",
  "kalman-filters":
    "Demir needs to balance the previous estimate against a noisy measurement. You will carry the estimate and its uncertainty through each predict-and-correct update.",
  "time-series-ensemble-methods":
    "Demir needs evidence that combining models is worth the work. You will build weights from prior held-out errors and compare the ensemble with its best member on the supplied readings.",
  "llms-for-science":
    "A model reply needs inspection before the crew can use it. You will parse the supplied API response and reject fields that fail the signal report's contract.",
  "prompt-engineering":
    "Demir needs the current reading kept separate from reference facts. You will build a prompt with explicit sections, labeled values and the required output structure.",
  "rag-for-signals":
    "The report needs evidence the crew can trace. You will retrieve the matching records, report omissions, and check each structured claim against its cited record.",
  "report-generation":
    "The crew can release only the sections that passed review. You will assemble validated sections in order and name the withheld sections without including their content.",
  "multi-model-systems":
    "Each stage of DEEP SCAN needs a usable handoff. You will normalize and classify the reading, then wire the detector and alert generator together with explicit failure handling.",
  "model-profiling":
    "Nazari needs measurements before another optimization. You will warm the model, time completed predictions, and distinguish parameter storage from total runtime memory.",
  quantization:
    "Nazari wants smaller weights without hiding prediction changes. You will quantize and decode the kernels, retain float32 biases, and compare the model's outputs.",
  pruning:
    "One accuracy score can hide which class paid for pruning. You will remove weights at each requested sparsity level and measure recall separately for every class.",
  "caching-strategies":
    "Nazari needs cached results to belong to the right model. You will build the inference cache, then audit existing entries against their version and age.",
  "webgpu-acceleration":
    "The oldest console still needs a working backend. You will walk the supplied preference order and verify each attempted backend before reporting success.",
  "system-architecture":
    "Mirza needs the parts to work together. You will assemble asynchronous stages that validate incoming data before processing it and identify the stage when a handoff fails.",
  "ci-cd-pipeline":
    "Nazari needs the tested artifact to be the one being released. You will build the prediction gate and export a model manifest that describes the actual saved weights.",
  monitoring:
    "ARIA needs readings that support investigation after deployment. You will track scores, completed inference times and input drift while keeping an empty history distinguishable from zero.",
  documentation:
    "Farah needs another crew member to operate the model. You will render the supplied metadata into a card that names performance, limits and input conventions.",
  launch:
    "The bridge needs a checked release procedure. You will apply the fictional signal's decision rule, run the small training rehearsal, and verify deployment checks with timeouts and explicit failures.",
};
