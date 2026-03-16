import type { ThemeManifest } from "./types";

export const neonProtocol: ThemeManifest = {
  id: "cyberpunk",
  slug: "neon-protocol",
  displayName: "Neon Protocol",
  tagline: "See the city through the eyes of AI",
  description:
    "NeuralCore HQ. 200 surveillance cameras went dark overnight. Rebuild Protocol Sentinel — an urban anomaly detection system.",
  status: "coming-soon",
  palette: {
    bg: "#1C1C1C",
    primary: "#4A90D9",
    accent: "#A07090",
    surface: "#252525",
    text: "#C8C8C8",
    muted: "#8A8A8A",
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
  comingSoon: {
    previewArt: "/themes/cyberpunk/preview.webp",
    storySummary:
      "NeuralCore builds the AI that runs the city. 200 surveillance cameras went dark overnight. You're the new Protocol Engineer assigned to rebuild it. You'll build Protocol Sentinel — an urban anomaly detection system processing real-time video feeds.",
    modelPreview:
      "Protocol Sentinel: real-time urban anomaly detection with CNNs, YOLO, SAM, and MediaPipe",
    estimatedLaunchDate: "2027-Q1",
  },
  specialization: "Real-Time Computer Vision",
  modelBuilt: "Protocol Sentinel — urban anomaly detector",
  careerPaths: [
    "CV Engineer ($102K–$168K)",
    "Perception Engineer ($168K–$333K)",
  ],
};
