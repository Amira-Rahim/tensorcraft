"use client";

import type { ReactNode } from "react";
import { ReviewPromptCard, type RecallAction } from "../review-prompt-card";

interface RecallPromptProps {
  question: string;
  children?: ReactNode;
  answer?: string;
  onAnswer?: (result: RecallAction) => void;
}

export function RecallPrompt({
  question,
  children,
  answer,
  onAnswer,
}: RecallPromptProps) {
  return (
    <ReviewPromptCard
      question={question}
      answer={children ?? answer}
      onAction={onAnswer}
    />
  );
}
