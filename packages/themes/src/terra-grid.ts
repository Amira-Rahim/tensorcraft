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
    accent: "#6BAA8A",
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
};
