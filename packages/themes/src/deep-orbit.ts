import type { ThemeManifest } from "./types";

export const deepOrbit: ThemeManifest = {
  id: "space",
  slug: "deep-orbit",
  displayName: "Deep Orbit",
  tagline: "Navigate the unknown through signals",
  description:
    "Research vessel Archimedes has entered an uncharted nebula. The ship's AI is failing. Build DEEP SCAN, a deep-space signal classifier.",
  palette: {
    bg: "#1C1C1C",
    primary: "#6BAA8A",
    accent: "#A89060",
    surface: "#252525",
    text: "#E0E0E0",
    muted: "#A0A0A0",
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
      name: "Commander Mirza",
      role: "Mentor",
      personality: "Calm authority, measured decisions",
    },
    {
      name: "Dr. Farah",
      role: "Astrophysicist",
      personality: "Curious, data-driven",
    },
    {
      name: "Chief Nazari",
      role: "Skeptic",
      personality:
        "Distrusts ML: a rule-based system froze on his last mission",
    },
    {
      name: "Ensign Demir",
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
  modelBuilt: "DEEP SCAN: deep-space signal classifier",
  careerPaths: [
    "Signal Processing Engineer ($108K-$258K)",
    "Time-Series ML Engineer ($120K-$200K)",
    "IoT ML Engineer ($110K-$180K)",
  ],
};
