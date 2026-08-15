import type { WorldManifest } from "./types";

export const deepOrbit: WorldManifest = {
  id: "space",
  slug: "deep-orbit",
  displayName: "Deep Orbit",
  tagline: "Where signals guide you through the unknown",
  description:
    "Research vessel Archimedes has entered an uncharted nebula. The ship's AI is failing. Build DEEP SCAN, a deep-space signal classifier.",
  palette: {
    bg: "#181818",
    primary: "#6BAA8A",
    accent: "#A89060",
    surface: "#232323",
    text: "#E0E0E0",
    muted: "#B0B0B0",
    surfaceOverlay: "#313131",
    border: "#3D3D3D",
    codeBg: "#141414",
  },
  paletteLight: {
    bg: "#F5F5F2",
    primary: "#3B6550",
    accent: "#6B5A3B",
    surface: "#FFFFFF",
    text: "#1F1F1F",
    muted: "#555555",
    surfaceOverlay: "#FFFFFF",
    border: "#D8D8D4",
    codeBg: "#F6F6F2",
  },
  terminology: {
    lesson: "Mission",
    module: "Sector",
    exercise: "Simulation",
  },
  protagonist: "Systems Engineer",
  characters: [
    {
      name: "Commander Mirza",
      role: "Mentor",
      personality: "Calm authority, measured decisions",
      slug: "commander-mirza",
      expressions: ["neutral", "resolved", "concerned", "approving"],
    },
    {
      name: "Dr. Farah",
      role: "Astrophysicist",
      personality: "Curious, data-driven",
      slug: "dr-farah",
      expressions: ["neutral", "delighted", "absorbed", "shaken"],
    },
    {
      name: "Chief Nazari",
      role: "Skeptic",
      personality:
        "Distrusts ML: a rule-based system froze on her last mission",
      slug: "chief-nazari",
      expressions: ["neutral", "skeptical", "grudging-respect", "haunted"],
    },
    {
      name: "Ensign Demir",
      role: "Communications",
      personality: "Eager, quick learner",
      slug: "ensign-demir",
      expressions: ["neutral", "overwhelmed", "breakthrough", "focused"],
    },
    {
      name: "ARIA",
      role: "Ship AI",
      personality: "Dry-witted, precise",
      slug: "aria",
      isAI: true,
      expressions: ["neutral", "emphasis", "deadpan", "alarm"],
    },
  ],
  specialization: "Time-Series & Signals",
  modelBuilt: "DEEP SCAN: deep-space signal classifier",
  careerPaths: [
    "Signal Processing Engineer ($108K-$258K)",
    "Time-Series ML Engineer ($120K-$200K)",
    "IoT ML Engineer ($110K-$180K)",
  ],
};
