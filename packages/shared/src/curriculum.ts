import { WORLD_SLUGS, isLaunched, type WorldSlug } from "./constants";

/** Transfer references recommend a refresher; they do not certify mastery. */
export const TRANSFER_CAPABILITIES = {
  tensors: {
    label: "Array shape and axis meaning",
    href: "/worlds/deep-orbit/foundations/tensor-shapes?start=concept",
  },
  weightedSums: {
    label: "Weighted sums",
    href: "/worlds/deep-orbit/foundations/tensor-operations?start=concept",
  },
  preprocessing: {
    label: "Saved preprocessing",
    href: "/worlds/deep-orbit/foundations/normalization?start=concept",
  },
  evaluation: {
    label: "Baselines and error costs",
    href: "/worlds/deep-orbit/training-loop/evaluating-deep-scan?start=concept",
  },
  artifacts: {
    label: "Versioned model loading",
    href: "/worlds/deep-orbit/browser-runtimes/model-loading?start=concept",
  },
  attention: {
    label: "Attention as a weighted sum",
    href: "/worlds/deep-orbit/advanced-time-series/beyond-lstm?start=concept",
  },
  operations: {
    label: "Evaluation before release",
    href: "/worlds/deep-orbit/capstone/launch?start=challenge",
  },
} as const;
export type TransferCapability = keyof typeof TRANSFER_CAPABILITIES;

interface WorldLearningScope {
  outcome: string;
  reuses: readonly TransferCapability[];
  adds: string;
  sourceModules: readonly string[];
  releaseReview: string;
}

/** Authored scope, not a claim that the four forthcoming courses passed QA. */
export const WORLD_LEARNING_SCOPE: Record<WorldSlug, WorldLearningScope> = {
  "deep-orbit": {
    outcome:
      "Build and evaluate a browser signal pipeline, then apply the engineering to a separate sensor project.",
    reuses: [],
    adds: "Tensors, training, signal features, anomaly thresholds and a versioned inference pipeline.",
    sourceModules: [
      "foundations",
      "signal-processing",
      "anomaly-detection",
      "capstone",
    ],
    releaseReview:
      "Launched course. Current improvements are undergoing release verification.",
  },
  "neon-protocol": {
    outcome:
      "Build an image-processing pipeline that locates objects and evaluates boxes and pixel masks.",
    reuses: [
      "tensors",
      "weightedSums",
      "preprocessing",
      "evaluation",
      "artifacts",
    ],
    adds: "Spatial filters, convolutional networks, transfer learning, object detection and segmentation.",
    sourceModules: [
      "image-data",
      "convolutional-neural-networks",
      "object-detection",
      "segmentation",
      "deployment",
    ],
    releaseReview:
      "Full course requires editorial, numerical, image-data privacy and deployment review. Only the small vision sample is available.",
  },
  "signal-ward": {
    outcome:
      "Build a text-processing prototype that extracts spans and routes documents for human review.",
    reuses: [
      "tensors",
      "preprocessing",
      "attention",
      "evaluation",
      "artifacts",
    ],
    adds: "Tokenization, embeddings, named-entity recognition, text classification and transformer encoders.",
    sourceModules: [
      "tokenization-preprocessing",
      "named-entity-recognition",
      "text-classification",
      "transformers-bert",
      "production-privacy",
    ],
    releaseReview:
      "Requires full course review plus separate clinical, privacy and legal review. Fictional cases are not clinical guidance or evidence of diagnostic safety.",
  },
  "nova-canvas": {
    outcome:
      "Build a generative prototype with controls and evaluate how those controls change its output.",
    reuses: ["tensors", "weightedSums", "artifacts", "evaluation"],
    adds: "Latent spaces, GANs, variational autoencoders, diffusion, style transfer and multimodal alignment.",
    sourceModules: [
      "latent-spaces",
      "generative-adversarial-networks",
      "variational-autoencoders",
      "diffusion-models",
      "clip-alignment",
    ],
    releaseReview:
      "Requires full course review, model and dataset licensing checks, realistic device measurements and responsible generation review.",
  },
  "terra-grid": {
    outcome:
      "Build a versioned edge-model rollout with monitoring and a rehearsed rollback.",
    reuses: ["preprocessing", "evaluation", "artifacts", "operations"],
    adds: "Quantization, pruning, distillation, drift monitoring, federated learning and staged device updates.",
    sourceModules: [
      "quantization",
      "pruning-distillation",
      "monitoring-drift",
      "federated-learning",
      "edge-deployment",
    ],
    releaseReview:
      "Requires full course review, real target-device checks and separate review of privacy claims. Federated training alone does not guarantee privacy.",
  },
};

/** The purchase gate remains isLaunched; a sample never unlocks a course. */
export const WORLD_RELEASE = Object.fromEntries(
  WORLD_SLUGS.map((slug) => [
    slug,
    {
      status: isLaunched(slug)
        ? "available"
        : slug === "neon-protocol"
          ? "preview"
          : "forthcoming",
      courseAvailable: isLaunched(slug),
      previewHref:
        slug === "neon-protocol"
          ? "/worlds/neon-protocol#vision-preview"
          : null,
    },
  ]),
) as Record<
  WorldSlug,
  {
    status: "available" | "preview" | "forthcoming";
    courseAvailable: boolean;
    previewHref: string | null;
  }
>;

export const NEON_PREVIEW_PREREQUISITES = ["tensors", "weightedSums"] as const;
