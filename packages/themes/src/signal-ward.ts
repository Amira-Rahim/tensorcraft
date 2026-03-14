import type { ThemeManifest } from "./types";

export const signalWard: ThemeManifest = {
  id: "medical",
  slug: "signal-ward",
  displayName: "Signal Ward",
  tagline: "Decode language. Save lives.",
  description:
    "Meridian General Hospital's diagnostic AI crashed during a patient surge. Build Diagnostic One — a clinical text intelligence assistant.",
  status: "coming-soon",
  palette: {
    bg: "#1C1C1C",
    primary: "#5BAA70",
    accent: "#7096B0",
    surface: "#252525",
    text: "#C8C8C8",
    muted: "#5A5A5A",
    surfaceOverlay: "#313131",
    border: "#2A2A2A",
    codeBg: "#161616",
  },
  terminology: {
    lesson: "Procedure",
    module: "Ward",
    exercise: "Diagnosis",
  },
  protagonist: "Clinical Engineer",
  sandpackTheme: "nightOwl",
  characters: [
    {
      name: "Dr. Vasquez",
      role: "Mentor",
      personality: "Shows concern through action, not speeches",
    },
    {
      name: "Dr. Obi",
      role: "Radiologist",
      personality: "Precise, catches what AI misses",
    },
    {
      name: "Nurse Santos",
      role: "Stakeholder",
      personality: "Patient advocate, practical",
    },
    {
      name: "Dr. Khalil",
      role: "Skeptic",
      personality: "Distrusts AI but convinced by results",
    },
    {
      name: "MEDI",
      role: "Hospital AI",
      personality: "Gentle, careful with uncertainty",
    },
  ],
  comingSoon: {
    previewArt: "/themes/medical/preview.webp",
    storySummary:
      "Meridian General Hospital's AI diagnostic system crashed during the worst patient surge in a decade. You're a Clinical Engineer brought in to rebuild Diagnostic One. You'll build an NLP-powered clinical text assistant — browser-based, privacy-preserving.",
    modelPreview:
      "Diagnostic One: clinical text intelligence using transformers, NER, RAG, and multimodal analysis",
    estimatedLaunchDate: "2027-Q3",
  },
  specialization: "NLP & Text Intelligence",
  modelBuilt: "Diagnostic One — clinical text assistant",
  careerPaths: ["NLP Engineer ($114K–$237K)", "LLM/AI Engineer ($174K–$350K)"],
};
