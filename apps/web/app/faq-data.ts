import { PRICING } from "@tensorcraft/shared";

/**
 * Single source for the landing FAQ: the visible <details> section on the
 * landing page AND the sitewide FAQPage JSON-LD in layout.tsx both map over
 * this list, keeping schema and on-page content from drifting apart.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I learn machine learning with JavaScript?",
    a: "Yes. Tensorcraft teaches machine learning entirely in JavaScript and TypeScript using TensorFlow.js. Models train and run in the browser in these lessons, and the same TensorFlow.js code runs under Node. No Python required. The launched world covers neural networks, LSTMs, signal processing, and attention. CNNs and full transformer architectures are not covered.",
  },
  // The next three absorb the load-bearing "Skip it if you" objections when
  // the landing Who This Is For section was cut (2026-08-16): Python-stack
  // mismatch, no video track, and the time commitment. Everything else in
  // that section restated the hero or existing FAQ answers.
  {
    q: "What if I need Python or PyTorch?",
    a: "Then skip Tensorcraft. It is TensorFlow.js end to end, a deliberate constraint, not a stepping stone to the Python stack. The concepts transfer (tensors, loss functions, gradient descent); the tooling does not.",
  },
  {
    q: "How much math do I need?",
    a: "None upfront. You need working JavaScript: comfortable with functions, arrays, and async. The math is there when you want it: derivations sit in optional expandable drawers, and you can finish every module without opening one.",
  },
  {
    q: "Is there a video track?",
    a: "No. Lessons are written scenes with runnable code, and exercises gate progress: you advance by making the checks pass, not by watching. If you learn best from video, this format will fight you.",
  },
  {
    q: "How long does Deep Orbit take?",
    a: "Deep Orbit is 56 lessons across 11 modules, meant to be worked in order; the later modules assume the earlier ones. It is not a weekend skim. Per-module time estimates are listed with the curriculum on the pricing page.",
  },
  {
    q: "Is Tensorcraft free?",
    a: `Module 1 of Deep Orbit, the live world, is free, no account or credit card required. The full world costs $${PRICING.single.price}: one payment, lifetime access.`,
  },
  {
    q: "What if it turns out not to be for me?",
    a: "Module 1 is free before any money moves. After purchase there's a 14-day money-back guarantee: full refund, no questions asked. Email support@tensorcraft.app.",
  },
];
