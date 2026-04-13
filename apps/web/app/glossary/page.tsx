import type { Metadata } from "next";
import { GlossaryList } from "./glossary-list";

export const metadata: Metadata = {
  title: "ML Glossary for Frontend Engineers — Tensorcraft",
  description:
    "Every ML term explained through the lens of concepts you already know. 50+ terms mapped from JavaScript, React, and CSS to ML equivalents.",
  openGraph: {
    title: "ML Glossary for Frontend Engineers — Tensorcraft",
    description:
      "Every ML term explained through the lens of concepts you already know.",
    url: "https://tensorcraft.app/glossary",
  },
};

export default function GlossaryIndexPage() {
  return (
    <main className="min-h-screen relative px-8 md:px-20 pt-24 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />

      <div className="max-w-4xl relative z-10">
        <div className="font-mono text-xs text-primary tracking-[0.14em] uppercase mb-6 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Glossary
        </div>

        <h1 className="text-4xl md:text-[56px] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-4 uppercase">
          ML Glossary
          <br />
          <span className="text-primary">for Frontend Engineers</span>
        </h1>

        <p className="text-lg font-mono text-text-muted leading-relaxed max-w-140 mb-12">
          Every ML term explained through the lens of concepts you already know
        </p>

        <GlossaryList />
      </div>
    </main>
  );
}
