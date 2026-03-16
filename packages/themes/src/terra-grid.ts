import type { ThemeManifest } from "./types";

export const terraGrid: ThemeManifest = {
  id: "industrial",
  slug: "terra-grid",
  displayName: "Terra Grid",
  tagline: "Where models meet the real world",
  description:
    "TERRA SYSTEMS' ML models achieve 99.9% in the lab and 67% in the field. Build Terra Grid Intelligence — an edge-deployed monitoring system.",
  status: "coming-soon",
  palette: {
    bg: "#1C1C1C",
    primary: "#B08030",
    accent: "#6BAA8A",
    surface: "#252525",
    text: "#C8C8C8",
    muted: "#8A8A8A",
    surfaceOverlay: "#313131",
    border: "#2A2A2A",
    codeBg: "#161616",
  },
  terminology: {
    lesson: "Operation",
    module: "Station",
    exercise: "Deployment",
  },
  protagonist: "Infrastructure Engineer",
  sandpackTheme: "nightOwl",
  characters: [
    {
      name: "Chief Engineer Amira Hassan",
      role: "Mentor",
      personality: "Pragmatic, impatient with research-grade solutions",
    },
    {
      name: "Marcus Cole",
      role: "Peer",
      personality: "DevOps lead, automation-first thinker",
    },
    {
      name: "Dr. Nina Park",
      role: "Skeptic",
      personality: "Data scientist who builds models but never deploys them",
    },
    {
      name: "Operator Jin",
      role: "Stakeholder",
      personality: "Field operator, needs it to work on a tablet in the desert",
    },
    {
      name: "GRID",
      role: "Infrastructure AI",
      personality: "Matter-of-fact, metrics-obsessed",
    },
  ],
  comingSoon: {
    previewArt: "/themes/industrial/preview.webp",
    storySummary:
      "TERRA SYSTEMS manages power, water, and logistics across 47 remote sites. Their ML models achieve 99.9% in the lab and 67% in the field. You'll build Terra Grid Intelligence — an edge-deployed monitoring system optimized for real-world constraints. Quantized, cached, offline-first, production-ready.",
    modelPreview:
      "Terra Grid Intelligence: edge-deployed ML with quantization, ONNX, Service Workers, Chrome AI, and MLOps monitoring",
    estimatedLaunchDate: "2028-Q3",
  },
  specialization: "Edge AI & Production ML",
  modelBuilt: "Terra Grid Intelligence — edge monitoring system",
  careerPaths: [
    "MLOps Engineer ($120K–$260K)",
    "Edge AI Engineer ($115K–$220K)",
    "Production ML Engineer ($130K–$240K)",
  ],
};
