import { PRICING } from "@tensorcraft/shared";

/**
 * Single source for the landing FAQ: the visible <details> section on the
 * landing page AND the sitewide FAQPage JSON-LD in layout.tsx both map over
 * this list, keeping schema and on-page content from drifting apart.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I learn machine learning with JavaScript?",
    a: "Yes. Tensorcraft teaches machine learning entirely in JavaScript and TypeScript using TensorFlow.js. Models train and run in the browser, no Python required. The launched world covers neural networks, LSTMs, signal processing, and attention today; CNNs and full transformer architectures arrive with the Computer Vision and NLP worlds now in development.",
  },
  {
    q: "How much math do I need?",
    a: "None upfront. You need working JavaScript: comfortable with functions, arrays, and async. The math is there when you want it: derivations sit in optional expandable drawers, and you can finish every module without opening one.",
  },
  {
    q: "Is Tensorcraft free?",
    a: `Module 1 of Deep Orbit, the live world, is free, no account or credit card required. The other four worlds ship in waves, each with a waitlist. Full worlds cost $${PRICING.single.price} each. Bundle discounts open once all five have launched, up to $${PRICING.allFive.price} for all 5 worlds.`,
  },
  {
    q: "What if it turns out not to be for me?",
    a: "Module 1 is free before any money moves. After purchase there's a 14-day money-back guarantee: full refund, no questions asked. Email support@tensorcraft.app.",
  },
];
