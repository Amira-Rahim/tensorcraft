"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

export function PlausibleScript() {
  const [consented, setConsented] = useState(false);
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  useEffect(() => {
    try {
      setConsented(localStorage.getItem("tc-cookie-consent") === "accepted");
    } catch {
      /* localStorage unavailable (private mode); consent stays false */
    }

    // Listen for consent changes
    function handleStorage() {
      try {
        setConsented(localStorage.getItem("tc-cookie-consent") === "accepted");
      } catch {
        /* localStorage unavailable (private mode); consent stays false */
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!domain || !consented) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
