/** Connect each practice view to the authored task, without inventing results. */
export const LESSON_HANDOFFS: Record<string, string> = {
  "introduction-to-tensors":
    "Demir has the chart code ready. Help him turn the selected readings into a tensor and save its shape. Then run the code to see how each sensor’s readings change over time.",
  "tensor-shapes":
    "Farah wants to make sure each line on Demir’s chart follows the right sensor. Help her arrange the same readings by moment, then by sensor. She’ll use those steps to plot the full recording.",
  "tensor-operations":
    "Help Nazari combine the feeds while keeping each channel in place. Average the two passes and adjust the gain. Then combine channels using a weighted sum.",
  "data-loading":
    "Demir cannot keep the whole archive in one growing array. Help him load samples as needed, shuffle them before grouping them into batches, and save later readings for evaluation.",
  normalization:
    "Farah needs inputs on comparable scales for the preview neuron. Calculate scaling statistics from the training batch, scale each feature, and reuse those statistics for a new reading.",
  "first-neuron":
    "Help Farah calculate a score for any reading. Write a tensor function that multiplies inputs by weights, adds the products and bias, and keeps the calculations connected so gradients can flow through them.",
  "activation-functions":
    "Nazari wants to see how the activation changes a score. Apply ReLU to the tensor: negative inputs become zero, and positive inputs stay the same.",
  "layers-and-architecture":
    "Nazari wants the network size before it runs. Build the practice layers and count their weights and biases using the input width.",
  "forward-pass":
    "The bridge demo failed because one reading was missing its batch axis. Add that axis, then run a whole batch through the model with one prediction call.",
  "building-a-network":
    "Mirza's classifier needs more than connected layers. You will assemble the practice network, compare its initial predictions, and record what changes after training.",
  "loss-functions":
    "Farah needs a loss function that matches the model output. Write squared error and cross-entropy for logits, then choose the right cross-entropy form for the supplied output type.",
  "gradient-descent":
    "Nazari wants to reduce the current loss. Find the supplied function’s gradient, then update the weight using the learning rate you explored.",
  backpropagation:
    "Demir needs gradients without testing every weight change by hand. Compare automatic differentiation with a numerical estimate. Restore the weight after each test.",
  "training-loop":
    "Demir needs to stop when validation loss stops improving. Train the supplied model with early stopping, then describe the recent loss trends without guessing why they happened.",
  "evaluating-deep-scan":
    "Mirza needs results on readings the model has never trained on. Train on the supplied training rows, evaluate the separate rows, and compare training accuracy with evaluation accuracy.",
  "why-the-browser":
    "Nazari needs a console that can run the model. Use the exercise’s privacy, offline, and loading requirements to decide where inference belongs.",
  "tensorflow-js-setup":
    "Help Demir get the runtime ready before readings arrive. Request a backend, wait for initialization, and report which backend actually started.",
  "model-loading":
    "The dashboard needs to know what the loaded model accepts. You will load it once, then inspect that model's input shape, output shape and layer count.",
  "inference-pipeline":
    "The bridge needs repeated predictions without leaked tensors. Normalize and classify each reading. Then use the supplied memory snapshots to estimate how many more tensors fit.",
  "onnx-runtime-web":
    "Help Nazari compare runtimes fairly. Give both the same inputs, read their outputs, and measure prediction time separately from loading time.",
  "transformers-js":
    "The crew needs a text model for its reports. Load one sentiment pipeline and reuse it. Keep each result paired with the report it came from.",
  "time-vs-frequency":
    "Farah suspects a difference that is hard to see in the waveform. Compare the captures in time and frequency views. Find the first frequency bin whose difference exceeds the supplied limit.",
  "fourier-transform":
    "Help Farah measure the strongest frequency. Find the strongest FFT bin allowed by the exercise, then use the sample rate to convert its position to hertz.",
  spectrograms:
    "Farah needs to know when a frequency appears. Move a window through the capture and keep each spectrum in time order, with its bins in frequency order.",
  "fft-as-features":
    "Demir needs every input column to have a consistent meaning. Extract amplitude, zero-crossing count, and the selected FFT bins in the required order.",
  "windowing-and-overlap":
    "Help Farah soften the edges of each signal slice before the FFT. Build a symmetric Hann window and multiply it by the samples without changing their order.",
  "sequences-matter":
    "Farah needs the model to see the readings in order. Build input windows and pair each with the next reading. Keep the time and feature axes in the right places.",
  "simple-rnns":
    "Help Demir inspect the state passed from one time step to the next. Calculate it in JavaScript, compare it with the TFJS cell, and track the derivative through the steps.",
  "lstm-gates":
    "Farah needs the model to keep useful information from earlier readings. Calculate one gated memory update, then connect those equations to a one-unit TFJS LSTM.",
  "sliding-windows":
    "Farah found readings shared by training and evaluation windows. Split the stream first, then build windows within each part. Check that no reading appears on both sides.",
  "sequence-prediction":
    "The bridge needs a forecast it can check. Train the supplied model and feed each prediction into the next input window. Keep scaling and physical limits consistent.",
  "normal-vs-anomalous":
    "Nazari needs to know which baseline produced an alert. Write the z-score rule, then check how reviewed normal readings change the expected number of alerts.",
  autoencoders:
    "Help Farah train a model to reconstruct the normal archive. Select unflagged rows and train on those alone. Keep flagged readings out of training.",
  "reconstruction-error":
    "Farah needs to understand a missed anomaly. Measure reconstruction error, then inspect which features contributed to the confirmed miss.",
  "threshold-tuning":
    "Nazari needs an alert workload the crew can handle. Compare thresholds on labeled validation readings, then investigate the separate alert-storm incident.",
  "the-anomaly":
    "Help the crew combine three detector results. Calculate each detector’s vote from the supplied readings and scores, then apply the rule for one alert.",
  "beyond-lstm":
    "Farah wants the current query to use an earlier reading directly. Score its match with each key, turn those scores into weights that sum to one, and combine the values.",
  "temporal-attention":
    "Demir needs the summary to account for time. Add position information to the attention scores, then use the resulting weights to combine the original readings.",
  forecasting:
    "The crew needs to check forecasts beyond the first step. Compare feeding predictions back into the model with using each new observed reading.",
  "kalman-filters":
    "Help Demir balance a prediction with a noisy measurement. Update both the estimate and its uncertainty at each step.",
  "time-series-ensemble-methods":
    "Demir wants to know whether combining forecasts helps. Calculate weights from earlier held-out errors. Compare the combined forecast with the best individual model on the supplied readings.",
  "llms-for-science":
    "The crew needs to check a model’s reply before using it. Parse the supplied API response and reject fields that do not meet the signal report’s requirements.",
  "prompt-engineering":
    "Demir needs to keep the current reading separate from reference facts. Build a prompt with clear sections, labeled values, and the required response format.",
  "rag-for-signals":
    "The crew needs to trace each report claim to evidence. Retrieve matching records, report how many matches were left out, and check each structured claim against the record it cites.",
  "report-generation":
    "Help the crew release only sections that passed review. Assemble them in order. Name the withheld sections, but leave their content out.",
  "multi-model-systems":
    "Help Demir connect DEEP SCAN’s stages. Normalize and classify the reading, then connect the detector and alert generator. Handle failures explicitly.",
  "model-profiling":
    "Nazari wants measurements before another change. Run a warmup, time finished predictions, and separate weight storage from the memory used by the running app.",
  quantization:
    "Help Nazari shrink stored weights and check prediction changes. Quantize and decode the kernel weights, keep biases at float32, and compare the outputs.",
  pruning:
    "One accuracy score can hide a failure in a single class. Help Demir set weights to zero at each requested sparsity level and measure recall for every class.",
  "caching-strategies":
    "Nazari needs cached results from the current model. Build the prediction cache, then check stored entries against their version and age limit.",
  "webgpu-acceleration":
    "The oldest console still needs a working backend. Try the supplied preference order and check each attempt before reporting success.",
  "system-architecture":
    "Mirza needs the parts to work together. Connect stages that can run asynchronously. Validate each stage’s input, and identify the stage if validation fails.",
  "ci-cd-pipeline":
    "Nazari needs to release the same model that passed the tests. Build the prediction gate and export a manifest describing the saved model’s tensors and weight bytes.",
  monitoring:
    "Help ARIA track changes after deployment. Record model scores, completed prediction times, and input drift. Show when no measurement is available instead of reporting zero.",
  documentation:
    "Farah needs another crew member to operate the model. Turn the supplied metadata into a Model Card that explains performance, limits, and input conventions.",
  launch:
    "Help the bridge check its release procedure. Run the small training rehearsal, verify deployment checks with timeouts and clear failures, and apply the fictional signal’s final decision rule.",
};
