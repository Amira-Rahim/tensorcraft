import type { ThemeManifest } from "./types";

export const deepOrbit: ThemeManifest = {
  id: "space",
  slug: "deep-orbit",
  displayName: "Deep Orbit",
  tagline: "Navigate the unknown through signals",
  description:
    "Research vessel Artemis VII has entered an uncharted nebula. The ship's AI is failing. Build DEEP SCAN — a deep-space signal classifier.",
  status: "launched",
  palette: {
    bg: "#1C1C1C",
    primary: "#6BAA8A",
    accent: "#A89060",
    surface: "#252525",
    text: "#C8C8C8",
    muted: "#8A8A8A",
    surfaceOverlay: "#313131",
    border: "#2A2A2A",
    codeBg: "#161616",
  },
  terminology: {
    lesson: "Mission",
    module: "Sector",
    exercise: "Simulation",
  },
  protagonist: "Systems Engineer",
  sandpackTheme: "nightOwl",
  characters: [
    {
      name: "Commander Okafor",
      role: "Mentor",
      personality: "Calm authority, measured decisions",
    },
    {
      name: "Dr. Sato",
      role: "Astrophysicist",
      personality: "Curious, data-driven",
    },
    {
      name: "Chief Torres",
      role: "Skeptic",
      personality:
        "Distrusts ML — a rule-based system froze on his last mission",
    },
    {
      name: "Ensign Park",
      role: "Communications",
      personality: "Eager, quick learner",
    },
    {
      name: "ARIA",
      role: "Ship AI",
      personality: "Dry-witted, precise",
    },
  ],
  specialization: "Time-Series & Signals",
  modelBuilt: "DEEP SCAN — deep-space signal classifier",
  careerPaths: [
    "Signal Processing Engineer ($108K–$258K)",
    "Time-Series ML Engineer ($120K–$200K)",
    "IoT ML Engineer ($110K–$180K)",
  ],
};
