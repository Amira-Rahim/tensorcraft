import type { ThemeManifest } from "./types";

export const terraGrid: ThemeManifest = {
  id: "industrial",
  slug: "terra-grid",
  displayName: "Terra Grid",
  tagline: "Where models meet the real world",
  description:
    "TERRA SYSTEMS' ML models achieve 99.9% in the lab and 67% in the field. Build Terra Grid Intelligence, an edge-deployed monitoring system.",
  palette: {
    bg: "#1C1C1C",
    primary: "#C49535",
    accent: "#8FB05A",
    surface: "#252525",
    text: "#E0E0E0",
    muted: "#A0A0A0",
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
  specialization: "Edge AI & Production ML",
  modelBuilt: "Terra Grid Intelligence: edge monitoring system",
  careerPaths: [
    "MLOps Engineer ($120K-$260K)",
    "Edge AI Engineer ($115K-$220K)",
    "Production ML Engineer ($130K-$240K)",
  ],
  preview: {
    statusBoard: {
      org: "TERRA SYSTEMS · GLOBAL OPERATIONS",
      status: "FIELD ACCURACY 67% · INTERVENTION REQUIRED",
    },
    ctaLabel: "Put me on call",
    modules: [
      { order: 1, title: "Edge AI Basics", free: true },
      { order: 2, title: "Model Optimization Fundamentals" },
      { order: 3, title: "Quantization" },
      { order: 4, title: "Pruning & Distillation" },
      { order: 5, title: "Edge Deployment" },
      { order: 6, title: "MLOps Pipelines" },
      { order: 7, title: "Monitoring & Drift Detection" },
      { order: 8, title: "Federated Learning" },
      { order: 9, title: "A/B Testing Models" },
      { order: 10, title: "Scale & Reliability" },
      { order: 11, title: "Capstone: Terra Grid Intelligence", capstone: true },
    ],
    skills: [
      "quantization",
      "pruning & distillation",
      "edge deployment",
      "MLOps pipelines",
      "drift detection",
      "federated learning",
      "A/B testing",
      "reliability at scale",
    ],
  },
};
