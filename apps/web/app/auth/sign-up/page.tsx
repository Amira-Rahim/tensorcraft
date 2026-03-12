import { Suspense } from "react";
import { AuthForm } from "../../components/auth-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 relative">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 45%, rgba(0,212,255,0.07), transparent 60%), radial-gradient(ellipse 35% 25% at 50% 40%, rgba(0,212,255,0.05), transparent 50%), radial-gradient(ellipse 80% 50% at 50% 60%, rgba(123,104,238,0.03), transparent 60%)",
        }}
      />
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </main>
  );
}
