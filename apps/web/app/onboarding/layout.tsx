import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started | Tensorcraft",
  description:
    "You already think like an ML engineer. Set your background, goals, and pick a theme to begin.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
