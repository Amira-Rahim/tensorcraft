"use client";

import { createContext, useContext } from "react";

/** True only after the provider initializes capture with current consent. */
export const AnalyticsReadyContext = createContext(false);

export function useAnalyticsReady() {
  return useContext(AnalyticsReadyContext);
}
