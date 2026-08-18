import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In or Sign Up | Tensorcraft",
  description:
    "Sign in or create your Tensorcraft account to start learning browser-based ML for JavaScript developers.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
