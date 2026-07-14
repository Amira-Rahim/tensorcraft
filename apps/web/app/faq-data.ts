import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";

/**
 * Single source for the landing FAQ: the visible <details> section on the
 * landing page AND the sitewide FAQPage JSON-LD in layout.tsx both map over
 * this list, keeping schema and on-page content from drifting apart.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I learn machine learning with JavaScript?",
    a: "Yes. Tensorcraft teaches machine learning entirely in JavaScript and TypeScript using TensorFlow.js. Models train and run in the browser, no Python required. The launched theme covers neural networks, LSTMs, signal processing, and attention today; CNNs and full transformer architectures arrive with the Computer Vision and NLP themes now in development.",
  },
  {
    q: "How does Tensorcraft teach ML to frontend developers?",
    a: `Through ${THEME_CONTENT.lessonBridges} 'bridge' analogies that map frontend concepts you already know (like useState, Array.map, and fetch) to their ML equivalents (model weights, tensor operations, and inference APIs). Each course is a story-driven narrative where you build real ML models.`,
  },
  {
    q: "How much math do I need?",
    a: "None upfront. You need working JavaScript: comfortable with functions, arrays, and async. The math is there when you want it: derivations sit in optional expandable drawers, and you can finish every module without opening one.",
  },
  {
    q: "Is Tensorcraft free?",
    a: `Module 1 of Deep Orbit, the live theme, is free, no account or credit card required. The other four themes ship in waves, each with a waitlist. Full themes cost $${PRICING.single.price} each, with bundle discounts available up to $${PRICING.allFive.price} for all 5 themes.`,
  },
  {
    q: "What ML topics does Tensorcraft cover?",
    a: "Five specializations, one live today and four in development: Time-Series & Signals (RNNs, LSTMs — live now), Computer Vision (CNNs, YOLO), NLP & Text Intelligence (Transformers, BERT), Multimodal & Generative AI (GANs, Diffusion), and Edge AI & Production ML (quantization, MLOps).",
  },
  {
    q: "What if it turns out not to be for me?",
    a: "Module 1 is free before any money moves. After purchase there's a 14-day money-back guarantee: full refund if you've used less than 20% of a theme.",
  },
];
