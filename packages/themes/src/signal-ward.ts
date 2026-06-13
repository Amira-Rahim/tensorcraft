import type { ThemeManifest } from "./types";

export const signalWard: ThemeManifest = {
  id: "medical",
  slug: "signal-ward",
  displayName: "Signal Ward",
  tagline: "Decode language. Save lives.",
  description:
    "Meridian General Hospital's diagnostic AI crashed during a patient surge. Build Diagnostic One, a clinical text intelligence assistant.",
  palette: {
    bg: "#1C1C1C",
    primary: "#65C07D",
    accent: "#7096B0",
    surface: "#252525",
    text: "#E0E0E0",
    muted: "#A0A0A0",
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
  specialization: "NLP & Text Intelligence",
  modelBuilt: "Diagnostic One: clinical text assistant",
  careerPaths: ["NLP Engineer ($114K-$237K)", "LLM/AI Engineer ($174K-$350K)"],
  preview: {
    statusBoard: {
      org: "MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD",
      status: "SYSTEM OFFLINE · REBUILD PENDING",
    },
    ctaLabel: "Get paged",
    modules: [
      { order: 1, title: "ML Through Text", free: true },
      { order: 2, title: "Tokenization & Preprocessing" },
      { order: 3, title: "Word Embeddings" },
      { order: 4, title: "Sequence Models" },
      { order: 5, title: "Attention Mechanisms" },
      { order: 6, title: "Transformers & BERT" },
      { order: 7, title: "Named Entity Recognition" },
      { order: 8, title: "Text Classification & Triage" },
      { order: 9, title: "Question Answering & RAG" },
      { order: 10, title: "Production NLP & Privacy" },
      { order: 11, title: "Capstone: Diagnostic One", capstone: true },
    ],
    skills: [
      "tokenization",
      "embeddings",
      "RNNs/LSTMs",
      "self-attention",
      "transformers & BERT",
      "NER",
      "RAG",
      "clinical NLP",
    ],
  },
};
