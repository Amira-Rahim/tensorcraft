"use client";

import { useEffect } from "react";
import { trackCheckoutCompleted } from "@/lib/analytics";

export function PurchaseAnalytics({
  planId,
  amount,
}: {
  planId: string;
  amount: number;
}) {
  useEffect(() => {
    trackCheckoutCompleted(planId, amount);
  }, [planId, amount]);

  return null;
}
