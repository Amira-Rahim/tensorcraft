import type { ThemeManifest } from "./types";

export const neonProtocol: ThemeManifest = {
  id: "cyberpunk",
  slug: "neon-protocol",
  displayName: "Neon Protocol",
  tagline: "See the city through the eyes of AI",
  description:
    "NeuralCore HQ. 200 surveillance cameras went dark overnight. Rebuild Protocol Sentinel, an urban anomaly detection system.",
  palette: {
    bg: "#1C1C1C",
    primary: "#4A90D9",
    accent: "#A07090",
    surface: "#252525",
    text: "#E0E0E0",
    muted: "#A0A0A0",
    surfaceOverlay: "#313131",
    border: "#2A2A2A",
    codeBg: "#161616",
  },
  terminology: {
    lesson: "Protocol",
    module: "Sector",
    exercise: "Simulation",
  },
  protagonist: "Protocol Engineer",
  sandpackTheme: "nightOwl",
  characters: [
    {
      name: "Kira Tanaka",
      role: "Mentor",
      personality: "Sharp, demanding, brilliant",
    },
    {
      name: "Zara",
      role: "Vision Specialist",
      personality: "Methodical, detail-oriented",
    },
    {
      name: "Ryo",
      role: "Skeptic",
      personality: "Questions everything, proves through data",
    },
    {
      name: "Lin",
      role: "Performance Engineer",
      personality: "Obsessed with latency and optimization",
    },
    {
      name: "NEON",
      role: "City AI",
      personality: "Sarcastic, deadpan humor",
    },
  ],
  specialization: "Real-Time Computer Vision",
  modelBuilt: "Protocol Sentinel: urban anomaly detector",
  careerPaths: [
    "CV Engineer ($102K-$168K)",
    "Perception Engineer ($168K-$333K)",
  ],
  preview: {
    statusBoard: {
      org: "NEURALCORE HQ · SURVEILLANCE GRID",
      status: "200 CAMERAS DARK · REBUILD PENDING",
    },
    ctaLabel: "Get the signal",
    modules: [
      { order: 1, title: "ML Through Vision", free: true },
      { order: 2, title: "Image Data" },
      { order: 3, title: "Convolutional Neural Networks" },
      { order: 4, title: "Object Detection" },
      { order: 5, title: "Segmentation" },
      { order: 6, title: "Feature Extraction" },
      { order: 7, title: "Transfer Learning" },
      { order: 8, title: "Real-Time Detection" },
      { order: 9, title: "Generative Vision" },
      { order: 10, title: "Deployment" },
      { order: 11, title: "Capstone: Protocol Sentinel", capstone: true },
    ],
    skills: [
      "CNNs",
      "object detection",
      "segmentation",
      "transfer learning",
      "real-time vision",
      "GANs",
      "model optimization",
      "in-browser inference",
    ],
  },
};
