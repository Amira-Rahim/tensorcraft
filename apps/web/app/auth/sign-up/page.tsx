import { Suspense } from "react";
import { AuthForm } from "../../components/auth-form";
import { AmbientBackground } from "../../components/ambient-background";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16 relative overflow-hidden">
      <AmbientBackground count={220} />
      <Suspense>
        <AuthForm mode="sign-up" />
      </Suspense>
    </main>
  );
}
