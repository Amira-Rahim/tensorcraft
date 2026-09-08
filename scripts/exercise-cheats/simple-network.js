// Builds the right stack, 833 parameters and all, then compiles it with
// whichever optimizer came to mind and no metrics list. It treats compile() as
// a formality that has to be called rather than the place the training recipe
// is chosen, so the loss is right by luck and nothing tracks accuracy.
const model = tf.sequential();
model.add(tf.layers.dense({ units: 32, activation: "relu", inputShape: [8] }));
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

model.compile({ optimizer: "sgd", loss: "binaryCrossentropy" });
